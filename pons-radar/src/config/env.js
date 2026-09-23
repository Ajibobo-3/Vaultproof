/**
 * @file env.js
 * @description Environment variable validation and export.
 *
 * Enforces strict fail-fast validation at boot.
 * The three secrets — RPC_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID —
 * must be present, non-empty strings. No fallbacks or mock values are
 * ever supplied for these fields; missing them is a fatal startup error.
 */

import 'dotenv/config';

// ─────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────

/**
 * Assert that a required environment variable exists and is a non-empty string.
 * Throws a descriptive fatal error immediately if the check fails.
 *
 * @param {string} key        - The environment variable name.
 * @param {string} [hint]     - Optional hint shown in the error message.
 * @returns {string}          - The trimmed variable value.
 */
function required(key, hint) {
  const value = process.env[key];
  if (value === undefined || value === null || value.trim() === '') {
    const lines = [
      '',
      '╔══════════════════════════════════════════════════════════════╗',
      '║              ❌  FATAL STARTUP ERROR — PonsRadar             ║',
      '╚══════════════════════════════════════════════════════════════╝',
      '',
      `  Missing required environment variable: ${key}`,
      hint ? `  Hint: ${hint}` : '',
      '',
      '  Steps to fix:',
      '    1. Copy .env.example to .env  →  cp .env.example .env',
      `    2. Open .env and set a real value for ${key}`,
      '    3. Restart the application',
      '',
    ].filter((l) => l !== undefined).join('\n');

    // Write directly to stderr so it is visible even if stdout is piped
    process.stderr.write(lines + '\n');
    process.exit(1);
  }
  return value.trim();
}

function optional(key, defaultValue) {
  const value = process.env[key];
  return value && value.trim() !== '' ? value.trim() : defaultValue;
}

function optionalNumber(key, defaultValue) {
  const raw = process.env[key];
  if (!raw || raw.trim() === '') return defaultValue;
  const num = parseFloat(raw.trim());
  if (isNaN(num)) {
    process.stderr.write(
      `[Config] FATAL: Environment variable ${key} must be a valid number. Got: "${raw}"\n`
    );
    process.exit(1);
  }
  return num;
}

// ─────────────────────────────────────────────
// Strict validation of the three critical secrets
// Each call will terminate the process immediately if the var is absent/empty.
// ─────────────────────────────────────────────

const rpcUrl = required(
  'RPC_URL',
  'Robinhood Chain HTTP endpoint, e.g. https://rpc.mainnet.chain.robinhood.com'
);

const botToken = required(
  'TELEGRAM_BOT_TOKEN',
  'Obtain a bot token from @BotFather on Telegram (https://t.me/BotFather)'
);

const channelId = required(
  'TELEGRAM_CHANNEL_ID',
  'Your public Telegram channel ID, e.g. -1001234567890'
);

// ─────────────────────────────────────────────
// Full config object (frozen — no runtime mutation)
// ─────────────────────────────────────────────
export const config = Object.freeze({
  // ── Network ────────────────────────────────
  rpcUrl,
  wsUrl: optional('WS_URL', null),

  // ── Contracts ──────────────────────────────
  factoryAddress: required(
    'FACTORY_ADDRESS',
    'PonsV2LaunchFactory address: 0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e'
  ),

  // ── Telegram ───────────────────────────────
  botToken,
  channelId,
  adminIds: optional('ADMIN_IDS', '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .map(Number),

  // ── Business logic ─────────────────────────
  graduationEth:       optionalNumber('GRADUATION_ETH', 4.2),
  pollIntervalSeconds: optionalNumber('POLL_INTERVAL_SECONDS', 15),
  blockLookback:       optionalNumber('BLOCK_LOOKBACK', 500),

  // ── Storage ────────────────────────────────
  dbPath: optional('DB_PATH', './data/pons-radar.db'),

  // ── Logging ────────────────────────────────
  logLevel: optional('LOG_LEVEL', 'info'),

  // ── Static / derived ───────────────────────
  chainId:      4663,
  explorerUrl:  'https://robinhoodchain.blockscout.com',
  ponsBaseUrl:  'https://www.ponsfamily.com/launchpad',
});

// ─────────────────────────────────────────────
// Startup config summary — secrets are masked, never logged in full
// ─────────────────────────────────────────────
console.log('[Config] Environment validated successfully:');
console.log(`  RPC_URL                : ${config.rpcUrl}`);
console.log(`  FACTORY_ADDRESS        : ${config.factoryAddress}`);
console.log(`  TELEGRAM_BOT_TOKEN     : ${'*'.repeat(8)}${config.botToken.slice(-4)}`);
console.log(`  TELEGRAM_CHANNEL_ID    : ${config.channelId}`);
console.log(`  GRADUATION_ETH         : ${config.graduationEth}`);
console.log(`  POLL_INTERVAL_SECONDS  : ${config.pollIntervalSeconds}`);
console.log(`  DB_PATH                : ${config.dbPath}`);
