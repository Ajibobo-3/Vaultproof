import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "VaultProof ($VPROOF) — Autonomous Liquidity Shield & Buyback Terminal",
  description:
    "Autonomous liquidity shield and buyback terminal on Pons V2 (Robinhood Chain). 100% of creator fees auto-swapped and permanently burned.",
  keywords: [
    "VaultProof",
    "VPROOF",
    "Robinhood Chain",
    "Pons V2",
    "Liquidity Shield",
    "Buyback and Burn",
    "Web3 Terminal",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className="font-sans bg-[#090A0F] text-gray-100 min-h-screen antialiased selection:bg-emerald-500/30 selection:text-emerald-200"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
