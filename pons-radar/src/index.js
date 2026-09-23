/**
 * @file src/index.js
 * @description PonsRadar ($RADAR) — Application entry point.
 *
 * Boot sequence:
 *  1. Validate environment
 *  2. Initialize SQLite database (auto-schema)
 *  3. Viem public client (Robinhood Chain, ID 4663)
 *  4. Catch-up scan: replay recent factory events from last N blocks
 *  5. Start Grammy Telegram bot (long-polling)
 *  6. Start balance-polling monitor worker
 *  7. Start factory event watcher (with block-polling fallback)
 *  8. Wire callbacks: new launch → Telegram alert, milestone → Telegram alert
 *  9. Register SIGINT / SIGTERM for graceful shutdown
 */

// ── Step 1: Environment (must be first — loads .env) ──────────────────────────
import { config } from './config/env.js';

// ── Health-check HTTP server (Render / Railway requirement) ───────────────────
import http from 'http';

// ── Step 2 & 3: Database + Client (imported for side-effects / singleton init) ─
import './services/database.js';
import { publicClient } from './services/client.js';

// ── Step 4–8: Feature modules ──────────────────────────────────────────────────
import {
  catchUpScan,
  startEventWatcher,
  stopEventWatcher,
  startBlockPoller,
  stopBlockPoller,
  onNewToken,
} from './services/factory.js';

import {
  startMonitorWorker,
  stopMonitorWorker,
  onMilestone,
  onGraduated,
} from './services/monitor.js';

import {
  bot,
  startBot,
  stopBot,
  sendNewLaunchAlert,
  sendMilestoneAlert,
} from './bot/index.js';

// ─────────────────────────────────────────────
// Main bootstrap function
// ─────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   🛰️  PonsRadar ($RADAR) — v1.0.0         ║');
  console.log('║   Graduation Tracker · Pons Family         ║');
  console.log('║   Robinhood Chain (ID: 4663)               ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('');

  // ── Verify RPC connectivity ──────────────────────────────────────────────────
  try {
    const blockNumber = await publicClient.getBlockNumber();
    console.log(`[Main] ✅ RPC connected. Current block: ${blockNumber}`);
  } catch (err) {
    console.error(`[Main] ❌ RPC connection failed: ${err.message}`);
    console.error('[Main] Check RPC_URL in your .env file. Exiting.');
    process.exit(1);
  }

  // ── Wire event callbacks ─────────────────────────────────────────────────────

  // New token launch detected → send Telegram alert
  onNewToken(async (tokenData) => {
    await sendNewLaunchAlert(tokenData);
  });

  // Milestone hit → send Telegram alert
  onMilestone(async (token, milestoneKey, balanceEth) => {
    await sendMilestoneAlert(token, milestoneKey, balanceEth);
  });

  // Graduation is already handled via the '100' milestone key above.
  // onGraduated is available for additional custom logic if needed.
  onGraduated(async (token, balanceEth) => {
    console.log(`[Main] 🎓 ${token.name} ($${token.symbol}) has GRADUATED at ${balanceEth.toFixed(3)} ETH!`);
  });

  // ── Health-check HTTP server ─────────────────────────────────────────────────
  // Render (and Railway) require a web service to bind a port and return 200
  // on GET /. We spin up a minimal server that runs alongside everything else.
  const PORT = Number(process.env.PORT) || 10000;
  healthServer = http.createServer((req, res) => {
    if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
      const body = JSON.stringify({ status: 'ok', service: 'PonsRadar' });
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      });
      res.end(body);
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  await new Promise((resolve) => {
    healthServer.listen(PORT, '0.0.0.0', () => {
      console.log(`[HealthCheck] Server bound to 0.0.0.0:${PORT}`);
      resolve();
    });
  });

  // ── Catch-up scan (replay recent blocks before going live) ───────────────────
  await catchUpScan();

  // ── Start the Telegram bot (fire-and-forget — never blocks main()) ───────────
  // IMPORTANT: startBot() must NOT be awaited inside main(). If it is awaited
  // and ultimately throws (after exhausting 409 retries), the rejection bubbles
  // to main().catch() which calls process.exit(1) — killing the health server
  // and the monitor worker along with it.
  //
  // Instead we let startBot() run on its own promise chain. The process is kept
  // alive by three independent open handles:
  //   1. healthServer.listen()       — HTTP server
  //   2. startMonitorWorker()        — infinite async sleep loop
  //   3. startEventWatcher()         — polling interval / watchEvent subscription
  //
  // If the bot fails permanently after all retries, those services continue
  // unaffected and Render's health probe keeps receiving 200 OK.
  startBot().catch((err) => {
    console.error('[Bot] ❌ Permanent polling failure — bot is offline:', err.message);
    console.error('[Bot]    Health server and chain monitor remain active.');
    // Intentionally do NOT call process.exit() here.
  });

  // ── Start balance monitor worker (runs in background) ───────────────────────
  // startMonitorWorker runs an infinite loop — do NOT await it at startup.
  startMonitorWorker().catch((err) =>
    console.error('[Main] Monitor worker crashed:', err.message)
  );

  // ── Start factory event watcher ──────────────────────────────────────────────
  startEventWatcher();

  console.log('');
  console.log('[Main] ✅ PonsRadar is fully operational. Monitoring Robinhood Chain…');
  console.log(`[Main]    Factory  : ${config.factoryAddress}`);
  console.log(`[Main]    Channel  : ${config.channelId}`);
  console.log(`[Main]    Poll     : every ${config.pollIntervalSeconds}s`);
  console.log(`[Main]    Graduate : ${config.graduationEth} ETH → Uniswap V4`);
  console.log('');
  // main() returns here — the process stays alive via healthServer + monitor + watcher open handles.
}

// ─────────────────────────────────────────────
// Graceful shutdown
// ─────────────────────────────────────────────
/** Module-level handle so shutdown() can close the HTTP server. */
let healthServer = null;

async function shutdown(signal) {
  console.log(`\n[Main] Received ${signal} — shutting down gracefully…`);
  try {
    stopMonitorWorker();
    stopEventWatcher();
    stopBlockPoller();
    if (healthServer) healthServer.close();
    await stopBot();
    console.log('[Main] Shutdown complete. Goodbye! 👋');
  } catch (err) {
    console.error('[Main] Error during shutdown:', err.message);
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// ─────────────────────────────────────────────
// Launch
// ─────────────────────────────────────────────

main().catch((err) => {
  console.error('[Main] Fatal startup error:', err);
  process.exit(1);
});
