/**
 * @file monitor.js
 * @description Asynchronous balance-polling worker.
 *              Reads the native ETH balance of every active bonding curve,
 *              computes graduation progress, fires milestone alerts, and
 *              marks curves as graduated when they reach 4.2 ETH.
 */

import { formatEther } from 'viem';
import { publicClient, withRetry, sleep } from './client.js';
import { config } from '../config/env.js';
import {
  getActiveTokens,
  updateTokenBalance,
  markGraduated,
  hasMilestone,
  recordMilestone,
} from './database.js';

// ─────────────────────────────────────────────
// Milestone definitions
// ─────────────────────────────────────────────
/**
 * Each milestone has:
 *  - key: string used as DB identifier
 *  - threshold: minimum progress percentage to trigger
 */
const MILESTONES = [
  { key: '50',  threshold: 50 },
  { key: '75',  threshold: 75 },
  { key: '90',  threshold: 90 },
  { key: '98',  threshold: 98 },
  { key: '100', threshold: 100 },
];

// ─────────────────────────────────────────────
// Callback registry
// ─────────────────────────────────────────────
/** @type {Array<(token: Object, milestoneKey: string, balanceEth: number) => void>} */
const onMilestoneCallbacks = [];

/** @type {Array<(token: Object, balanceEth: number) => void>} */
const onGraduatedCallbacks = [];

/**
 * Register a callback for when a milestone is hit.
 * @param {(token: Object, milestoneKey: string, balanceEth: number) => void} cb
 */
export function onMilestone(cb) {
  onMilestoneCallbacks.push(cb);
}

/**
 * Register a callback for when a curve graduates (reaches 100%).
 * @param {(token: Object, balanceEth: number) => void} cb
 */
export function onGraduated(cb) {
  onGraduatedCallbacks.push(cb);
}

// ─────────────────────────────────────────────
// Core polling logic
// ─────────────────────────────────────────────

/**
 * Poll the ETH balance of a single bonding curve address.
 * @param {string} curveAddress
 * @returns {Promise<number>} Balance in ETH as a float
 */
async function fetchCurveBalance(curveAddress) {
  const balanceWei = await withRetry(() =>
    publicClient.getBalance({ address: /** @type {`0x${string}`} */ (curveAddress) })
  );
  return parseFloat(formatEther(balanceWei));
}

/**
 * Evaluate which milestones a given progress percentage qualifies for
 * and fire any that haven't been alerted yet.
 *
 * @param {Object} token
 * @param {number} balanceEth
 * @param {number} pct
 */
async function checkMilestones(token, balanceEth, pct) {
  const now = Math.floor(Date.now() / 1000);

  for (const ms of MILESTONES) {
    if (pct < ms.threshold) continue;
    if (hasMilestone(token.token_address, ms.key)) continue;

    // Record immediately to prevent duplicate alerts even on concurrent runs
    recordMilestone(token.token_address, ms.key, now);

    console.log(
      `[Monitor] 🎯 Milestone ${ms.key}% hit for ${token.name} ($${token.symbol}) ` +
      `— balance: ${balanceEth.toFixed(3)} ETH`
    );

    // Fire callbacks
    for (const cb of onMilestoneCallbacks) {
      try { await cb(token, ms.key, balanceEth); } catch (e) {
        console.error('[Monitor] Milestone callback error:', e.message);
      }
    }

    // Handle graduation specifically
    if (ms.key === '100') {
      const graduatedAt = Math.floor(Date.now() / 1000);
      markGraduated(token.token_address, graduatedAt);

      for (const cb of onGraduatedCallbacks) {
        try { await cb(token, balanceEth); } catch (e) {
          console.error('[Monitor] Graduated callback error:', e.message);
        }
      }
    }
  }
}

// ─────────────────────────────────────────────
// Main polling worker
// ─────────────────────────────────────────────

let workerActive = false;

/**
 * Start the asynchronous balance-polling worker.
 * Runs every `config.pollIntervalSeconds` seconds.
 */
export async function startMonitorWorker() {
  if (workerActive) {
    console.warn('[Monitor] Worker already running.');
    return;
  }
  workerActive = true;
  console.log(`[Monitor] Balance polling worker started (interval: ${config.pollIntervalSeconds}s)`);

  const POLL_MS = config.pollIntervalSeconds * 1000;

  while (workerActive) {
    const cycleStart = Date.now();

    try {
      const tokens = getActiveTokens();

      if (tokens.length === 0) {
        // Nothing to monitor yet — just wait
        await sleep(POLL_MS);
        continue;
      }

      console.log(`[Monitor] Polling ${tokens.length} active curve(s)…`);

      // Poll each curve — sequential to avoid overwhelming the RPC
      for (const token of tokens) {
        if (!workerActive) break;

        try {
          const balanceEth = await fetchCurveBalance(token.curve_address);
          const pct = (balanceEth / config.graduationEth) * 100;
          const now = Math.floor(Date.now() / 1000);

          // Persist updated balance
          updateTokenBalance(token.token_address, balanceEth, now);

          // Check milestones (including graduation at 100%)
          await checkMilestones(token, balanceEth, pct);

        } catch (err) {
          console.error(
            `[Monitor] Failed to poll curve ${token.curve_address} (${token.symbol}):`,
            err.message
          );
        }
      }
    } catch (err) {
      console.error('[Monitor] Polling cycle error:', err.message);
    }

    // Sleep for the remainder of the poll interval
    const elapsed = Date.now() - cycleStart;
    const remaining = Math.max(0, POLL_MS - elapsed);
    await sleep(remaining);
  }

  console.log('[Monitor] Worker stopped.');
}

export function stopMonitorWorker() {
  workerActive = false;
}
