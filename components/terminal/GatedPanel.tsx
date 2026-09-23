"use client";

import React from "react";
import { 
  Lock, 
  Unlock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  ExternalLink, 
  Users, 
  Zap,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { WhaleHolder, CurveAlert } from "@/lib/types/terminal";
import { robinhoodChain } from "@/lib/web3/chains";

interface GatedPanelProps {
  userVProofBalance: number;
  whales: WhaleHolder[];
  alerts: CurveAlert[];
  onUnlockDemo?: () => void;
}

export function GatedPanel({
  userVProofBalance,
  whales,
  alerts,
  onUnlockDemo,
}: GatedPanelProps) {
  const REQUIRED_BALANCE = 1_000_000;
  const isUnlocked = userVProofBalance >= REQUIRED_BALANCE;
  const explorerUrl =
    robinhoodChain.blockExplorers?.default.url ||
    "https://robinhoodchain.blockscout.com";

  return (
    <div className="relative rounded-2xl border border-white/10 bg-[#0E1117]/85 backdrop-blur-xl overflow-hidden shadow-2xl">
      {/* Top Banner */}
      <div className="p-6 md:p-8 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
            isUnlocked
              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-cyan-glow"
              : "bg-amber-500/10 border-amber-500/30 text-amber-400"
          }`}>
            {isUnlocked ? (
              <Unlock className="w-5 h-5 text-cyan-400" />
            ) : (
              <Lock className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-extrabold text-white tracking-tight">
                Syndicate Gated Alpha Panel
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${
                isUnlocked
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}>
                {isUnlocked ? "Access Granted" : "Token-Gated"}
              </span>
            </div>
            <p className="text-xs font-mono text-gray-400 mt-0.5">
              Whale wallet distribution, smart accumulation tracking, and automated curve sentiment alerts
            </p>
          </div>
        </div>

        {/* Balance Status Badge */}
        <div className="flex items-center space-x-2 bg-white/[0.03] border border-white/10 px-4 py-2 rounded-xl text-xs font-mono">
          <span className="text-gray-400">Your $VPROOF:</span>
          <span className={`font-bold ${isUnlocked ? "text-emerald-400" : "text-amber-400"}`}>
            {userVProofBalance.toLocaleString()} $VPROOF
          </span>
          <span className="text-gray-500">/ 1.0M Req</span>
        </div>
      </div>

      {/* Content Area: Either Unlocked or Blurred with CTA */}
      <div className="relative p-6 md:p-8">
        {!isUnlocked ? (
          /* Locked State Overlay */
          <div className="relative min-h-[380px] flex flex-col items-center justify-center text-center p-8 rounded-xl border border-white/5 bg-black/40 overflow-hidden">
            {/* Blurred background preview to show high-value confidential data */}
            <div className="absolute inset-0 filter blur-md opacity-20 pointer-events-none select-none p-6 space-y-4">
              <div className="h-6 w-1/3 bg-white/20 rounded"></div>
              <div className="h-20 bg-white/10 rounded"></div>
              <div className="h-24 bg-white/10 rounded"></div>
              <div className="h-20 bg-white/10 rounded"></div>
            </div>

            <div className="relative z-10 max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
                <Lock className="w-8 h-8" />
              </div>

              <h4 className="text-xl font-bold text-white tracking-tight">
                Syndicate Gated Alpha Locked
              </h4>

              <p className="text-sm text-gray-400">
                Hold at least <span className="text-white font-semibold font-mono">1,000,000 $VPROOF</span> in your connected wallet to unlock institutional-grade whale distribution analytics, automated slippage defense alerts, and curve intelligence.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`https://www.ponsfamily.com/launchpad`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-1.5 shadow-emerald-glow"
                >
                  <span>Acquire $VPROOF on Pons V2</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                {onUnlockDemo && (
                  <button
                    onClick={onUnlockDemo}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-cyan-300 font-mono text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Demo Unlock (Simulate 1.5M)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Unlocked State View */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Whale Wallet Distribution */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Whale Wallet Distribution
                </h4>
                <span className="text-xs font-mono text-emerald-400">
                  Top Holders Registry
                </span>
              </div>

              <div className="space-y-3">
                {whales.map((whale) => (
                  <div
                    key={whale.rank}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors font-mono text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-gray-400 font-semibold text-[11px]">
                        #{whale.rank}
                      </span>
                      <div>
                        <div className="text-white font-medium flex items-center gap-1.5">
                          <span>
                            {whale.label || `${whale.address.slice(0, 6)}...${whale.address.slice(-4)}`}
                          </span>
                          {whale.isSyndicateWhale && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              Syndicate
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 truncate max-w-[160px] sm:max-w-[200px]">
                          {whale.address}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-white font-bold">
                        {(whale.balance / 1_000_000).toFixed(2)}M
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {whale.percentage.toFixed(2)}% of supply
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Automated Curve Alerts */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  Automated Curve Signals & Alerts
                </h4>
                <span className="text-xs font-mono text-gray-400">
                  Real-time Watchdog
                </span>
              </div>

              <div className="space-y-3">
                {alerts.map((alert) => {
                  const isSuccess = alert.severity === "success";
                  const isWarning = alert.severity === "warning";
                  const isInfo = alert.severity === "info";

                  return (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isSuccess
                          ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                          : isWarning
                          ? "bg-amber-950/20 border-amber-500/30 text-amber-300"
                          : "bg-cyan-950/20 border-cyan-500/30 text-cyan-300"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5">
                          {isSuccess && (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          )}
                          {isWarning && (
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                          )}
                          {isInfo && <Info className="w-4 h-4 text-cyan-400" />}
                        </div>
                        <div className="flex-1">
                          <h5 className="text-xs font-mono font-bold text-white">
                            {alert.title}
                          </h5>
                          <p className="text-xs font-mono text-gray-300 mt-1 leading-relaxed">
                            {alert.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Alpha Insights Box */}
                <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] text-xs font-mono text-gray-300">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Graduation Liquidity Guarantee</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Upon reaching 4.200 ETH, the Pons V2 curve automatically executes liquidity graduation into Uniswap V4. All accumulated VaultProof fees remain forever locked in floor defense reserves.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
