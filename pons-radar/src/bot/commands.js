/**
 * @file commands.js
 * @description Telegram bot command handlers: /start, /help, /radar, /trending, /check, /fees
 */

import { config } from '../config/env.js';
import {
  getTopByProgress,
  getTokenByAddress,
} from '../services/database.js';
import { publicClient, withRetry } from '../services/client.js';
import { formatEther } from 'viem';
import {
  helpMessage,
  radarMessage,
  checkMessage,
  feesMessage,
  progressBar,
  fmtEth,
  fmtPct,
  escHtml,
} from './formatters.js';

// ─────────────────────────────────────────────
// Telegram send helper (HTML, no link preview)
// ─────────────────────────────────────────────

/**
 * Send an HTML message with web preview disabled.
 * Handles the common Telegram formatting options.
 *
 * @param {import('grammy').Context} ctx
 * @param {string} html
 */
async function reply(ctx, html) {
  await ctx.reply(html, {
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
  });
}

// ─────────────────────────────────────────────
// /start and /help
// ─────────────────────────────────────────────

export async function handleStart(ctx) {
  try {
    await reply(ctx, helpMessage());
  } catch (err) {
    console.error('[Commands] /start error:', err.message);
  }
}

export async function handleHelp(ctx) {
  await handleStart(ctx);
}

// ─────────────────────────────────────────────
// /radar and /trending
// ─────────────────────────────────────────────

export async function handleRadar(ctx) {
  try {
    const tokens = getTopByProgress(5);
    await reply(ctx, radarMessage(tokens));
  } catch (err) {
    console.error('[Commands] /radar error:', err.message);
    await reply(ctx, '⚠️ Failed to fetch radar data. Please try again shortly.');
  }
}

export async function handleTrending(ctx) {
  await handleRadar(ctx);
}

// ─────────────────────────────────────────────
// /check <address>
// ─────────────────────────────────────────────

export async function handleCheck(ctx) {
  try {
    const parts = ctx.message?.text?.trim().split(/\s+/) ?? [];
    const address = parts[1]?.toLowerCase();

    if (!address || !/^0x[0-9a-f]{40}$/i.test(address)) {
      return reply(
        ctx,
        '⚠️ Please provide a valid contract address.\n\nUsage: <code>/check 0xYourTokenOrCurveAddress</code>'
      );
    }

    // 1. Check our DB first
    let token = getTokenByAddress(address);

    if (!token) {
      // 2. Address not in our DB — try to fetch live balance anyway
      let liveBalance;
      try {
        const balWei = await withRetry(() =>
          publicClient.getBalance({ address: /** @type {`0x${string}`} */ (address) })
        );
        liveBalance = parseFloat(formatEther(balWei));
      } catch (_) {
        liveBalance = null;
      }

      const pct = liveBalance !== null
        ? fmtPct((liveBalance / config.graduationEth) * 100)
        : 'N/A';

      return reply(
        ctx,
        `📡 <b>Address:</b> <code>${address}</code>\n\n` +
        `This address is <b>not in our tracked registry</b>.\n\n` +
        (liveBalance !== null
          ? `<b>Live ETH Balance:</b> ${fmtEth(liveBalance)} ETH\n` +
            `<b>If a Pons curve:</b> ~${pct}% toward graduation\n\n` +
            `${progressBar(liveBalance)}\n\n`
          : '') +
        `<i>Only tokens launched on Pons Family launchpad are fully tracked.</i>`
      );
    }

    // 3. Fetch live balance for the tracked curve
    let liveBalance = token.last_balance_eth;
    try {
      const balWei = await withRetry(() =>
        publicClient.getBalance({
          address: /** @type {`0x${string}`} */ (token.curve_address),
        })
      );
      liveBalance = parseFloat(formatEther(balWei));
    } catch (err) {
      console.warn('[Commands] /check live balance fetch failed, using cached:', err.message);
    }

    await reply(
      ctx,
      checkMessage({
        name: token.name,
        symbol: token.symbol,
        tokenAddress: token.token_address,
        curveAddress: token.curve_address,
        creatorAddress: token.creator_address,
        devBuyEth: token.dev_buy_eth,
        balanceEth: liveBalance,
        graduated: Boolean(token.graduated),
        graduatedAt: token.graduated_at,
      })
    );
  } catch (err) {
    console.error('[Commands] /check error:', err.message);
    await reply(ctx, '⚠️ An error occurred while fetching token data. Please try again.');
  }
}

// ─────────────────────────────────────────────
// /fees
// ─────────────────────────────────────────────

export async function handleFees(ctx) {
  try {
    await reply(ctx, feesMessage());
  } catch (err) {
    console.error('[Commands] /fees error:', err.message);
  }
}

// ─────────────────────────────────────────────
// Unknown command fallback
// ─────────────────────────────────────────────

export async function handleUnknown(ctx) {
  await reply(
    ctx,
    `🤷 Unknown command. Type /help to see available commands.`
  );
}
