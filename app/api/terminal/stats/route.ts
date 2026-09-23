import { NextResponse } from "next/server";
import { INITIAL_TERMINAL_STATE } from "@/lib/constants/mockData";
import { TerminalState, ExecutionEvent } from "@/lib/types/terminal";

// In-memory state store for interactive simulation in demo/preview
let currentState: TerminalState = JSON.parse(JSON.stringify(INITIAL_TERMINAL_STATE));

export async function GET() {
  return NextResponse.json(currentState);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === "SIMULATE_INFLOW") {
      const amountEth = Number(body.amountEth || 0.085);
      const newCreatorFees = currentState.treasury.creatorFeesEth + amountEth;
      const ethPrice = currentState.graduation.ethPriceUsd;

      currentState.treasury.creatorFeesEth = newCreatorFees;
      currentState.treasury.creatorFeesUsd = newCreatorFees * ethPrice;
      currentState.treasury.reserveBuyingPowerEth = newCreatorFees;
      currentState.treasury.floorDefenseMultiplier =
        newCreatorFees / currentState.treasury.circulatingDepthEth;

      const newTx: ExecutionEvent = {
        id: `tx-${Date.now()}`,
        txHash: `0x${Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join("")}`,
        type: "INFLOW",
        ethAmount: amountEth.toFixed(4),
        blockNumber: 14829150 + Math.floor(Math.random() * 50),
        timestamp: Date.now(),
        sender: "Pons V2 Fee Router",
        note: "Simulated Creator Fee Inflow (100% Routed to Treasury)",
      };

      currentState.feed = [newTx, ...currentState.feed.slice(0, 19)];
      currentState.lastUpdated = Date.now();

      return NextResponse.json({ success: true, state: currentState });
    }

    if (action === "SIMULATE_BUYBACK") {
      const ethAmount = Number(body.ethAmount || 0.12);
      const tokensBurned = Math.floor(ethAmount * 12_820_000);

      // Decrement treasury fees or reserve
      currentState.treasury.creatorFeesEth = Math.max(
        0,
        currentState.treasury.creatorFeesEth - ethAmount
      );
      currentState.treasury.totalTokensBurned += tokensBurned;
      currentState.treasury.burnedPercentage =
        (currentState.treasury.totalTokensBurned / currentState.graduation.initialSupply) *
        100;

      // Update bonding curve progress towards 4.2 ETH
      const newCurveEth = Math.min(
        4.2,
        currentState.graduation.currentEth + ethAmount * 0.95
      );
      currentState.graduation.currentEth = newCurveEth;
      currentState.graduation.progressPercent = (newCurveEth / 4.2) * 100;
      currentState.graduation.currentCirculatingSupply -= tokensBurned;

      // Update milestones
      currentState.graduation.milestones.forEach((m) => {
        if (currentState.graduation.progressPercent >= m.target) {
          m.achieved = true;
        }
      });

      const newTx: ExecutionEvent = {
        id: `tx-${Date.now()}`,
        txHash: `0x${Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join("")}`,
        type: "BUYBACK_BURN",
        ethAmount: ethAmount.toFixed(4),
        tokenAmount: tokensBurned.toLocaleString(),
        blockNumber: 14829200 + Math.floor(Math.random() * 50),
        timestamp: Date.now(),
        recipient: "0x000000000000000000000000000000000000dEaD",
        note: "Automated Floor Defense: Swap & Permanent Burn",
      };

      currentState.feed = [newTx, ...currentState.feed.slice(0, 19)];
      currentState.lastUpdated = Date.now();

      return NextResponse.json({ success: true, state: currentState });
    }

    if (action === "RESET") {
      currentState = JSON.parse(JSON.stringify(INITIAL_TERMINAL_STATE));
      return NextResponse.json({ success: true, state: currentState });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
