"use client";

import React, { useState } from "react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { 
  ShieldCheck, 
  Wallet, 
  ExternalLink, 
  LogOut, 
  ChevronDown, 
  Activity, 
  Flame, 
  CheckCircle2, 
  Radio
} from "lucide-react";
import { robinhoodChain } from "@/lib/web3/chains";

interface HeaderProps {
  mockWalletBalance?: number;
  onToggleMockBalance?: () => void;
  isMockActive?: boolean;
}

export function Header({
  mockWalletBalance = 0,
  onToggleMockBalance,
  isMockActive = false,
}: HeaderProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: balanceData } = useBalance({
    address: address,
  });

  const formattedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#090A0F]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left: Branding & Core Positioning */}
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center shadow-emerald-glow transition-all duration-300 group-hover:border-emerald-400 group-hover:scale-105">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#090A0F] animate-pulse" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xl tracking-tight text-white flex items-center gap-1.5">
                VaultProof
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  $VPROOF
                </span>
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono tracking-tight flex items-center gap-1">
              Autonomous Liquidity Shield & Buyback Terminal
            </p>
          </div>
        </div>

        {/* Center: Live Network Badge & Protocol State */}
        <div className="hidden md:flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-gray-300 font-medium">Robinhood Chain</span>
            <span className="text-gray-500">|</span>
            <span className="text-emerald-400 font-semibold">ID: 4663</span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-xs font-mono text-emerald-300">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Pons V2 Hook Active</span>
          </div>
        </div>

        {/* Right: Wallet Actions & Syndicate Demo Trigger */}
        <div className="flex items-center space-x-3">
          {/* Quick Mock/Live Switcher for Testing Syndicate Whitelist */}
          {onToggleMockBalance && (
            <button
              onClick={onToggleMockBalance}
              title="Toggle simulated whale balance for testing the 1,000,000 $VPROOF gate"
              className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all duration-200 ${
                mockWalletBalance >= 1_000_000
                  ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-cyan-glow"
                  : "bg-white/[0.04] border-white/10 text-gray-400 hover:text-gray-200"
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {mockWalletBalance >= 1_000_000
                  ? "1.5M $VPROOF (Whale)"
                  : "0 $VPROOF (Public)"}
              </span>
            </button>
          )}

          {/* Wagmi Connect / Account Button */}
          {isConnected && address ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2.5 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/15 text-sm font-mono text-gray-200 transition-all duration-200 shadow-glass-inner"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-semibold">{formattedAddress}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/10 bg-[#0E1117]/95 backdrop-blur-2xl p-3 shadow-2xl z-50">
                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="text-xs text-gray-400">Connected Wallet</p>
                    <p className="text-xs font-mono text-emerald-400 font-semibold truncate mt-0.5">
                      {address}
                    </p>
                    <div className="mt-2 text-xs font-mono text-gray-300">
                      Balance:{" "}
                      <span className="text-white font-bold">
                        {balanceData
                          ? `${parseFloat(balanceData.formatted).toFixed(4)} ${balanceData.symbol}`
                          : "0.00 ETH"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-1">
                    <a
                      href={`${robinhoodChain.blockExplorers?.default.url}/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl text-gray-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                        View on Blockscout
                      </span>
                    </a>
                    <button
                      onClick={() => {
                        disconnect();
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <LogOut className="w-3.5 h-3.5" />
                        Disconnect Wallet
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                const injectedConnector = connectors.find(
                  (c) => c.id === "injected"
                ) || connectors[0];
                if (injectedConnector) {
                  connect({ connector: injectedConnector });
                }
              }}
              disabled={isPending}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-semibold text-sm transition-all duration-200 shadow-emerald-glow active:scale-95 disabled:opacity-50"
            >
              <Wallet className="w-4 h-4 text-black" />
              <span>{isPending ? "Connecting..." : "Connect Wallet"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
