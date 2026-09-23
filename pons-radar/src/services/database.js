/**
 * @file database.js
 * @description SQLite persistence layer using Node.js built-in `node:sqlite`
 *              (available since Node v22.5.0 — no native compilation required).
 *              Manages the token registry, milestone history, and a KV store.
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { config } from '../config/env.js';

// ─────────────────────────────────────────────
// Ensure the data directory exists
// ─────────────────────────────────────────────
const dbPath = path.resolve(config.dbPath);
const dbDir  = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);

// Enable WAL mode for better concurrent read performance
db.exec(`PRAGMA journal_mode = WAL`);
db.exec(`PRAGMA synchronous  = NORMAL`);

// ─────────────────────────────────────────────
// Schema initialization
// ─────────────────────────────────────────────
db.exec(`
  -- All tokens detected from the PonsV2LaunchFactory
  CREATE TABLE IF NOT EXISTS tokens (
    token_address    TEXT PRIMARY KEY,
    curve_address    TEXT NOT NULL,
    creator_address  TEXT NOT NULL,
    name             TEXT NOT NULL,
    symbol           TEXT NOT NULL,
    dev_buy_eth      REAL NOT NULL DEFAULT 0,
    detected_at      INTEGER NOT NULL,
    graduated        INTEGER NOT NULL DEFAULT 0,
    graduated_at     INTEGER,
    last_balance_eth REAL NOT NULL DEFAULT 0,
    last_checked_at  INTEGER,
    created_block    INTEGER
  );

  -- One row per (token, milestone) — prevents duplicate alerts across restarts
  CREATE TABLE IF NOT EXISTS milestones (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    token_address TEXT NOT NULL,
    milestone_key TEXT NOT NULL,
    alerted_at    INTEGER NOT NULL,
    UNIQUE(token_address, milestone_key)
  );

  -- General key-value store (e.g. last processed block number)
  CREATE TABLE IF NOT EXISTS kv_store (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

console.log(`[Database] node:sqlite initialised → ${dbPath}`);

// ─────────────────────────────────────────────
// Token helpers
// ─────────────────────────────────────────────

export function insertToken({
  tokenAddress,
  curveAddress,
  creatorAddress,
  name,
  symbol,
  devBuyEth,
  detectedAt,
  createdBlock,
}) {
  db.prepare(`
    INSERT OR IGNORE INTO tokens
      (token_address, curve_address, creator_address, name, symbol,
       dev_buy_eth, detected_at, graduated, last_balance_eth, created_block)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
  `).run(
    tokenAddress.toLowerCase(),
    curveAddress.toLowerCase(),
    creatorAddress.toLowerCase(),
    name,
    symbol,
    devBuyEth,
    detectedAt,
    createdBlock ?? null,
  );
}

/** All active (non-graduated) tokens ordered newest first. */
export function getActiveTokens() {
  return db
    .prepare(`SELECT * FROM tokens WHERE graduated = 0 ORDER BY detected_at DESC`)
    .all();
}

/** Top N active tokens sorted by ETH balance descending (closest to graduation). */
export function getTopByProgress(limit = 5) {
  return db
    .prepare(
      `SELECT * FROM tokens
       WHERE graduated = 0
       ORDER BY last_balance_eth DESC
       LIMIT ?`
    )
    .all(limit);
}

/** Lookup by token_address OR curve_address. Returns null if not found. */
export function getTokenByAddress(address) {
  const addr = address.toLowerCase();
  return (
    db
      .prepare(
        `SELECT * FROM tokens
         WHERE token_address = ? OR curve_address = ?
         LIMIT 1`
      )
      .get(addr, addr) ?? null
  );
}

export function updateTokenBalance(tokenAddress, balanceEth, checkedAt) {
  db.prepare(
    `UPDATE tokens
     SET last_balance_eth = ?, last_checked_at = ?
     WHERE token_address = ?`
  ).run(balanceEth, checkedAt, tokenAddress.toLowerCase());
}

export function markGraduated(tokenAddress, graduatedAt) {
  db.prepare(
    `UPDATE tokens SET graduated = 1, graduated_at = ? WHERE token_address = ?`
  ).run(graduatedAt, tokenAddress.toLowerCase());
}

// ─────────────────────────────────────────────
// Milestone helpers
// ─────────────────────────────────────────────

/** Returns true if this milestone has already been alerted. */
export function hasMilestone(tokenAddress, milestoneKey) {
  return Boolean(
    db
      .prepare(
        `SELECT 1 FROM milestones
         WHERE token_address = ? AND milestone_key = ?`
      )
      .get(tokenAddress.toLowerCase(), milestoneKey)
  );
}

export function recordMilestone(tokenAddress, milestoneKey, alertedAt) {
  db.prepare(
    `INSERT OR IGNORE INTO milestones (token_address, milestone_key, alerted_at)
     VALUES (?, ?, ?)`
  ).run(tokenAddress.toLowerCase(), milestoneKey, alertedAt);
}

// ─────────────────────────────────────────────
// Key-value store helpers
// ─────────────────────────────────────────────

export function kvGet(key, defaultValue = null) {
  const row = db.prepare(`SELECT value FROM kv_store WHERE key = ?`).get(key);
  return row ? row.value : defaultValue;
}

export function kvSet(key, value) {
  db.prepare(
    `INSERT INTO kv_store (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, String(value));
}

export default db;
