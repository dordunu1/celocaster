import { Metadata } from "next";
import App from "@/components/pages/app";
import { APP_URL } from "@/lib/constants";
import Celocaster from '@/components/Celocaster';

// Contract address from deployments.json
const CELOCASTER_ADDRESS = process.env.NEXT_PUBLIC_CELOCASTER_ADDRESS as `0x${string}`;

const frame = {
  version: "next",
  imageUrl: `${APP_URL}/images/feed.png`,
  button: {
    title: "Bet Now!",
    action: {
      type: "launch_frame",
      name: "Celocaster",
      url: APP_URL,
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: "#f7f7f7",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "CeloCaster - Decentralized Prediction Markets on Celo",
    openGraph: {
      title: "CeloCaster - Decentralized Prediction Markets on Celo",
      description: "Predict, bet, and win! Create and join decentralized prediction markets—price-based or community-voted—on Celo.",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default App;
