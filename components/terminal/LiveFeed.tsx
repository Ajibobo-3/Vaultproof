"use client";

import React, { useState } from "react";
import { 
  ArrowDownLeft, 
  Flame, 
  ExternalLink, 
  Filter, 
  Clock, 
  Activity,
  Layers,
  CheckCircle2
} from "lucide-react";
import { ExecutionEvent, ExecutionType } from "@/lib/types/terminal";
import { robinhoodChain } from "@/lib/web3/chains";

interface LiveFeedProps {
  events: ExecutionEvent[];
}

export function LiveFeed({ events }: LiveFeedProps) {
  const [filter, setFilter] = useState<"ALL" | ExecutionType>("ALL");

  const filteredEvents = events.filter((ev) => {
    if (filter === "ALL") return true;
    return ev.type === filter;
  });

  const explorerUrl = robinhoodChain.blockExplorers?.default.url || "https://robinhoodchain.blockscout.com";

  const formatTimeAgo = (timestamp: number) => {
    const elapsedSec = Math.floor((Date.now() - timestamp) / 1000);
    if (elapsedSec < 60) return `${elapsedSec}s ago`;
    const elapsedMin = Math.floor(elapsedSec / 60);
    if (elapsedMin < 60) return `${elapsedMin}m ago`;
    const elapsedHours = Math.floor(elapsedMin / 60);
    return `${elapsedHours}h ago`;
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0E1117]/80 backdrop-blur-xl p-6 shadow-2xl">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Live Execution Feed
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Pons V2 Hook Live
              </span>
            </h3>
            <p className="text-xs font-mono text-gray-400">
              Real-time Creator Fee Inflows and Automated Buyback & Burn records
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center space-x-1.5 p-1 bg-black/40 rounded-xl border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              filter === "ALL"
                ? "bg-white/10 text-white font-semibold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            All ({events.length})
          </button>
          <button
            onClick={() => setFilter("INFLOW")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1 ${
              filter === "INFLOW"
                ? "bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30"
                : "text-gray-400 hover:text-emerald-400"
            }`}
          >
            <ArrowDownLeft className="w-3 h-3" />
            Fees
          </button>
          <button
            onClick={() => setFilter("BUYBACK_BURN")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1 ${
              filter === "BUYBACK_BURN"
                ? "bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30"
                : "text-gray-400 hover:text-rose-400"
            }`}
          >
            <Flame className="w-3 h-3" />
            Burns
          </button>
        </div>
      </div>

      {/* Table / List View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-[11px] font-mono text-gray-400 uppercase tracking-wider">
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">ETH Volume</th>
              <th className="py-3 px-4">$VPROOF Impact</th>
              <th className="py-3 px-4">Block & Time</th>
              <th className="py-3 px-4 text-right">Blockscout Tx</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono text-xs">
            {filteredEvents.map((tx) => {
              const isInflow = tx.type === "INFLOW";
              return (
                <tr
                  key={tx.id}
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Action Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {isInflow ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <span>Creator Fee Inflow</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                        <Flame className="w-3.5 h-3.5" />
                        <span>Buyback & Burn</span>
                      </div>
                    )}
                    {tx.note && (
                      <p className="text-[10px] text-gray-500 mt-1 pl-1">
                        {tx.note}
                      </p>
                    )}
                  </td>

                  {/* ETH Amount */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-bold text-white text-sm">
                      {tx.ethAmount}
                    </span>{" "}
                    <span className="text-gray-400">ETH</span>
                  </td>

                  {/* Token Amount */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {tx.tokenAmount ? (
                      <div>
                        <span className="font-bold text-rose-400">
                          +{tx.tokenAmount}
                        </span>{" "}
                        <span className="text-gray-400">$VPROOF</span>
                        <div className="text-[10px] text-gray-500">
                          Burned to 0x000...dEaD
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500 italic">
                        Treasury Accumulation
                      </span>
                    )}
                  </td>

                  {/* Timestamp & Block */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-gray-400">
                    <div className="flex items-center gap-1 text-gray-300">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span>{formatTimeAgo(tx.timestamp)}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Block #{tx.blockNumber.toLocaleString()}
                    </div>
                  </td>

                  {/* Tx Link */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <a
                      href={`${explorerUrl}/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-emerald-400 border border-white/10 transition-colors"
                    >
                      <span className="font-mono text-xs">
                        {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-400" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
