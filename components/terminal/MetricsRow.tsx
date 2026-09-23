"use client";

import React from "react";
import { 
  Vault, 
  Flame, 
  ShieldCheck, 
  ArrowUpRight, 
  Percent, 
  TrendingUp, 
  Cpu
} from "lucide-react";
import { TreasuryStats } from "@/lib/types/terminal";

interface MetricsRowProps {
  treasury: TreasuryStats;
}

export function MetricsRow({ treasury }: MetricsRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Metric 1: Total Creator Fees Captured */}
      <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 hover:border-emerald-500/30 transition-all duration-300 shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Vault className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-medium text-gray-400 uppercase tracking-wider">
                Total Fees Captured
              </h3>
              <p className="text-[11px] text-emerald-400 font-mono">100% Pons V2 Creator Fees</p>
            </div>
          </div>
          <span className="flex items-center text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <ArrowUpRight className="w-3 h-3 mr-0.5" />
            Live Vault
          </span>
        </div>

        <div className="space-y-1">
          <div className="text-3xl font-extrabold font-mono text-white tracking-tight flex items-baseline gap-2">
            {treasury.creatorFeesEth.toFixed(4)}
            <span className="text-base font-semibold text-emerald-400">ETH</span>
          </div>
          <div className="text-sm font-mono text-gray-400 flex items-center justify-between">
            <span>≈ ${treasury.creatorFeesUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
            <span className="text-xs text-gray-500">Autonomous Inflow</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-gray-400">
          <span>Target Engine Threshold</span>
          <span className="text-white font-medium">≥ 0.100 ETH</span>
        </div>
      </div>

      {/* Metric 2: Total Tokens Burned */}
      <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 hover:border-rose-500/30 transition-all duration-300 shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-full pointer-events-none group-hover:bg-rose-500/10 transition-colors" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-medium text-gray-400 uppercase tracking-wider">
                Total Tokens Burned
              </h3>
              <p className="text-[11px] text-rose-400 font-mono">Deflationary Dead Address</p>
            </div>
          </div>
          <span className="flex items-center text-xs font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
            <Flame className="w-3 h-3 mr-0.5" />
            Permanent
          </span>
        </div>

        <div className="space-y-1">
          <div className="text-3xl font-extrabold font-mono text-white tracking-tight flex items-baseline gap-2">
            {(treasury.totalTokensBurned / 1_000_000).toFixed(2)}M
            <span className="text-base font-semibold text-rose-400">$VPROOF</span>
          </div>
          <div className="text-sm font-mono text-gray-400 flex items-center justify-between">
            <span>{treasury.burnedPercentage.toFixed(2)}% of Initial Supply</span>
            <span className="text-xs text-rose-400/80 font-semibold">0x000...dEaD</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-gray-400">
          <span>Supply Compression</span>
          <span className="text-white font-medium">Auto-Burn Loop</span>
        </div>
      </div>

      {/* Metric 3: Current Floor Defense Multiplier */}
      <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 hover:border-cyan-500/30 transition-all duration-300 shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-medium text-gray-400 uppercase tracking-wider">
                Floor Defense Multiplier
              </h3>
              <p className="text-[11px] text-cyan-400 font-mono">Reserve vs Curve Depth</p>
            </div>
          </div>
          <span className="flex items-center text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
            <Cpu className="w-3 h-3 mr-0.5" />
            Dynamic
          </span>
        </div>

        <div className="space-y-1">
          <div className="text-3xl font-extrabold font-mono text-white tracking-tight flex items-baseline gap-2">
            {treasury.floorDefenseMultiplier.toFixed(2)}x
            <span className="text-sm font-semibold text-cyan-400">Shield Ratio</span>
          </div>
          <div className="text-sm font-mono text-gray-400 flex items-center justify-between">
            <span>Reserve Power: {treasury.reserveBuyingPowerEth.toFixed(3)} ETH</span>
            <span className="text-xs text-gray-500">Depth: {treasury.circulatingDepthEth.toFixed(3)} ETH</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-gray-400">
          <span>Stall Resistance Status</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Immune to Pre-Grad Dips
          </span>
        </div>
      </div>
    </div>
  );
}
