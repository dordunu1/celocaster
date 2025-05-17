"use client";

import { SafeAreaContainer } from "@/components/safe-area-container";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { useState, useEffect } from "react";
import Onboarding from "@/components/Onboarding";
import { useUIState } from "@/hooks/useUIState";
import Celocaster from "@/components/Celocaster";
import { useAccount } from 'wagmi';

const CELOCASTER_ADDRESS = process.env.NEXT_PUBLIC_CELOCASTER_ADDRESS as `0x${string}`;

export default function App() {
  const { address } = useAccount();
  const { context } = useMiniAppContext();
  const { darkMode } = useUIState();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const onboarded = localStorage.getItem('celocasterOnboarded');
    if (!onboarded) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('celocasterOnboarded', 'true');
  };

  if (!address || !context?.user?.fid) {
    return null;
  }

  return (
    <SafeAreaContainer insets={context?.client.safeAreaInsets}>
      {showOnboarding ? (
        <Onboarding darkMode={darkMode} onEnter={handleOnboardingComplete} />
      ) : (
        <Celocaster celocasterAddress={CELOCASTER_ADDRESS} />
      )}
    </SafeAreaContainer>
  );
}
