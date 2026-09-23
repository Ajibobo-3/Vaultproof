"use client";

import React from "react";
import { 
  Cpu, 
  ShieldCheck, 
  Flame, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Layers, 
  ArrowRight,
  TrendingUp,
  Radio,
  FileCheck
} from "lucide-react";

export function NvidiaBenchmark() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0E1117]/90 to-[#090A0F]/90 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-1/4 -mt-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -mb-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Narrative */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2.5 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-semibold">
              <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Capital Efficiency Benchmark
            </span>
            <span className="text-xs text-gray-500 font-mono">
              Wall St vs Web3 Autonomous Liquidity
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            Autonomous Execution at NVDA Scale — Programmed On-Chain
          </h2>
          <p className="text-xs md:text-sm text-gray-400 mt-1 max-w-3xl leading-relaxed">
            While Nvidia powers autonomous AI compute, VaultProof powers autonomous capital defense on Robinhood Chain.
          </p>
        </div>

        {/* Live Telemetry Tag */}
        <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-mono text-gray-300 self-start md:self-auto shrink-0 shadow-glass-inner">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
          <div className="text-left">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Protocol Status</div>
            <div className="text-emerald-400 font-semibold text-[11px] truncate">
              Autonomous Algorithmic Engine Active (Robinhood Chain | ID: 4663)
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metric 1: Execution Model */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col justify-between hover:border-emerald-500/30 transition-all duration-300">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>01. Execution Model</span>
            </div>

            <div className="space-y-4">
              {/* NVDA */}
              <div className="p-3.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-400 font-medium">NVDA (Tech Giant)</span>
                  <span className="text-amber-400/90 text-[10px] bg-amber-500/10 px-2 py-0.5 rounded">Manual / Lagged</span>
                </div>
                <p className="text-xs text-gray-300 font-mono leading-relaxed pt-1">
                  Discretionary quarterly capital allocation (90-day SEC reporting lag, manual treasury committee).
                </p>
              </div>

              {/* VPROOF */}
              <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    VaultProof ($VPROOF)
                  </span>
                  <span className="text-emerald-400 text-[10px] bg-emerald-500/15 px-2 py-0.5 rounded font-bold">Real-Time</span>
                </div>
                <p className="text-xs text-emerald-100 font-mono leading-relaxed pt-1">
                  Real-time autonomous execution engine (Instant on-chain trigger at ≥0.1 ETH threshold via Viem).
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-gray-400">
            <span>Latency Advantage</span>
            <span className="text-emerald-400 font-semibold">Sub-second vs 90 Days</span>
          </div>
        </div>

        {/* Metric 2: Capital Efficiency & Burns */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col justify-between hover:border-rose-500/30 transition-all duration-300">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>02. Capital Efficiency & Burns</span>
            </div>

            <div className="space-y-4">
              {/* NVDA */}
              <div className="p-3.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-400 font-medium">NVDA (Tech Giant)</span>
                  <span className="text-amber-400/90 text-[10px] bg-amber-500/10 px-2 py-0.5 rounded">Dilution Offset</span>
                </div>
                <p className="text-xs text-gray-300 font-mono leading-relaxed pt-1">
                  Corporate share repurchases offset by executive stock compensation & employee dilution.
                </p>
              </div>

              {/* VPROOF */}
              <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-500/30 space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-rose-300 font-bold flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    VaultProof ($VPROOF)
                  </span>
                  <span className="text-rose-400 text-[10px] bg-rose-500/15 px-2 py-0.5 rounded font-bold">100% Deflationary</span>
                </div>
                <p className="text-xs text-rose-100 font-mono leading-relaxed pt-1">
                  100% irreversible float compression routed directly to dead address (<code className="text-white">0x000...dEaD</code>).
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-gray-400">
            <span>Float Retention</span>
            <span className="text-rose-400 font-semibold">Zero Dilution / Pure Burn</span>
          </div>
        </div>

        {/* Metric 3: Solvency & Verification */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col justify-between hover:border-cyan-500/30 transition-all duration-300">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              <span>03. Solvency & Verification</span>
            </div>

            <div className="space-y-4">
              {/* NVDA */}
              <div className="p-3.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-400 font-medium">NVDA (Tech Giant)</span>
                  <span className="text-amber-400/90 text-[10px] bg-amber-500/10 px-2 py-0.5 rounded">Quarterly Filings</span>
                </div>
                <p className="text-xs text-gray-300 font-mono leading-relaxed pt-1">
                  Audited 10-Q / 10-K quarterly filings certified by external auditing firms with delayed disclosure.
                </p>
              </div>

              {/* VPROOF */}
              <div className="p-3.5 rounded-lg bg-cyan-950/20 border border-cyan-500/30 space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    VaultProof ($VPROOF)
                  </span>
                  <span className="text-cyan-400 text-[10px] bg-cyan-500/15 px-2 py-0.5 rounded font-bold">Cryptographic</span>
                </div>
                <p className="text-xs text-cyan-100 font-mono leading-relaxed pt-1">
                  Instant cryptographic proof of floor defense verified on Robinhood Blockscout block-by-block.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-gray-400">
            <span>Auditability</span>
            <span className="text-cyan-400 font-semibold">100% On-Chain Proof</span>
          </div>
        </div>
      </div>
    </div>
  );
}
