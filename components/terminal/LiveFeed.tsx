"use client";

import React, { useState } from "react";
import { useWatchContractEvent } from "wagmi";
import { formatUnits, type Address } from "viem";
import { 
  ArrowDownLeft, 
  Flame, 
  ExternalLink, 
  Clock, 
  Activity,
  Radio,
  Loader2
} from "lucide-react";
import { ExecutionEvent, ExecutionType } from "@/lib/types/terminal";
import { ERC20_ABI } from "@/lib/web3/abis";

interface LiveFeedProps {
  events: ExecutionEvent[];
  isLoading?: boolean;
}

const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD" as Address;
const EXPLORER_BASE_URL = process.env.NEXT_PUBLIC_EXPLORER_URL || "https://explorer.mainnet.chain.robinhood.com";

export function LiveFeed({ events: initialEvents, isLoading = false }: LiveFeedProps) {
  const [filter, setFilter] = useState<"ALL" | ExecutionType>("ALL");
  const [liveStreamEvents, setLiveStreamEvents] = useState<ExecutionEvent[]>([]);

  const vproofAddress = (process.env.NEXT_PUBLIC_VPROOF_TOKEN_ADDRESS ||
    "0x94B73E06b83fA62bB273e86cE5a720B2F2A1a82d") as Address;

  // Real-time on-chain event watcher for Transfers (Inflow or Buyback & Burn)
  useWatchContractEvent({
    address: vproofAddress,
    abi: ERC20_ABI,
    eventName: "Transfer",
    onLogs(logs) {
      const incoming: ExecutionEvent[] = logs.map((log) => {
        const isBurn = log.args.to?.toLowerCase() === DEAD_ADDRESS.toLowerCase();
        const rawVal = log.args.value ? parseFloat(formatUnits(log.args.value, 18)) : 0;
        return {
          id: `live-${log.transactionHash}-${log.logIndex}`,
          txHash: log.transactionHash,
          type: isBurn ? "BUYBACK_BURN" : "INFLOW",
          ethAmount: "0.1000",
          tokenAmount: rawVal > 0 ? rawVal.toLocaleString() : undefined,
          blockNumber: Number(log.blockNumber || 0),
          timestamp: Date.now(),
          recipient: log.args.to,
          sender: log.args.from,
          note: isBurn 
            ? "Live On-Chain Buyback & Burn (Robinhood Chain)" 
            : "Live On-Chain Inflow Received",
        };
      });

      if (incoming.length > 0) {
        setLiveStreamEvents((prev) => [...incoming, ...prev].slice(0, 30));
      }
    },
  });

  // Combine live stream events with polled/initial events
  const combinedEvents = React.useMemo(() => {
    const streamHashes = new Set(liveStreamEvents.map((e) => e.txHash));
    const dedupedInitial = initialEvents.filter((e) => !streamHashes.has(e.txHash));
    return [...liveStreamEvents, ...dedupedInitial];
  }, [liveStreamEvents, initialEvents]);

  const filteredEvents = combinedEvents.filter((ev) => {
    if (filter === "ALL") return true;
    return ev.type === filter;
  });

  const formatTimeAgo = (timestamp: number) => {
    const elapsedSec = Math.floor((Date.now() - timestamp) / 1000);
    if (elapsedSec < 60) return `${Math.max(1, elapsedSec)}s ago`;
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
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Radio className="w-2.5 h-2.5 animate-ping text-emerald-400" />
                Robinhood Orbit Sync
              </span>
            </h3>
            <p className="text-xs font-mono text-gray-400">
              Live on-chain Creator Fee Inflows and Automated Buyback & Burn records
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
            All ({combinedEvents.length})
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
            {isLoading && combinedEvents.length === 0 ? (
              // Loading Skeleton State
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-4"><div className="h-6 w-32 bg-white/10 rounded-lg" /></td>
                  <td className="py-4 px-4"><div className="h-5 w-20 bg-white/10 rounded-lg" /></td>
                  <td className="py-4 px-4"><div className="h-5 w-24 bg-white/10 rounded-lg" /></td>
                  <td className="py-4 px-4"><div className="h-5 w-24 bg-white/10 rounded-lg" /></td>
                  <td className="py-4 px-4 text-right"><div className="h-6 w-20 bg-white/10 rounded-lg ml-auto" /></td>
                </tr>
              ))
            ) : filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500 font-mono">
                  No execution events match current filter.
                </td>
              </tr>
            ) : (
              filteredEvents.map((tx) => {
                const isInflow = tx.type === "INFLOW";
                const blockscoutUrl = `${EXPLORER_BASE_URL}/tx/${tx.txHash}`;

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

                    {/* Tx Link with Blockscout URL */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <a
                        href={blockscoutUrl}
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
