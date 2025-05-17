import { useState, useEffect, useCallback, useRef } from 'react';
import { useContractRead } from 'wagmi';
import { formatUnits } from 'viem';
import CELOCASTER_ABI from '../contracts/abi/Celocaster.json';
import CHAINLINK_ABI from '../contracts/abi/ChainlinkAggregator.json';
import { shouldThrottle, updateBackoff, getBackoffDelay } from '../lib/utils/rpcUtils';

// Contract addresses
const CELOCASTER_ADDRESS = process.env.NEXT_PUBLIC_CELOCASTER_ADDRESS as `0x${string}`;

// Cache for price data
const priceCache = new Map<string, { price: string; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds cache
const MIN_REFRESH_INTERVAL = 30000; // Minimum 30 seconds between RPC calls

export const useAssetPrice = (
  assetSymbol: string,
  refreshInterval = 30000 // Default to 30 seconds
) => {
  const [price, setPrice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to avoid unnecessary re-renders
  const lastUpdateRef = useRef(0);
  const mountedRef = useRef(true);

  // Get price feed address from Celocaster contract
  const { data: priceFeedAddress, isError: isPriceFeedError } = useContractRead({
    address: CELOCASTER_ADDRESS,
    abi: CELOCASTER_ABI,
    functionName: 'getPriceFeed',
    args: [assetSymbol],
    query: {
      enabled: Boolean(assetSymbol),
      staleTime: CACHE_DURATION,
      retry: 3,
      retryDelay: 1000
    }
  });

  // Get latest price from Chainlink price feed
  const { data: priceData, refetch, isError: isPriceError } = useContractRead({
    address: priceFeedAddress as `0x${string}`,
    abi: CHAINLINK_ABI,
    functionName: 'latestRoundData',
    query: {
      enabled: Boolean(priceFeedAddress),
      staleTime: MIN_REFRESH_INTERVAL,
      retry: 3,
      retryDelay: 1000,
      gcTime: CACHE_DURATION
    }
  });

  const updatePrice = useCallback(async () => {
    if (!mountedRef.current || !assetSymbol) return;

    const now = Date.now();
    const rpcKey = `price_${assetSymbol}`;

    // Check cache first
    const cached = priceCache.get(assetSymbol);
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      if (mountedRef.current) {
        setPrice(cached.price);
        setIsLoading(false);
        setError(null);
      }
      return;
    }

    // Check if we should throttle
    if (shouldThrottle(rpcKey)) {
      const delay = getBackoffDelay(rpcKey);
      console.log(`[Price Feed] Throttling ${assetSymbol} price update for ${delay}ms`);
      setTimeout(updatePrice, delay);
      return;
    }

    // Get price feed address if not available
    if (!priceFeedAddress) {
      console.log(`[Price Feed] Failed to get price feed address for ${assetSymbol}`);
      setError('Price feed not available');
      setIsLoading(false);
      return;
    }

    try {
      console.log(`[Price Feed] Fetching price for ${assetSymbol} from ${priceFeedAddress}`);
      const result = await refetch();

      if (result.data && mountedRef.current) {
        const [, currentPrice] = result.data as [bigint, bigint, bigint, bigint, bigint];
        const formattedPrice = `$${parseFloat(formatUnits(currentPrice, 8)).toFixed(2)}`;
        
        console.log(`[Price Feed] Got new price for ${assetSymbol}:`, formattedPrice);
        
        // Update cache
        priceCache.set(assetSymbol, {
          price: formattedPrice,
          timestamp: now
        });
        
        setPrice(formattedPrice);
        lastUpdateRef.current = now;
        setError(null);
        updateBackoff(rpcKey, true);
      }
    } catch (err) {
      if (mountedRef.current) {
        console.error(`[Price Feed] Error fetching ${assetSymbol} price:`, err);
        updateBackoff(rpcKey, false);
        setError('Failed to fetch price');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [assetSymbol, priceFeedAddress, refetch]);

  // Setup effect
  useEffect(() => {
    mountedRef.current = true;
    
    if (assetSymbol) {
      console.log(`[Price Feed] Starting price updates for ${assetSymbol}`);
      updatePrice();

      const interval = setInterval(updatePrice, Math.max(refreshInterval, MIN_REFRESH_INTERVAL));
      
      return () => {
        mountedRef.current = false;
        clearInterval(interval);
      };
    }
  }, [assetSymbol, refreshInterval, updatePrice]);

  return { price, isLoading, error };
}; 