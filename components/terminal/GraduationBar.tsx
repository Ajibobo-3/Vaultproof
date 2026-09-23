"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Rocket, 
  ShieldAlert, 
  TrendingUp, 
  Coins, 
  Layers, 
  Zap,
  Target,
  CheckCircle2
} from "lucide-react";
import { CurveGraduationStats } from "@/lib/types/terminal";

interface GraduationBarProps {
  graduation: CurveGraduationStats;
}

export function GraduationBar({ graduation }: GraduationBarProps) {
  const percent = Math.min(
    100,
    Math.max(0, (graduation.currentEth / graduation.targetEth) * 100)
  );

  const remainingEth = Math.max(
    0,
    graduation.targetEth - graduation.currentEth
  ).toFixed(3);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0E1117]/90 to-[#090A0F]/90 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-1/4 -mt-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -mb-16 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner: Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              Pons V2 Autonomous Curve Shield
            </span>
            <span className="text-xs text-gray-400 font-mono">
              Robinhood Chain (ID: 4663)
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Bonding Curve Graduation Tracker
          </h2>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            100% of Pons V2 creator fees are routed into an autonomous buyback & burn engine, preventing pre-graduation curve stalls and guaranteeing automated floor defense.
          </p>
        </div>

        {/* Live Target Card */}
        <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-xl p-3.5 backdrop-blur-md self-start md:self-auto">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Target className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-mono text-gray-400">Graduation Target</div>
            <div className="text-xl font-bold font-mono text-white flex items-baseline gap-1">
              4.200 <span className="text-xs font-normal text-emerald-400">ETH</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Progress Bar */}
      <div className="relative z-10 mt-2 mb-6">
        <div className="flex items-end justify-between mb-2">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl md:text-4xl font-extrabold font-mono text-white tracking-tight">
              {graduation.currentEth.toFixed(3)}
            </span>
            <span className="text-base font-mono text-emerald-400 font-bold">ETH</span>
            <span className="text-sm font-mono text-gray-500">/ 4.200 ETH</span>
          </div>

          <div className="text-right">
            <div className="text-2xl md:text-3xl font-extrabold font-mono text-gradient-emerald">
              {percent.toFixed(2)}%
            </div>
            <div className="text-xs font-mono text-gray-400">
              {remainingEth} ETH remaining to Uni V4 migration
            </div>
          </div>
        </div>

        {/* Main Progress Track */}
        <div className="relative h-5 w-full rounded-full bg-black/60 p-1 border border-white/10 overflow-hidden shadow-inner">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-emerald-glow relative overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            {/* Shimmer animation light bar */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </motion.div>
        </div>

        {/* Milestone Tick Marks */}
        <div className="mt-4 grid grid-cols-5 gap-2 text-center">
          {graduation.milestones.map((m, idx) => {
            const isCompleted = percent >= m.target;
            return (
              <div
                key={idx}
                className={`relative px-2 py-2 rounded-xl border text-xs font-mono transition-all duration-300 ${
                  isCompleted
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                    : "bg-white/[0.02] border-white/5 text-gray-500"
                }`}
              >
                <div className="flex items-center justify-center gap-1 font-bold">
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                  )}
                  <span>{m.target}%</span>
                </div>
                <div className="text-[10px] truncate text-gray-400 mt-0.5">
                  {m.target === 100 ? "Uni V4 LP" : `${(4.2 * (m.target / 100)).toFixed(2)} ETH`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Meta Indicators Row: Market Cap & Circulating Supply */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 relative z-10">
        <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
          <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-xs font-mono text-gray-400">Estimated Market Cap</div>
            <div className="text-lg font-bold font-mono text-white">
              ${graduation.marketCapUsd.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
          <Coins className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <div className="text-xs font-mono text-gray-400">Circulating Supply</div>
            <div className="text-lg font-bold font-mono text-white">
              {(graduation.currentCirculatingSupply / 1_000_000).toFixed(1)}M{" "}
              <span className="text-xs text-gray-500 font-normal">/ 1.0B</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
          <Layers className="w-5 h-5 text-purple-400 shrink-0" />
          <div>
            <div className="text-xs font-mono text-gray-400">Initial Supply Burned</div>
            <div className="text-lg font-bold font-mono text-white">
              {(
                ((graduation.initialSupply - graduation.currentCirculatingSupply) /
                  graduation.initialSupply) *
                100
              ).toFixed(2)}
              % Deflationary
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
