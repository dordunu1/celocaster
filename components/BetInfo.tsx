import React, { useState, useEffect } from 'react';
import { Bet } from '../lib/types/bet';
import BetVoting from './BetVoting';
import { ThumbsUp, ThumbsDown, Share2 } from 'lucide-react';
import { useMiniAppContext } from '../hooks/use-miniapp-context';
import { useAssetPrice } from '../hooks/useAssetPrice';

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

  // Move useAssetPrice to top level
  const asset = bet.asset || '';
  const { price: currentPrice, isLoading: isPriceLoading, error: priceError } = useAssetPrice(asset);

  if (isVerifiedBetWithPrice(bet)) {
    // Determine if bet is resolved and use resolved data if available
    const isResolved = bet.status === 'RESOLVED';
    const thresholdMet = isResolved && ('thresholdMet' in bet) ? (bet as any).thresholdMet : undefined;
    const endPrice = isResolved && ('endPrice' in bet) ? (bet as any).endPrice : undefined;
    const startPrice = bet.startPrice;

    // Calculate change for open and resolved bets
    let displayChange: string | undefined = '-';
    let changeValue: number | undefined;
    if (typeof startPrice === 'number') {
      if (isResolved && typeof endPrice === 'number') {
        changeValue = ((endPrice - startPrice) / startPrice) * 100;
      } else if (!isResolved && currentPrice && currentPrice.startsWith('$')) {
        const livePriceNum = parseFloat(currentPrice.replace(/[$,]/g, ''));
        if (!isNaN(livePriceNum)) {
          changeValue = ((livePriceNum - startPrice) / startPrice) * 100;
        }
      }
      if (typeof changeValue === 'number') {
        displayChange = `${changeValue > 0 ? '+' : ''}${changeValue.toFixed(2)}%`;
      }
    }

    // Format current price for display
    let formattedCurrentPrice = '-';
    if (isResolved) {
      formattedCurrentPrice = typeof endPrice === 'number'
        ? `$${endPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '-';
    } else if (currentPrice && currentPrice.startsWith('$')) {
      const livePriceNum = parseFloat(currentPrice.replace(/[$,]/g, ''));
      if (!isNaN(livePriceNum)) {
        formattedCurrentPrice = `$${livePriceNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    } else if (isPriceLoading) {
      formattedCurrentPrice = 'Loading...';
    }

    const assetIcon = asset ? `/images/${asset.toLowerCase()}.svg` : null;

    return (
      <div className={`px-4 py-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-t transition-colors duration-200`}>
        {/* Info Row */}
        <div className="flex items-center text-sm mb-1">
          <span className="font-medium">{bet.betAmount} MON to vote</span>
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>Chainlink Verified</span>
        </div>
        {/* Threshold Status */}
        {isResolved && (
          <div className="mb-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${thresholdMet ? (darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700') : (darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700')}`}>{thresholdMet ? 'Threshold Met' : 'Threshold Not Met'}</span>
          </div>
        )}
        {/* Price Section */}
        <div className={`rounded-lg p-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} mt-1`}> 
          <div className="flex items-center mb-2">
            {assetIcon && (
              <img src={assetIcon} alt={asset} className="w-5 h-5 mr-2" />
            )}
            <span className={`font-bold text-sm ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{asset} Price</span>
          </div>
          <div className="flex flex-col gap-0.5 mb-0.5">
            <div className="flex items-center justify-between text-sm">
              <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Opening Price:</span>
              <span className={`font-mono font-medium text-right w-32 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{typeof startPrice === 'number' ? `$${startPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{isResolved ? 'Resolved Price:' : 'Current Price:'}</span>
              <span className={`font-mono font-medium text-right w-32 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{formattedCurrentPrice}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className={`${darkMode ? 'text-gray-200' : 'text-gray-600'}`}>Change:</span>
            <span className={`font-mono font-medium ${darkMode ? (changeValue && changeValue > 0 ? 'text-green-400' : 'text-red-400') : (changeValue && changeValue > 0 ? 'text-green-500' : 'text-red-500')} min-w-[70px] text-right transition-all duration-300`}>
              {displayChange}
            </span>
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
        {/* Removed BetVoting and all voting buttons for community vote */}
      </div>
    </div>
  );
}