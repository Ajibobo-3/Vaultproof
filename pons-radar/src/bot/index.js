/**
 * @file bot/index.js
 * @description Grammy Telegram bot setup, command registration, and alert dispatcher.
 *              This module initialises the bot, wires up commands, and exposes
 *              functions for sending public channel alerts.
 */

import { Bot, GrammyError } from 'grammy';
import { config } from '../config/env.js';
import {
  handleStart,
  handleHelp,
  handleRadar,
  handleTrending,
  handleCheck,
  handleFees,
  handleUnknown,
} from './commands.js';
import {
  newLaunchMessage,
  milestoneMessage,
} from './formatters.js';

// ─────────────────────────────────────────────
// Bot initialisation
// ─────────────────────────────────────────────

/** @type {import('grammy').Bot} */
export const bot = new Bot(config.botToken);

// ─────────────────────────────────────────────
// Telegram message options (HTML, no preview)
// ─────────────────────────────────────────────
const HTML_OPTS = {
  parse_mode: /** @type {'HTML'} */ ('HTML'),
  link_preview_options: { is_disabled: true },
};

// ─────────────────────────────────────────────
// Command registration
// ─────────────────────────────────────────────

bot.command('start', handleStart);
bot.command('help', handleHelp);
bot.command('radar', handleRadar);
bot.command('trending', handleTrending);
bot.command('check', handleCheck);
bot.command('fees', handleFees);

// Catch-all for unrecognised commands
bot.on('message:text', (ctx) => {
  if (ctx.message.text.startsWith('/')) {
    return handleUnknown(ctx);
  }
});

// Global error handler (prevents the bot from crashing on unhandled errors)
bot.catch((err) => {
  console.error('[Bot] Unhandled error:', err.message ?? err);
});

// ─────────────────────────────────────────────
// Public channel alert senders
// ─────────────────────────────────────────────

/**
 * Send a "🚀 NEW PONS LAUNCH" alert to the configured public channel.
 *
 * @param {Object} tokenData
 * @param {string} tokenData.tokenAddress
 * @param {string} tokenData.curveAddress
 * @param {string} tokenData.creatorAddress
 * @param {string} tokenData.name
 * @param {string} tokenData.symbol
 * @param {number} tokenData.devBuyEth
 */
export async function sendNewLaunchAlert(tokenData) {
  try {
    const html = newLaunchMessage(tokenData);
    await bot.api.sendMessage(config.channelId, html, HTML_OPTS);
    console.log(`[Bot] New launch alert sent for ${tokenData.name} ($${tokenData.symbol})`);
  } catch (err) {
    console.error('[Bot] Failed to send new launch alert:', err.message);
  }
}

/**
 * Send a milestone alert to the configured public channel.
 *
 * @param {Object} token       - DB token row
 * @param {string} milestoneKey - '50' | '75' | '90' | '98' | '100'
 * @param {number} balanceEth
 */
export async function sendMilestoneAlert(token, milestoneKey, balanceEth) {
  try {
    const html = milestoneMessage({
      name: token.name,
      symbol: token.symbol,
      tokenAddress: token.token_address,
      curveAddress: token.curve_address,
      balanceEth,
      milestoneKey,
    });
    await bot.api.sendMessage(config.channelId, html, HTML_OPTS);
    console.log(
      `[Bot] Milestone ${milestoneKey}% alert sent for ${token.name} ($${token.symbol})`
    );
  } catch (err) {
    console.error('[Bot] Failed to send milestone alert:', err.message);
  }
}

/**
 * Start the Grammy bot (long-polling) with resilience against HTTP 409 Conflict
 * errors that Telegram emits during Render rolling redeploys.
 *
 * Root cause: when Render spins up the new container while the old one is still
 * alive, both call `getUpdates` simultaneously. Telegram rejects the second
 * caller with a 409. We must wait for the old container to be SIGTERM'd (which
 * Render does within seconds) and then retry cleanly.
 *
 * Strategy:
 *  - Detect 409 via `instanceof GrammyError && error_code === 409`.
 *  - Call `bot.stop()` before each retry to flush Grammy's internal `_running`
 *    flag, ensuring the next `bot.start()` call starts from a clean state.
 *  - Wait 5 s between retries (gives Render's drain period time to complete).
 *  - Allow up to MAX_RETRIES before treating the situation as permanently fatal.
 *  - Any non-409 error (e.g. 401 Unauthorized) is rethrown immediately.
 */
export async function startBot() {
  const MAX_RETRIES = 5;
  const CONFLICT_WAIT_MS = 5_000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `[Bot] Starting Telegram bot (long-polling) — attempt ${attempt}/${MAX_RETRIES}…`
      );
      await bot.start({
        onStart: (info) => {
          console.log(`[Bot] ✅ Bot is running as @${info.username}`);
        },
      });
      // bot.start() only resolves when bot.stop() is called externally —
      // reaching here means a clean, intentional shutdown.
      return;
    } catch (err) {
      // Precise 409 detection: must be a Grammy API error with code 409.
      // Checking instanceof GrammyError avoids accidentally treating
      // non-Telegram errors whose message happens to contain "409".
      const is409 =
        err instanceof GrammyError
          ? err.error_code === 409
          : (err?.error_code === 409 ||
             (typeof err?.message === 'string' &&
              err.message.includes('Conflict') &&
              err.message.includes('409')));

      if (is409 && attempt < MAX_RETRIES) {
        console.warn(
          `[Bot] ⚠️ Telegram polling conflict (409). Waiting 5 seconds for ` +
          `previous container to release lock... (attempt ${attempt}/${MAX_RETRIES})`
        );
        // Flush Grammy's internal state so the next bot.start() is clean.
        try { await bot.stop(); } catch (_) { /* already stopped — ignore */ }
        await new Promise((r) => setTimeout(r, CONFLICT_WAIT_MS));
        continue;
      }

      // Non-409 error OR retries exhausted — both are fatal from bot's perspective.
      if (is409) {
        console.error(
          `[Bot] ❌ Telegram polling conflict (409) persisted after ` +
          `${MAX_RETRIES} attempts. The bot will not retry further.`
        );
      }
      throw err;
    }
  }
}

/**
 * Gracefully stop the bot.
 */
export async function stopBot() {
  console.log('[Bot] Stopping bot…');
  await bot.stop();
}
