import React, { useState, useEffect } from 'react';
import { Bet } from '../lib/types/bet';
import BetVoting from './BetVoting';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

// Add contract address from app/page.tsx
const BETCASTER_ADDRESS = '0x8AEA4985c1739d21968659bE091A2c7be6eA48a7' as const;

interface BetInfoProps {
  bet: Bet;
  darkMode: boolean;
  betcasterAddress: `0x${string}`;
  onVoteSuccess?: () => void;
}

export default function BetInfo({ bet, darkMode, betcasterAddress, onVoteSuccess }: BetInfoProps) {
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

  if (isVerifiedBetWithPrice(bet)) {
    return (
      <div className={`px-4 py-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-t transition-colors duration-200`}>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center text-sm">
            <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-200`}>
              <span className="font-medium">{bet.betAmount} MON to vote</span>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                Chainlink Verified
              </span>
              {/* Spinner with tooltip for price update */}
              <div className="relative inline-block align-middle ml-2">
                <div className="relative w-7 h-7 flex items-center justify-center cursor-pointer group" title="Show price fetch info">
                  <svg className="absolute top-0 left-0" width="28" height="28">
                    <circle
                      cx="14" cy="14" r="12"
                      fill="none"
                      stroke={darkMode ? '#a78bfa' : '#7c3aed'}
                      strokeWidth="3"
                      strokeDasharray={2 * Math.PI * 12}
                      strokeDashoffset={2 * Math.PI * 12 * (1 - spinnerPercent / 100)}
                      style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                    />
                  </svg>
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{Math.max(0, 15 - Math.floor((Date.now() - lastUpdateTime) / 1000))}s</span>
                </div>
                {/* Tooltip styled like info icon */}
                <div className="absolute z-50 invisible group-hover:visible text-xs rounded-lg py-2 px-3 left-1/2 -translate-x-1/2 mt-2 min-w-[180px] max-w-[220px] shadow-xl bg-black/90 text-white">
                  Fetching new price every 15 seconds.
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 transform rotate-45 bg-black/90"></div>
                </div>
              </div>
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

  return (
    <div className={`px-4 py-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-t transition-colors duration-200`}>
      <div className="flex flex-col space-y-2">
        <div className="flex items-center text-sm">
          <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-200`}>
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