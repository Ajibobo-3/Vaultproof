import { defineChain } from "viem";

export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.mainnet.chain.robinhood.com",
      ],
    },
    public: {
      http: [
        process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.mainnet.chain.robinhood.com",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Blockscout",
      url: process.env.NEXT_PUBLIC_EXPLORER_URL || "https://explorer.mainnet.chain.robinhood.com",
    },
  },
  testnet: false,
});
