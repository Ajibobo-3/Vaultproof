/**
 * @file formatters.js
 * @description HTML Telegram message templates, progress bars, and number formatters.
 *              All output uses Telegram HTML parse_mode for rich rendering.
 */

import { config } from '../config/env.js';

// ─────────────────────────────────────────────
// Number formatting utilities
// ─────────────────────────────────────────────

/**
 * Format ETH value to max 3 decimal places, stripping trailing zeros.
 * @param {number|bigint} value
 * @param {number} decimals
 */
export function fmtEth(value, decimals = 3) {
  const num = typeof value === 'bigint' ? Number(value) / 1e18 : Number(value);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a percentage to 1 decimal place.
 * @param {number} value
 */
export function fmtPct(value) {
  return value.toFixed(1);
}

/**
 * Truncate an Ethereum address for display (0x1234...abcd).
 * @param {string} addr
 */
export function shortAddr(addr) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/**
 * Escape HTML entities for safe Telegram HTML mode.
 * @param {string} str
 */
export function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─────────────────────────────────────────────
// ASCII progress bar
// ─────────────────────────────────────────────
const BAR_FILLED = '🟩';
const BAR_EMPTY = '⬜';
const BAR_TOTAL = 10;

/**
 * Renders a 10-block ASCII progress bar with percentage and ETH labels.
 * Example: [🟩🟩🟩🟩🟩⬜⬜⬜⬜⬜] 52.4% (2.201 / 4.200 ETH)
 *
 * @param {number} balanceEth   - Current bonding curve ETH balance
 * @param {number} goalEth      - Graduation target (e.g. 4.2)
 * @returns {string}
 */
export function progressBar(balanceEth, goalEth = config.graduationEth) {
  const pct = Math.min((balanceEth / goalEth) * 100, 100);
  const filled = Math.round((pct / 100) * BAR_TOTAL);
  const empty = BAR_TOTAL - filled;
  const bar =
    '[' + BAR_FILLED.repeat(filled) + BAR_EMPTY.repeat(empty) + ']';
  return `${bar} ${fmtPct(pct)}% (${fmtEth(balanceEth)} / ${fmtEth(goalEth)} ETH)`;
}

/**
 * Returns the milestone emoji for a given progress percentage.
 * @param {number} pct
 */
export function milestoneEmoji(pct) {
  if (pct >= 100) return '🎓';
  if (pct >= 98) return '🚨';
  if (pct >= 90) return '🔥';
  if (pct >= 75) return '⚡';
  if (pct >= 50) return '📈';
  return '🆕';
}

// ─────────────────────────────────────────────
// Explorer / Pons URL builders
// ─────────────────────────────────────────────

export function explorerTokenUrl(address) {
  return `${config.explorerUrl}/token/${address}`;
}

export function explorerAddressUrl(address) {
  return `${config.explorerUrl}/address/${address}`;
}

export function ponsTokenUrl(tokenAddress) {
  return `${config.ponsBaseUrl}/${tokenAddress}`;
}

// ─────────────────────────────────────────────
// Message Templates
// ─────────────────────────────────────────────

/**
 * 🚀 NEW PONS LAUNCH alert message.
 */
export function newLaunchMessage({ name, symbol, tokenAddress, curveAddress, creatorAddress, devBuyEth }) {
  const devBuyEthNum = Number(devBuyEth);
  const devPct = config.graduationEth > 0
    ? fmtPct((devBuyEthNum / config.graduationEth) * 100)
    : '0.0';

  return (
    `🚀 <b>NEW PONS LAUNCH</b>\n\n` +
    `<b>${escHtml(name)}</b>  (<code>$${escHtml(symbol)}</code>)\n\n` +
    `👤 <b>Creator:</b> <a href="${explorerAddressUrl(creatorAddress)}">${shortAddr(creatorAddress)}</a>\n` +
    `💰 <b>Dev Buy:</b> ${fmtEth(devBuyEthNum)} ETH  <i>(${devPct}% of curve)</i>\n\n` +
    `${progressBar(devBuyEthNum)}\n\n` +
    `🔗 <a href="${ponsTokenUrl(tokenAddress)}">View on Pons Family</a>  ·  ` +
    `<a href="${explorerTokenUrl(tokenAddress)}">Blockscout</a>`
  );
}

/**
 * 📈 Milestone alert message.
 */
export function milestoneMessage({ name, symbol, tokenAddress, curveAddress, balanceEth, milestoneKey }) {
  const pct = (balanceEth / config.graduationEth) * 100;
  const emoji = milestoneEmoji(pct);

  let headline;
  switch (milestoneKey) {
    case '50':  headline = '📈 <b>50% MILESTONE</b> — Halfway to graduation!'; break;
    case '75':  headline = '⚡ <b>75% MILESTONE</b> — Heating up!'; break;
    case '90':  headline = '🔥 <b>90% MILESTONE</b> — <b>GRADUATION IMMINENT!</b>'; break;
    case '98':  headline = '🚨 <b>98% MILESTONE</b> — <b>ALMOST THERE!</b>'; break;
    case '100': headline = '🎓 <b>GRADUATED!</b> — Liquidity migrated to <b>Uniswap V4</b> 🦄'; break;
    default:    headline = `${emoji} <b>MILESTONE ${milestoneKey}%</b>`;
  }

  return (
    `${headline}\n\n` +
    `<b>${escHtml(name)}</b>  (<code>$${escHtml(symbol)}</code>)\n\n` +
    `${progressBar(balanceEth)}\n\n` +
    `🔗 <a href="${ponsTokenUrl(tokenAddress)}">Pons Family</a>  ·  ` +
    `<a href="${explorerAddressUrl(curveAddress)}">Curve Contract</a>`
  );
}

/**
 * /check command reply — live status for a specific token/curve.
 */
export function checkMessage({ name, symbol, tokenAddress, curveAddress, creatorAddress, devBuyEth, balanceEth, graduated, graduatedAt }) {
  const pct = (balanceEth / config.graduationEth) * 100;
  const emoji = milestoneEmoji(pct);
  const status = graduated
    ? `🎓 <b>GRADUATED</b> ${graduatedAt ? `<i>(${new Date(graduatedAt * 1000).toUTCString()})</i>` : ''}`
    : `${emoji} <b>Active</b>`;

  return (
    `📡 <b>Live Status: ${escHtml(name)} ($${escHtml(symbol)})</b>\n\n` +
    `<b>Status:</b> ${status}\n` +
    `<b>Token:</b> <code>${tokenAddress}</code>\n` +
    `<b>Curve:</b> <code>${curveAddress}</code>\n` +
    `<b>Creator:</b> <a href="${explorerAddressUrl(creatorAddress)}">${shortAddr(creatorAddress)}</a>\n` +
    `<b>Dev Buy:</b> ${fmtEth(devBuyEth)} ETH\n\n` +
    `<b>Graduation Progress:</b>\n` +
    `${progressBar(balanceEth)}\n\n` +
    `🔗 <a href="${ponsTokenUrl(tokenAddress)}">Pons Family</a>  ·  ` +
    `<a href="${explorerAddressUrl(curveAddress)}">Blockscout Curve</a>`
  );
}

/**
 * /radar command reply — top 5 active curves closest to graduation.
 */
export function radarMessage(tokens) {
  if (!tokens || tokens.length === 0) {
    return (
      `📡 <b>PonsRadar — Graduation Radar</b>\n\n` +
      `No active bonding curves being tracked yet.\n` +
      `New launches will appear here automatically! 🚀`
    );
  }

  const lines = tokens.map((t, i) => {
    const pct = (t.last_balance_eth / config.graduationEth) * 100;
    const emoji = milestoneEmoji(pct);
    return (
      `${i + 1}. ${emoji} <b><a href="${ponsTokenUrl(t.token_address)}">${escHtml(t.name)}</a></b> ` +
      `(<code>$${escHtml(t.symbol)}</code>)\n` +
      `   ${progressBar(t.last_balance_eth)}\n` +
      `   <a href="${explorerAddressUrl(t.curve_address)}">Curve</a>  ·  ` +
      `<a href="${ponsTokenUrl(t.token_address)}">Pons</a>`
    );
  });

  return (
    `📡 <b>PonsRadar — Top Curves Nearing Graduation</b>\n\n` +
    lines.join('\n\n') +
    `\n\n<i>Updated every ${config.pollIntervalSeconds}s · Powered by $RADAR</i>`
  );
}

/**
 * /start | /help message.
 */
export function helpMessage() {
  return (
    `🛰️ <b>Welcome to PonsRadar ($RADAR)</b>\n` +
    `<i>Real-time graduation tracker for Pons Family on Robinhood Chain</i>\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<b>🚀 What I track:</b>\n` +
    `• Every new token launched on <a href="https://www.ponsfamily.com">Pons Family</a>\n` +
    `• Bonding curve ETH progress toward 4.2 ETH graduation\n` +
    `• Milestone alerts: 50% → 75% → 90% → 98% → 🎓 Graduated\n` +
    `• Uniswap V4 liquidity migration confirmation\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<b>📋 Commands:</b>\n` +
    `/radar — Top 5 curves closest to graduation\n` +
    `/trending — Same as /radar\n` +
    `/check &lt;address&gt; — Live status of any token or curve\n` +
    `/fees — $RADAR token utility &amp; fee sharing\n` +
    `/help — Show this menu\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<b>🔗 Links:</b>\n` +
    `• <a href="https://www.ponsfamily.com">Pons Family Launchpad</a>\n` +
    `• <a href="${config.explorerUrl}">Robinhood Blockscout</a>\n\n` +
    `<i>Chain ID: 4663 · Graduation target: 4.2 ETH → Uniswap V4 🦄</i>`
  );
}

/**
 * /fees message — $RADAR token utility explanation.
 */
export function feesMessage() {
  return (
    `💎 <b>$RADAR Token Utility & Pons Fee Sharing</b>\n\n` +
    `<b>What is $RADAR?</b>\n` +
    `$RADAR is the native utility token of PonsRadar — the premier graduation tracker for the Pons Family ecosystem on Robinhood Chain.\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<b>🏦 Pons Holder Fee Sharing</b>\n` +
    `The Pons Family protocol collects a trading fee on every bonding curve transaction. A portion of these fees is distributed to $RADAR holders:\n\n` +
    `• <b>Protocol Fees</b> — Collected on every buy &amp; sell on the bonding curve\n` +
    `• <b>Graduation Fee</b> — Collected when liquidity migrates to Uniswap V4\n` +
    `• <b>Holder Rewards</b> — $RADAR stakers earn a pro-rata share of accumulated protocol fees\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<b>🛰️ $RADAR Premium Features</b>\n` +
    `• Priority milestone alerts (before public channel)\n` +
    `• Private /check access for deep token analytics\n` +
    `• Whale wallet tracking &amp; dev sell alerts\n` +
    `• Graduation sniping signals\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<a href="https://www.ponsfamily.com">Buy $RADAR on Pons Family</a> 🚀`
  );
}
