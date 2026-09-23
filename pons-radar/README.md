# 🛰️ PonsRadar ($RADAR)

**Real-time Telegram Tracker & Graduation Radar Bot for Pons Family Launchpad on Robinhood Chain**

---

## Overview

PonsRadar monitors the **Pons Family launchpad** (`PonsV2LaunchFactory`) on **Robinhood Chain** (Arbitrum Orbit L2, Chain ID 4663). It automatically:

- 🚀 **Alerts on every new token launch** — name, ticker, creator, dev buy ETH
- 📈 **Tracks bonding curve ETH progress** toward the 4.2 ETH graduation target
- 🎓 **Fires milestone alerts** at 50% → 75% → 90% → 98% → 100% (Uniswap V4 migration)
- 📡 **Answers interactive commands** like `/radar`, `/check <address>`, `/fees`

---

## Architecture

```
pons-radar/
├── src/
│   ├── config/
│   │   └── env.js            # Environment variable validation
│   ├── services/
│   │   ├── client.js         # Viem public client for Robinhood Chain (ID 4663)
│   │   ├── factory.js        # TokenCreated event watcher + block-polling fallback
│   │   ├── monitor.js        # ETH balance poller + milestone state machine
│   │   └── database.js       # SQLite schema, queries, KV store
│   ├── bot/
│   │   ├── index.js          # Grammy bot init + channel alert senders
│   │   ├── commands.js       # /start /help /radar /check /fees handlers
│   │   └── formatters.js     # HTML templates, progress bars, formatters
│   └── index.js              # Application entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js     | ≥ 18.x  |
| npm         | ≥ 9.x   |

---

## Quick Start (Local)

### 1. Clone and install dependencies

```bash
git clone <your-repo-url> pons-radar
cd pons-radar
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `BOT_TOKEN` | From [@BotFather](https://t.me/BotFather) on Telegram |
| `CHANNEL_ID` | Your public channel ID (e.g. `-1001234567890`) |
| `RPC_URL` | `https://rpc.mainnet.chain.robinhood.com` (default) |
| `FACTORY_ADDRESS` | `0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e` (default) |

> **Tip:** To get your channel ID, forward any message from your channel to [@userinfobot](https://t.me/userinfobot).

### 3. Run

```bash
npm start
```

Or in watch mode (auto-restarts on changes):

```bash
npm run dev
```

---

## Telegram Bot Commands

| Command | Description |
|---------|-------------|
| `/start` or `/help` | Bot overview, features, and links |
| `/radar` or `/trending` | Top 5 curves closest to graduation (sorted by progress) |
| `/check <address>` | Live status, ETH pooled, and graduation % for any token or curve |
| `/fees` | Explains $RADAR token utility and Pons holder fee sharing |

---

## Milestone Alerts

| Threshold | Label |
|-----------|-------|
| 50% (2.1 ETH) | 📈 50% Milestone |
| 75% (3.15 ETH) | ⚡ 75% Milestone |
| 90% (3.78 ETH) | 🔥 Graduation Imminent |
| 98% (4.116 ETH) | 🚨 Almost There! |
| 100% (4.2 ETH) | 🎓 Graduated → Uniswap V4 |

Each milestone fires **exactly once** per token, stored in SQLite.

---

## Deploying to Production

### Option A: Railway

1. Push the repo to GitHub.
2. Create a new Railway project → **Deploy from GitHub**.
3. Add environment variables in Railway's **Variables** tab.
4. Railway auto-detects `npm start` from `package.json`.

### Option B: Render

1. Push to GitHub.
2. New Render **Background Worker** (not a web service).
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables in Render's dashboard.

### Option C: VPS (Ubuntu/Debian)

```bash
# Install Node 20 via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20 && nvm use 20

# Clone & install
git clone <repo> /opt/pons-radar
cd /opt/pons-radar
npm install

# Set up environment
cp .env.example .env
nano .env  # fill in your values

# Run with PM2 (keeps alive on crash)
npm install -g pm2
pm2 start npm --name "pons-radar" -- start
pm2 save
pm2 startup  # follow the printed command to enable on reboot
```

---

## Resilience Features

| Feature | Implementation |
|---------|---------------|
| RPC retry with exponential back-off | `withRetry()` in `client.js` — 5 retries, max 30s delay |
| WebSocket event watcher → block polling fallback | `factory.js` — automatic fallback on watcher error |
| Startup catch-up scan | Replays last `BLOCK_LOOKBACK` blocks to catch missed launches |
| Milestone deduplication | SQLite `UNIQUE(token_address, milestone_key)` constraint |
| Graceful shutdown | `SIGINT`/`SIGTERM` handlers stop workers cleanly |
| Grammy error boundary | `bot.catch()` prevents crashes on malformed updates |

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RPC_URL` | ✅ | — | Robinhood Chain HTTP RPC |
| `WS_URL` | ❌ | — | WebSocket RPC (optional) |
| `FACTORY_ADDRESS` | ✅ | — | `PonsV2LaunchFactory` address |
| `BOT_TOKEN` | ✅ | — | Telegram bot token |
| `CHANNEL_ID` | ✅ | — | Telegram channel ID for alerts |
| `ADMIN_IDS` | ❌ | — | Comma-separated Telegram user IDs |
| `GRADUATION_ETH` | ❌ | `4.2` | Graduation threshold in ETH |
| `POLL_INTERVAL_SECONDS` | ❌ | `15` | Curve balance poll frequency |
| `BLOCK_LOOKBACK` | ❌ | `500` | Blocks to scan on startup |
| `DB_PATH` | ❌ | `./data/pons-radar.db` | SQLite database file path |
| `LOG_LEVEL` | ❌ | `info` | Log verbosity |

---

## License

MIT © PonsRadar Team
