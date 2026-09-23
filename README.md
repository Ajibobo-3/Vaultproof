# 🧠 CortexFi — Market Intelligence Engine (MIE)

CortexFi is a real-time, multi-agent **Market Intelligence Engine (MIE)** designed for quantitative signal filtering, vector-based historical regime matching, multi-agent debate synthesis, and automated accuracy verification.

The platform ingests multi-modal market data feeds (on-chain whale transfers, derivative positioning metrics, unstructured news/social sentiment, and macroeconomic releases), applies quantitative thresholds (**Composite Market Impact Score - CMIS $\ge$ 70.0**), and synthesizes actionable scenario forecasts via a specialized multi-agent pipeline.

---

## 🏗️ Core Architecture & Pipeline

```text
CortexFi MIE Pipeline Architecture
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Whale Ingestor   │  │ Market Data      │  │ Social Sentiment │  │ Macro Calendar   │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                     │                     │
         └─────────────────────┴──────────┬──────────┴─────────────────────┘
                                          ▼
                            ┌───────────────────────────┐
                            │    CMIS Filter Module     │
                            │ (Multi-Factor Synergy)    │
                            └─────────────┬─────────────┘
                                          │ CMIS >= 70.0 Signal
                                          ▼
                            ┌───────────────────────────┐
                            │   Vector Memory Engine    │
                            │ (Cosine Regime Search)    │
                            └─────────────┬─────────────┘
                                          │ Matched Historical Regimes
                                          ▼
                            ┌───────────────────────────┐
                            │  Multi-Agent Synthesizer  │
                            │ (OnChain, Macro, Memory)  │
                            └─────────────┬─────────────┘
                                          │
                   ┌──────────────────────┼──────────────────────┐
                   ▼                      ▼                      ▼
      ┌─────────────────────────┐ ┌───────────────┐ ┌─────────────────────────┐
      │ Accuracy Tracker Ledger │ │ Telegram Bot  │ │ External Webhook API    │
      │(1h, 4h, 24h Verification) │ (@CortexFi)   │ │ (HTTP POST JSON)        │
      └─────────────────────────┘ └───────────────┘ └─────────────────────────┘
```

---

## 📁 Codebase Structure

```
├── config/
│   ├── settings.py          # Environment settings & dynamic CMIS thresholds
│   └── .env.example         # Environment template
├── data/
│   ├── database/
│   │   ├── connection.py    # Async Redis & Postgres client pools (with fallback)
│   │   └── models.py        # Pydantic v2 schemas (RawMarketEvent, FilteredSignal, Forecast)
│   └── ingestion/
│       ├── base.py          # Abstract base class for ingestors
│       ├── whale_tracker.py # RPC/CEX whale transfer listener
│       ├── market_data.py   # Funding rates & Open Interest collector
│       ├── social_sentiment.py # X/Twitter & RSS sentiment velocity parser
│       └── macro_calendar.py # Economic calendar release ingestor (CPI, FOMC)
├── engine/
│   ├── filter.py            # Composite Market Impact Score (CMIS) algorithm
│   ├── memory/
│   │   └── vector_memory.py # Vector memory & historical regime search engine
│   ├── accuracy/
│   │   └── accuracy_tracker.py # Immutable forecast accuracy logger & dynamic tuner
│   └── agents/
│       ├── base_agent.py    # Base agent interface
│       ├── macro_agent.py   # Macro & derivatives analysis logic
│       ├── onchain_agent.py # Wallet profiling & exchange flow specialist
│       └── synthesizer.py   # Multi-agent debate & scenario compiler
├── services/
│   ├── delivery.py        # Central delivery dispatcher
│   └── telegram_bot.py    # Async Telegram HTML card signal broadcaster
├── tests/                   # Pytest suite (100% passing)
│   ├── test_filter.py
│   ├── test_social_sentiment.py
│   ├── test_vector_memory.py
│   ├── test_accuracy_tracker.py
│   └── test_telegram_delivery.py
├── main.py                  # Entry point orchestrating the end-to-end event pipeline
└── requirements.txt         # Project dependencies
```

---

## 🚀 Setup & Execution

### 1. Environment Setup
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Run Test Suite
```bash
python3 -m pytest tests/
```

### 3. Run Main Pipeline Driver
```bash
python3 main.py
```
