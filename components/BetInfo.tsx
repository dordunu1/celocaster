import React from 'react';
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