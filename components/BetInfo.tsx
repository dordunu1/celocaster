import React, { useState, useEffect } from 'react';
import { Bet } from '../lib/types/bet';
import BetVoting from './BetVoting';
import { ThumbsUp, ThumbsDown, Share2 } from 'lucide-react';
import { useMiniAppContext } from '../hooks/use-miniapp-context';

// Add contract address from app/page.tsx
const BETCASTER_ADDRESS = process.env.NEXT_PUBLIC_BETCASTER_ADDRESS;

interface BetInfoProps {
  bet: Bet;
  darkMode: boolean;
  betcasterAddress: `0x${string}`;
  onVoteSuccess?: () => void;
}

export default function BetInfo({ bet, darkMode, betcasterAddress, onVoteSuccess }: BetInfoProps) {
  const { actions } = useMiniAppContext();

  const isVerifiedBetWithPrice = (bet: Bet): boolean => {
    return bet.betType === 'verified' && bet.predictionType !== undefined;
  };

  // Spinner state for price fetch
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const [spinnerPercent, setSpinnerPercent] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastUpdateTime;
      const percent = Math.min((elapsed % 15000) / 150, 100);
      setSpinnerPercent(percent);
    }, 100);
    return () => clearInterval(interval);
  }, [lastUpdateTime]);

  // Reset spinner when bet changes (simulate price update)
  useEffect(() => {
    setLastUpdateTime(Date.now());
  }, [bet.id]);

  // Share handler
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/share?bet=${bet.id}`;
    const shareText = `🏆 Bet Prediction: ${bet.content}\nVote YAY or NAY on BetCaster!`;
    if (actions && actions.composeCast) {
      await actions.composeCast({
        text: shareText,
        embeds: [shareUrl]
      });
    } else {
      const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl)}`;
      window.open(url, '_blank');
    }
  };

  if (isVerifiedBetWithPrice(bet)) {
    // Determine if bet is resolved and use resolved data if available
    const isResolved = bet.status === 'RESOLVED';
    // Use resolved threshold and price if available, otherwise fallback
    const thresholdMet = isResolved && ('thresholdMet' in bet) ? (bet as any).thresholdMet : undefined;
    const endPrice = isResolved && ('endPrice' in bet) ? (bet as any).endPrice : undefined;

    return (
      <div className={`px-4 py-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-t transition-colors duration-200`}>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center text-sm justify-between w-full">
            <div className="flex items-center">
              <span className="font-medium">{bet.betAmount} MON to vote</span>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>Chainlink Verified</span>
              {/* Show threshold status */}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${thresholdMet ? (darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700') : (darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700')}`}>{thresholdMet ? 'Threshold Met' : 'Threshold Not Met'}</span>
            </div>
          </div>
          {/* Show price info */}
          <div className="flex flex-col text-xs mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="mr-2">{isResolved ? 'Resolved Price:' : 'Current Price:'}</span>
                <span className="font-mono">{endPrice ? `$${endPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '-'}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center">
              <ThumbsUp className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'} mr-1`} />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{bet.yay}</span>
            </div>
            <div className="flex items-center">
              <ThumbsDown className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'} mr-1`} />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{bet.nay}</span>
            </div>
            <BetVoting
              betId={bet.id}
              voteStake={bet.betAmount}
              betcasterAddress={betcasterAddress}
              onVoteSuccess={onVoteSuccess}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`px-4 py-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-t transition-colors duration-200`}>
      <div className="flex flex-col space-y-2">
        <div className="flex items-center text-sm justify-between w-full">
          <div className="flex items-center">
            <span className="font-medium">{bet.betAmount} MON to vote</span>
            <span className="text-xs ml-1">• Community vote</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <ThumbsUp className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'} mr-1`} />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{bet.yay}</span>
            </div>
            <div className="flex items-center">
              <ThumbsDown className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'} mr-1`} />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{bet.nay}</span>
            </div>
          </div>
          
          <BetVoting
            betId={bet.id}
            voteStake={bet.betAmount}
            betcasterAddress={betcasterAddress}
            onVoteSuccess={onVoteSuccess}
          />
        </div>
      </div>
    </div>
  );
} 