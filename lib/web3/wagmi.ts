import { http, createConfig } from "wagmi";
import { injected } from "@wagmi/core";
import { robinhoodChain } from "./chains";

export const wagmiConfig = createConfig({
  chains: [robinhoodChain],
  connectors: [
    injected({
      target() {
        return {
          id: "injected",
          name: "Browser Wallet",
          provider(window) {
            return window?.ethereum;
          },
        };
      },
    }),
  ],
  transports: {
    [robinhoodChain.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.mainnet.chain.robinhood.com"
    ),
  },
  ssr: true,
});
