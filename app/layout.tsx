import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { FrameProvider } from "@/components/farcaster-provider";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BetCaster",
  description: "Decentralized Prediction Markets on Monad - Bet on crypto price moves or community outcomes. Create, vote, and win with transparent, on-chain prediction markets—whether price-verified or community-driven—powered by Monad.",
  openGraph: {
    title: "BetCaster",
    description: "Predict, bet, and win! The easiest way to create and join decentralized prediction markets—price-based or community-voted—on Monad.",
    images: ["https://betcaster.netlify.app/images/feed.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FrameProvider>{children}</FrameProvider>
      </body>
    </html>
  );
}
