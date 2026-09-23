/**
 * @file factory.js
 * @description Listens for TokenCreated events from PonsV2LaunchFactory.
 *              Maintains a live registry of all bonding curves in SQLite.
 *              Falls back to block-polling if WebSocket/event-subscription fails.
 */

import { parseAbiItem, decodeEventLog, formatEther } from 'viem';
import { publicClient, withRetry, sleep } from './client.js';
import { config } from '../config/env.js';
import {
  insertToken,
  getActiveTokens,
  kvGet,
  kvSet,
} from './database.js';

// ─────────────────────────────────────────────
// ABI — PonsV2LaunchFactory
// ─────────────────────────────────────────────
export const TOKEN_CREATED_ABI = parseAbiItem(
  'event TokenCreated(address indexed token, address indexed curve, address indexed creator, string name, string symbol, uint256 devBuyAmount)'
);

const FACTORY_ADDRESS = /** @type {`0x${string}`} */ (config.factoryAddress);

// ─────────────────────────────────────────────
// In-memory callback registry
// ─────────────────────────────────────────────
/** @type {Array<(token: Object) => void>} */
const onNewTokenCallbacks = [];

/**
 * Register a callback that fires whenever a new token is discovered.
 * @param {(token: Object) => void} cb
 */
export function onNewToken(cb) {
  onNewTokenCallbacks.push(cb);
}

function notifyNewToken(tokenData) {
  for (const cb of onNewTokenCallbacks) {
    try { cb(tokenData); } catch (e) { console.error('[Factory] Callback error:', e.message); }
  }
}

// ─────────────────────────────────────────────
// Event processing
// ─────────────────────────────────────────────

/**
 * Decode raw log into a structured token object and persist it.
 * @param {Object} log - viem log object
 * @param {bigint|null} blockNumber
 * @returns {Object|null} tokenData or null if already known
 */
async function processLog(log, blockNumber) {
  try {
    const { args } = decodeEventLog({
      abi: [TOKEN_CREATED_ABI],
      data: log.data,
      topics: log.topics,
    });

    const tokenAddress = args.token.toLowerCase();
    const curveAddress = args.curve.toLowerCase();
    const creatorAddress = args.creator.toLowerCase();
    const name = args.name;
    const symbol = args.symbol;
    const devBuyEth = parseFloat(formatEther(args.devBuyAmount ?? 0n));
    const detectedAt = Math.floor(Date.now() / 1000);

    insertToken({
      tokenAddress,
      curveAddress,
      creatorAddress,
      name,
      symbol,
      devBuyEth,
      detectedAt,
      createdBlock: blockNumber ? Number(blockNumber) : null,
    });

    const tokenData = {
      tokenAddress,
      curveAddress,
      creatorAddress,
      name,
      symbol,
      devBuyEth,
      detectedAt,
    };

    console.log(`[Factory] New token detected: ${name} ($${symbol}) @ ${tokenAddress}`);
    notifyNewToken(tokenData);
    return tokenData;
  } catch (err) {
    console.error('[Factory] Failed to process log:', err.message);
    return null;
  }
}

// ─────────────────────────────────────────────
// Startup: catch-up scan
// ─────────────────────────────────────────────

/**
 * On startup, scan the last N blocks for any TokenCreated events we missed.
 * This ensures we don't miss launches that happened before the bot started.
 */
export async function catchUpScan() {
  try {
    console.log(`[Factory] Running catch-up scan for last ${config.blockLookback} blocks…`);
    const latestBlock = await withRetry(() => publicClient.getBlockNumber());
    const fromBlock = latestBlock > BigInt(config.blockLookback)
      ? latestBlock - BigInt(config.blockLookback)
      : 0n;

    const logs = await withRetry(() =>
      publicClient.getLogs({
        address: FACTORY_ADDRESS,
        event: TOKEN_CREATED_ABI,
        fromBlock,
        toBlock: latestBlock,
      })
    );

    console.log(`[Factory] Catch-up: found ${logs.length} TokenCreated event(s) in blocks ${fromBlock}–${latestBlock}`);
    for (const log of logs) {
      await processLog(log, log.blockNumber);
    }

    // Persist the last processed block
    kvSet('last_processed_block', latestBlock.toString());
    console.log(`[Factory] Catch-up complete. Last block: ${latestBlock}`);
  } catch (err) {
    console.error('[Factory] Catch-up scan failed:', err.message);
  }
}

// ─────────────────────────────────────────────
// Live event subscription (watchContractEvent)
// ─────────────────────────────────────────────

let unwatch = null;

/**
 * Start watching for TokenCreated events via viem's watchContractEvent.
 * Automatically falls back to block polling if the subscription fails.
 */
export function startEventWatcher() {
  console.log('[Factory] Starting TokenCreated event watcher…');

  try {
    unwatch = publicClient.watchEvent({
      address: FACTORY_ADDRESS,
      event: TOKEN_CREATED_ABI,
      onLogs: async (logs) => {
        for (const log of logs) {
          await processLog(log, log.blockNumber);
        }
      },
      onError: (err) => {
        console.warn('[Factory] Event watcher error — switching to block polling:', err.message);
        stopEventWatcher();
        startBlockPoller();
      },
      pollingInterval: config.pollIntervalSeconds * 1000,
    });

    console.log('[Factory] Event watcher active.');
  } catch (err) {
    console.warn('[Factory] watchEvent failed — falling back to block polling:', err.message);
    startBlockPoller();
  }
}

export function stopEventWatcher() {
  if (unwatch) {
    try { unwatch(); } catch (_) {}
    unwatch = null;
  }
}

// ─────────────────────────────────────────────
// Block polling fallback
// ─────────────────────────────────────────────

let pollerActive = false;

/**
 * Fallback poller: scans new blocks for TokenCreated events every N seconds.
 * Used when WebSocket / watchEvent is unavailable.
 */
export async function startBlockPoller() {
  if (pollerActive) return;
  pollerActive = true;
  console.log('[Factory] Block-polling fallback started.');

  const POLL_MS = config.pollIntervalSeconds * 1000;

  while (pollerActive) {
    try {
      const latestBlock = await withRetry(() => publicClient.getBlockNumber());
      const lastStr = kvGet('last_processed_block', null);
      const lastBlock = lastStr ? BigInt(lastStr) : latestBlock - 10n;

      if (latestBlock > lastBlock) {
        const logs = await withRetry(() =>
          publicClient.getLogs({
            address: FACTORY_ADDRESS,
            event: TOKEN_CREATED_ABI,
            fromBlock: lastBlock + 1n,
            toBlock: latestBlock,
          })
        );

        for (const log of logs) {
          await processLog(log, log.blockNumber);
        }

        kvSet('last_processed_block', latestBlock.toString());
      }
    } catch (err) {
      console.error('[Factory] Block poller error:', err.message);
    }

    await sleep(POLL_MS);
  }
}

export function stopBlockPoller() {
  pollerActive = false;
}
