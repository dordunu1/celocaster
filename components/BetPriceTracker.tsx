import { useState, useEffect, useCallback, useRef } from 'react';
import { useAssetPrice } from '../hooks/useAssetPrice';
import toast from 'react-hot-toast';

interface BetPriceTrackerProps {
  asset: string;
  startPrice: number;
  startTime: number;
  isPump: boolean;
  priceThreshold: number;
  darkMode?: boolean;
  resolved: boolean;
  endPrice?: number;
  thresholdMet?: boolean;
}

export default function BetPriceTracker({ 
  asset, 
  startPrice, 
  startTime, 
  isPump,
  priceThreshold,
  darkMode = false,
  resolved,
  endPrice,
  thresholdMet: resolvedThresholdMet
}: BetPriceTrackerProps) {
  const [priceChange, setPriceChange] = useState<number>(0);
  const [thresholdMet, setThresholdMet] = useState<boolean>(false);
  const [currentPrice, setCurrentPrice] = useState<number | undefined>(undefined);
  const [blink, setBlink] = useState('');
  const prevPrice = useRef<number | undefined>(undefined);
  const { price: currentPriceStr, isLoading, error } = useAssetPrice(resolved ? '' : asset, 15000);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const [spinnerPercent, setSpinnerPercent] = useState<number>(0);

  // Memoize the price update calculation
  const updatePriceChange = useCallback((priceStr: string) => {
    const currentPrice = parseFloat(priceStr.replace('$', ''));
    const changePercent = ((currentPrice - startPrice) / startPrice) * 100;
    setPriceChange(changePercent);
    if (isPump) {
      setThresholdMet(changePercent >= priceThreshold);
    } else {
      setThresholdMet(changePercent <= -priceThreshold);
    }
  }, [startPrice, priceThreshold, isPump]);

  useEffect(() => {
    if (currentPriceStr && !isLoading && !error) {
      updatePriceChange(currentPriceStr);
      setLastUpdateTime(Date.now());
      setSpinnerPercent(0);
      const currentPrice = parseFloat(currentPriceStr.replace('$', ''));
      if (prevPrice.current !== undefined) {
        if (currentPrice > prevPrice.current) {
          setBlink('green');
        } else if (currentPrice < prevPrice.current) {
          setBlink('red');
        }
        setTimeout(() => setBlink(''), 500);
      }
      prevPrice.current = currentPrice;
    }
  }, [currentPriceStr, isLoading, error, updatePriceChange]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isLoading) {
      interval = setInterval(() => {
        const elapsed = Date.now() - lastUpdateTime;
        const percent = Math.min((elapsed % 15000) / 150, 100);
        setSpinnerPercent(percent);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [lastUpdateTime, isLoading]);

  // Toast handler for spinner click
  const handleSpinnerClick = () => {
    toast('Fetching new price every 15 seconds.');
  };

  // Base container styles that maintain consistent height
  const containerClasses = "h-[5rem] min-w-[200px] flex flex-col justify-center transition-all duration-300 ease-in-out";
  const priceContainerClasses = "flex items-center justify-between w-full transition-all duration-300 ease-in-out";
  
  if (resolved && typeof endPrice === 'number' && typeof resolvedThresholdMet === 'boolean') {
    const changePercent = ((endPrice - startPrice) / startPrice) * 100;
    return (
      <div className="h-[5rem] min-w-[200px] flex flex-col justify-center transition-all duration-300 ease-in-out !h-auto min-h-0 py-1">
        <div className="w-full">
          <div className="flex items-center justify-between mb-1 min-h-[20px]">
            <div>
              <span className={`inline-block px-2 py-0.5 ${
                resolvedThresholdMet 
                  ? (darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800')
                  : (darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700')
              } text-xs rounded-full whitespace-nowrap transition-all duration-300`}>
                {resolvedThresholdMet ? 'Threshold Met!' : 'Threshold Not Met'}
              </span>
            </div>
          </div>
          <div className="flex items-center mb-0.5">
            <img src={`/images/${asset.toLowerCase()}.svg`} alt={asset} className="w-4 h-4 mr-1" />
            <span className={`font-semibold text-sm ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{asset} Price</span>
          </div>
          <div className="flex flex-col gap-0.5 mb-0.5">
            <div className="flex items-center justify-between text-sm">
              <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Opening Price:</span>
              <span className={`font-mono font-medium text-right w-32 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{startPrice ? `$${startPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Resolved Price:</span>
              <span className={`font-mono font-medium text-right w-32 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{endPrice ? `$${endPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className={`${darkMode ? 'text-gray-200' : 'text-gray-600'}`}>Change:</span>
            <span className={`font-mono font-medium ${darkMode ? (changePercent > 0 ? 'text-green-400' : 'text-red-400') : (changePercent > 0 ? 'text-green-500' : 'text-red-500')} min-w-[70px] text-right transition-all duration-300`}>
              {changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={containerClasses}>
        <div className={priceContainerClasses}>
          <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading price...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClasses}>
        <div className={priceContainerClasses}>
          <span className="text-red-500 text-sm">{error}</span>
        </div>
      </div>
    );
  }

  const isPositiveChange = priceChange > 0;
  const changeColor = isPositiveChange ? 'text-green-500' : 'text-red-500';
  const changeText = `${isPositiveChange ? '+' : ''}${priceChange.toFixed(2)}%`;

  return (
    <div className={containerClasses + " !h-auto min-h-0 py-1"}>
      <div className="w-full">
        {/* Info at top, no spinner */}
        <div className="flex items-center justify-between mb-1 min-h-[20px]">
          <div>
            {resolved ? (
              <span className={`inline-block px-2 py-0.5 ${
                thresholdMet 
                  ? (darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800')
                  : (darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700')
              } text-xs rounded-full whitespace-nowrap transition-all duration-300`}>
                {thresholdMet ? 'Threshold Met!' : 'Threshold Not Met'}
              </span>
            ) : (
              thresholdMet && (
                <span className={`inline-block px-2 py-0.5 ${darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'} text-xs rounded-full whitespace-nowrap transition-all duration-300`}>
                  Threshold Met!
                </span>
              )
            )}
          </div>
        </div>
        {/* Asset header */}
        <div className="flex items-center mb-0.5">
          <img src={`/images/${asset.toLowerCase()}.svg`} alt={asset} className="w-4 h-4 mr-1" />
          <span className={`font-semibold text-sm ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{asset} Price</span>
        </div>
        {/* Price rows */}
        <div className="flex flex-col gap-0.5 mb-0.5">
          <div className="flex items-center justify-between text-sm">
            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Opening Price:</span>
            <span className={`font-mono font-medium text-right w-32 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{startPrice ? `$${startPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current Price:</span>
            <span className={`font-mono font-medium text-right w-32 ${darkMode ? 'text-gray-200' : 'text-gray-800'} ${blink ? 'animate-blink-bg' : ''}`}>
              {currentPriceStr || '-'}
            </span>
          </div>
        </div>
        {/* Change */}
        <div className="flex items-center justify-between text-sm">
          <span className={`${darkMode ? 'text-gray-200' : 'text-gray-600'}`}>Change:</span>
          <span className={`font-mono font-medium ${darkMode ? (isPositiveChange ? 'text-green-400' : 'text-red-400') : (isPositiveChange ? 'text-green-500' : 'text-red-500')} min-w-[70px] text-right transition-all duration-300`}>
            {changeText}
          </span>
        </div>
      </div>
    </div>
  );
}

/* Add this to the bottom of the file or in your global CSS */
/*
.animate-blink-bg {
  animation: blink-bg 0.5s;
}
@keyframes blink-bg {
  0% { background-color: #facc15; }
  100% { background-color: transparent; }
}
*/ 