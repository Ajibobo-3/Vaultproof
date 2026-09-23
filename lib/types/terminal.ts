export type ExecutionType = "INFLOW" | "BUYBACK_BURN";

export interface ExecutionEvent {
  id: string;
  txHash: string;
  type: ExecutionType;
  ethAmount: string;
  tokenAmount?: string;
  blockNumber: number;
  timestamp: number;
  sender?: string;
  recipient?: string;
  note?: string;
}

export interface TreasuryStats {
  creatorFeesEth: number;
  creatorFeesUsd: number;
  totalTokensBurned: number;
  burnedPercentage: number;
  floorDefenseMultiplier: number;
  reserveBuyingPowerEth: number;
  circulatingDepthEth: number;
  currentFloorPriceEth: number;
  totalVolumeEth: number;
}

export interface CurveGraduationStats {
  currentEth: number;
  targetEth: number;
  progressPercent: number;
  tokenSymbol: string;
  tokenName: string;
  tokenAddress: string;
  curveAddress: string;
  initialSupply: number;
  currentCirculatingSupply: number;
  marketCapUsd: number;
  ethPriceUsd: number;
  milestones: {
    target: number;
    achieved: boolean;
    label: string;
  }[];
}

export interface WhaleHolder {
  rank: number;
  address: string;
  balance: number;
  percentage: number;
  isSyndicateWhale: boolean;
  label?: string;
}

export interface CurveAlert {
  id: string;
  severity: "info" | "warning" | "success" | "critical";
  title: string;
  description: string;
  timestamp: number;
}

export interface TerminalState {
  graduation: CurveGraduationStats;
  treasury: TreasuryStats;
  feed: ExecutionEvent[];
  whales: WhaleHolder[];
  alerts: CurveAlert[];
  lastUpdated: number;
}
