# 🛡️ VaultProof ($VPROOF)
### Autonomous Liquidity Shield & Buyback Terminal on Pons V2 (Robinhood Chain)

VaultProof ($VPROOF) is a decentralized autonomous liquidity shield and buyback terminal launching on **Pons V2** on **Robinhood Chain** (Arbitrum Orbit L2, Chain ID 4663).

The protocol routes **100% of Pons V2 creator fees** directly into an automated buyback-and-burn engine. This prevents pre-graduation stalls, guarantees floor price defense, and systematically compresses circulating supply towards the **4.2 ETH graduation target** (Uniswap V4 migration).

---

## 🏗️ Architecture & Modules

### 1. Syndicate Terminal Frontend (`/app/page.tsx` & components)
Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**:
- **Header & Navigation (`Header.tsx`)**: Live Robinhood Chain (ID 4663) status indicator, live Pons hook badge, and Wagmi v2 wallet connection with demo whale switcher.
- **Hero & Bonding Curve Progress Tracker (`GraduationBar.tsx`)**: Real-time progress towards the 4.2 ETH target, animated graduation bar with milestone checkpoints (50%, 75%, 90%, 98%, 100% Uni V4), circulating supply, and market cap.
- **Treasury Metrics Row (`MetricsRow.tsx`)**:
  - *Total Creator Fees Captured*: Accumulated ETH in the Treasury Vault.
  - *Total Tokens Burned*: Deflationary count of $VPROOF permanently burned to `0x0...dEaD` with percentage of supply.
  - *Current Floor Defense Multiplier*: Dynamic reserve buying power vs circulating curve depth.
- **Live Execution Feed (`LiveFeed.tsx`)**: Real-time transaction feed of [Creator Fee Inflows] and [Buyback & Burn] executions with direct Robinhood Blockscout links.
- **Syndicate Gated Alpha Panel (`GatedPanel.tsx`)**: Token-gated view (>= 1,000,000 $VPROOF) displaying whale wallet distributions and automated curve sentiment alerts with blurred locked state.
- **Interactive Sandbox Simulator (`FloorDefenseSimulator.tsx`)**: Real-time simulation of incoming creator fees and automated buybacks.

---

### 2. Automation & Monitoring Service (`/scripts/buyback-engine.ts`)
A typed microservice built with **Viem**:
- Continuously polls the Treasury Vault ETH balance.
- Monitors the Pons V2 bonding curve reserves and graduation progress.
- When threshold is met (accumulated fees >= 0.1 ETH or price dip support):
  - Calculates minimum tokens out with strict slippage protection (max 2%).
  - Verifies gas price is under the cap (5 Gwei).
  - Executes swap on Pons V2 curve for $VPROOF.
  - Burns tokens directly to the dead address (`0x000000000000000000000000000000000000dEaD`).
  - Dispatches formatted HTML alerts to Telegram and Discord webhooks.

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Required variables:
| Variable | Description | Default / Example |
|---|---|---|
| `NEXT_PUBLIC_RPC_URL` | Robinhood Chain RPC | `https://rpc.mainnet.chain.robinhood.com` |
| `NEXT_PUBLIC_CHAIN_ID` | Chain ID | `4663` |
| `NEXT_PUBLIC_EXPLORER_URL` | Block Explorer | `https://robinhoodchain.blockscout.com` |
| `NEXT_PUBLIC_PONS_ROUTER_ADDRESS` | Pons V2 Curve / Router | `0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e` |
| `NEXT_PUBLIC_VPROOF_TOKEN_ADDRESS` | $VPROOF Token Address | `0x94B73E06b83fA62bB273e86cE5a720B2F2A1a82d` |
| `NEXT_PUBLIC_TREASURY_VAULT_ADDRESS` | Treasury Vault Address | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` |
| `TREASURY_PRIVATE_KEY` | Signer for Buyback Engine | `0x...` |
| `TELEGRAM_WEBHOOK_URL` | Webhook URL for alerts | `https://api.telegram.org/...` |

---

## 🚀 Running the Terminal & Engine

### Run Frontend Terminal
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Buyback Engine (Dry-Run / Simulated)
```bash
npm run engine:dry-run
```

### Run Buyback Engine (Live On-Chain)
```bash
npm run engine
```
