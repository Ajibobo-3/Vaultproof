"use client";

import React, { useState } from "react";
import { 
  Play, 
  RotateCcw, 
  Flame, 
  ArrowDownLeft, 
  Sparkles,
  ShieldCheck
} from "lucide-react";

interface FloorDefenseSimulatorProps {
  onSimulateInflow: (amountEth: number) => Promise<void>;
  onSimulateBuyback: (amountEth: number) => Promise<void>;
  onReset: () => Promise<void>;
}

export function FloorDefenseSimulator({
  onSimulateInflow,
  onSimulateBuyback,
  onReset,
}: FloorDefenseSimulatorProps) {
  const [loading, setLoading] = useState(false);
  const [inflowAmount, setInflowAmount] = useState(0.12);
  const [buybackAmount, setBuybackAmount] = useState(0.15);

  const handleInflow = async () => {
    setLoading(true);
    await onSimulateInflow(inflowAmount);
    setLoading(false);
  };

  const handleBuyback = async () => {
    setLoading(true);
    await onSimulateBuyback(buybackAmount);
    setLoading(false);
  };

  const handleReset = async () => {
    setLoading(true);
    await onReset();
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-950/20 via-[#0E1117]/60 to-cyan-950/20 p-5 backdrop-blur-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Info */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5 font-mono">
              Autonomous Engine Sandbox
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                Interactive Testing
              </span>
            </h4>
            <p className="text-xs text-gray-400 font-mono">
              Simulate creator fee routing & floor defense buybacks to see dynamic live updates across all modules
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleInflow}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>+Simulate Fee ({inflowAmount} ETH)</span>
          </button>

          <button
            onClick={handleBuyback}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-mono text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>+Simulate Buyback & Burn ({buybackAmount} ETH)</span>
          </button>

          <button
            onClick={handleReset}
            disabled={loading}
            title="Reset Terminal state to initial values"
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
