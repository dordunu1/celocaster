'use client';

import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, Activity, Globe } from 'lucide-react';
import { celo } from 'wagmi/chains';

interface BottomNavProps {
  isConnected: boolean;
  address?: string;
  chainId?: number;
  darkMode: boolean;
  connectors: readonly any[];
  connect: (args: { connector: any }) => void;
  switchChain: (args: { chainId: number }) => void;
  balanceData?: { formatted: string };
  isEthProviderAvailable: boolean;
  connectError: Error | null;
  switchError: Error | null;
  activePage: 'feed' | 'activities' | 'leaderboard';
  onNavigate: (page: 'feed' | 'activities' | 'leaderboard') => void;
}

export default function BottomNav({ 
  isConnected, 
  address, 
  chainId, 
  darkMode, 
  connectors,
  connect,
  switchChain,
  balanceData,
  isEthProviderAvailable,
  connectError,
  switchError,
  activePage,
  onNavigate
}: BottomNavProps) {
  const [mounted, setMounted] = useState(false);
  const [showBalance, setShowBalance] = useState(false);

  // Function to format balance to 1 decimal place
  const formatBalance = (balance: string | undefined) => {
    if (!balance) return "...";
    const num = parseFloat(balance);
    return num.toFixed(1);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t shadow-lg`}>
      <div className="container mx-auto px-4">
        {!isEthProviderAvailable && (
          <div className="text-red-400 font-bold py-2 text-center">
            Wallet not available. Please open this app inside Warpcast.
          </div>
        )}

        <div className="flex items-center justify-between py-2">
          {/* Feed */}
          <button
            className={`flex flex-col items-center p-2 rounded transition-colors ${
              activePage === 'feed'
                ? 'bg-yellow-500 text-white'
                : darkMode ? 'text-gray-400 hover:text-yellow-500' : 'text-gray-600 hover:text-yellow-600'
            }`}
            onClick={() => onNavigate('feed')}
          >
            <Award className="h-6 w-6" />
            <span className="text-xs mt-1">Feed</span>
          </button>

          {/* My Activities */}
          <button
            className={`flex flex-col items-center p-2 rounded transition-colors ${
              activePage === 'activities'
                ? 'bg-yellow-500 text-white'
                : darkMode ? 'text-gray-400 hover:text-yellow-500' : 'text-gray-600 hover:text-yellow-600'
            }`}
            onClick={() => onNavigate('activities')}
          >
            <TrendingUp className="h-6 w-6" />
            <span className="text-xs mt-1">My Activities</span>
          </button>

          {/* Leaderboard */}
          <button
            className={`flex flex-col items-center p-2 rounded transition-colors ${
              activePage === 'leaderboard'
                ? 'bg-yellow-500 text-white'
                : darkMode ? 'text-gray-400 hover:text-yellow-500' : 'text-gray-600 hover:text-yellow-600'
            }`}
            onClick={() => onNavigate('leaderboard')}
          >
            <Activity className="h-6 w-6" />
            <span className="text-xs mt-1">Leaders</span>
          </button>

          {/* Wallet Connection */}
          <div className="flex flex-col items-center relative">
            {isEthProviderAvailable && !isConnected && (
              <button 
                onClick={() => connect({ connector: connectors[0] })}
                className={`flex flex-col items-center p-2 ${darkMode ? 'text-gray-300 hover:text-yellow-500' : 'text-gray-600 hover:text-yellow-600'}`}
              >
                <Globe className="h-6 w-6" />
                <span className="text-xs mt-1">Connect</span>
              </button>
            )}

            {isConnected && chainId !== celo.id && (
              <button
                onClick={() => switchChain({ chainId: celo.id })}
                className={`flex flex-col items-center p-2 ${darkMode ? 'text-yellow-500 hover:text-yellow-200' : 'text-yellow-600 hover:text-yellow-700'}`}
              >
                <Globe className="h-6 w-6" />
                <span className="text-xs mt-1">Switch Chain</span>
              </button>
            )}

            {isConnected && chainId === celo.id && (
              <>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className={`flex flex-col items-center p-2 ${darkMode ? 'text-yellow-500' : 'text-yellow-600'}`}
                >
                  <Globe className="h-6 w-6" />
                  <div className="flex flex-col items-center">
                    <span className="text-xs mt-1 font-mono">
                      {address?.slice(0, 4)}...{address?.slice(-4)}
                    </span>
                    <span className="text-[10px] mt-0.5">Celo</span>
                  </div>
                </button>

                {/* Floating Balance Display */}
                {showBalance && (
                  <div 
                    className={`absolute bottom-full mb-2 p-2 rounded-lg shadow-lg min-w-[150px] text-center
                      ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
                  >
                    <div className="text-sm font-medium">Balance</div>
                    <div className="font-mono">
                      {formatBalance(balanceData?.formatted)} CELO
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Error Messages */}
        {(connectError || switchError) && (
          <div className="text-xs text-red-400 text-center pb-2">
            {connectError?.message || "Could not switch chain automatically. Please switch your wallet to Celo Mainnet."}
          </div>
        )}
      </div>
    </div>
  );
} 