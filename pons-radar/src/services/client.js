/**
 * @file client.js
 * @description Viem public client configured for Robinhood Chain (Chain ID 4663).
 *              Exports a singleton `publicClient` used by all services.
 */

import { createPublicClient, http, defineChain } from 'viem';
import { config } from '../config/env.js';

// ─────────────────────────────────────────────
// Define Robinhood Chain (Arbitrum Orbit L2)
// ─────────────────────────────────────────────
export const robinhoodChain = defineChain({
  id: config.chainId,
  name: 'Robinhood Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [config.rpcUrl],
      ...(config.wsUrl ? { webSocket: [config.wsUrl] } : {}),
    },
    public: {
      http: [config.rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: 'Robinhood Blockscout',
      url: config.explorerUrl,
    },
  },
  testnet: false,
});

// ─────────────────────────────────────────────
// Public client singleton
// ─────────────────────────────────────────────
export const publicClient = createPublicClient({
  chain: robinhoodChain,
  transport: http(config.rpcUrl, {
    retryCount: 5,
    retryDelay: ({ count }) => Math.min(1000 * 2 ** count, 30_000), // exponential back-off
    timeout: 15_000,
  }),
});

/**
 * Utility: retry an async function with exponential back-off.
 *
 * @param {() => Promise<T>} fn         - Async function to retry
 * @param {number}           maxRetries - Max number of attempts (default 5)
 * @param {number}           baseDelay  - Base delay in ms (default 1000)
 * @returns {Promise<T>}
 */
export async function withRetry(fn, maxRetries = 5, baseDelay = 1000) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const delay = Math.min(baseDelay * 2 ** attempt, 30_000);
      console.warn(
        `[Retry] Attempt ${attempt + 1}/${maxRetries} failed: ${err.message}. Retrying in ${delay}ms…`
      );
      await sleep(delay);
    }
  }
  throw lastError;
}

/**
 * Simple sleep helper.
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

console.log(`[Client] Viem public client initialised for Chain ID ${config.chainId}`);
