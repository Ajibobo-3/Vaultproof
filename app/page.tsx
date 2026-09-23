"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { Header } from "@/components/terminal/Header";
import { GraduationBar } from "@/components/terminal/GraduationBar";
import { MetricsRow } from "@/components/terminal/MetricsRow";
import { NvidiaBenchmark } from "@/components/terminal/NvidiaBenchmark";
import { LiveFeed } from "@/components/terminal/LiveFeed";
import { GatedPanel } from "@/components/terminal/GatedPanel";
import { FloorDefenseSimulator } from "@/components/terminal/FloorDefenseSimulator";
import { INITIAL_TERMINAL_STATE } from "@/lib/constants/mockData";
import { TerminalState } from "@/lib/types/terminal";
import { ERC20_ABI } from "@/lib/web3/abis";
import { 
  ShieldCheck, 
  Flame, 
  ExternalLink, 
  Layers, 
  Zap, 
  TrendingUp, 
  Terminal, 
  Activity,
  Code
} from "lucide-react";

export default function TerminalDashboard() {
  const { address, isConnected } = useAccount();

  // Primary state: starts with high-fidelity sample data, refreshes from API
  const [terminalState, setTerminalState] = useState<TerminalState>(
    INITIAL_TERMINAL_STATE
  );

  // Simulated balance for testing Syndicate Gated Alpha (0 or 1,500,000 $VPROOF)
  const [mockVProofBalance, setMockVProofBalance] = useState<number>(0);
  const [useMockBalance, setUseMockBalance] = useState<boolean>(false);

  // Read actual on-chain $VPROOF balance if wallet is connected
  const vproofContractAddress = (process.env.NEXT_PUBLIC_VPROOF_TOKEN_ADDRESS ||
    "0x94B73E06b83fA62bB273e86cE5a720B2F2A1a82d") as `0x${string}`;

  const { data: onChainBalanceRaw } = useReadContract({
    address: vproofContractAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
    },
  });

  // Determine effective balance (on-chain balance if connected, or mock balance if toggled for demo)
  const effectiveVProofBalance = React.useMemo(() => {
    if (useMockBalance) {
      return mockVProofBalance;
    }
    if (isConnected && onChainBalanceRaw !== undefined) {
      try {
        return parseFloat(formatUnits(onChainBalanceRaw as bigint, 18));
      } catch {
        return mockVProofBalance;
      }
    }
    return mockVProofBalance;
  }, [useMockBalance, mockVProofBalance, isConnected, onChainBalanceRaw]);

  // Load latest state from API
  const fetchTerminalState = async () => {
    try {
      const res = await fetch("/api/terminal/stats");
      if (res.ok) {
        const data = await res.json();
        setTerminalState(data);
      }
    } catch {
      // Fallback silently to initial mock state
    }
  };

  useEffect(() => {
    fetchTerminalState();
    const interval = setInterval(fetchTerminalState, 8000);
    return () => clearInterval(interval);
  }, []);

  // Handlers for Sandbox / Simulator
  const handleSimulateInflow = async (amountEth: number) => {
    try {
      const res = await fetch("/api/terminal/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SIMULATE_INFLOW", amountEth }),
      });
      if (res.ok) {
        const data = await res.json();
        setTerminalState(data.state);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulateBuyback = async (ethAmount: number) => {
    try {
      const res = await fetch("/api/terminal/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SIMULATE_BUYBACK", ethAmount }),
      });
      if (res.ok) {
        const data = await res.json();
        setTerminalState(data.state);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = async () => {
    try {
      const res = await fetch("/api/terminal/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET" }),
      });
      if (res.ok) {
        const data = await res.json();
        setTerminalState(data.state);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMockBalance = () => {
    setUseMockBalance(true);
    setMockVProofBalance((prev) => (prev >= 1_000_000 ? 0 : 1_500_000));
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-gray-100 flex flex-col relative selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background Ambience & Grid */}
      <div className="fixed inset-0 bg-cyber-grid opacity-40 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Module 1: Header / Navigation */}
      <Header
        mockWalletBalance={effectiveVProofBalance}
        onToggleMockBalance={toggleMockBalance}
        isMockActive={useMockBalance}
      />

      {/* Main Terminal Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        {/* Module 2: Hero & Bonding Curve Progress Tracker */}
        <GraduationBar graduation={terminalState.graduation} />

        {/* Module 3: Treasury Metrics Row (3 Metric Cards) */}
        <MetricsRow treasury={terminalState.treasury} />

        {/* Dedicated NVDA Benchmark Module */}
        <NvidiaBenchmark />

        {/* Interactive Sandbox Simulation Controls */}
        <FloorDefenseSimulator
          onSimulateInflow={handleSimulateInflow}
          onSimulateBuyback={handleSimulateBuyback}
          onReset={handleReset}
        />

        {/* Module 4: Live Execution Feed */}
        <LiveFeed events={terminalState.feed} />

        {/* Module 5: Syndicate Gated Alpha Panel */}
        <GatedPanel
          userVProofBalance={effectiveVProofBalance}
          whales={terminalState.whales}
          alerts={terminalState.alerts}
          onUnlockDemo={toggleMockBalance}
        />
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-white/10 bg-[#090A0F]/80 backdrop-blur-md py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-gray-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              VaultProof ($VPROOF) — Autonomous Liquidity Shield & Buyback Terminal
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-gray-500">Pons V2 • Robinhood Chain (ID: 4663)</span>
            <a
              href="https://robinhoodchain.blockscout.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              Blockscout <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
