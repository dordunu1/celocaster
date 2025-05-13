import { useState, useEffect } from 'react';
import { betService } from '../services/betService';
import { marketService } from '../services/marketService';
import { Bet, TickerItem } from '../types/bet';
import { useMiniAppContext } from '../../hooks/use-miniapp-context';

export function useBets() {
  const { context } = useMiniAppContext();
  const [bets, setBets] = useState<Bet[]>([]);
  const [tickerData, setTickerData] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load bets
  useEffect(() => {
    loadBets();
    loadMarketData();
    
    // Refresh market data every minute
    const marketInterval = setInterval(loadMarketData, 60000);
    return () => clearInterval(marketInterval);
  }, [context?.user?.fid]);

  async function loadBets() {
    try {
      setLoading(true);
      const fetchedBets = await betService.getBets(context?.user?.fid?.toString());
      setBets(fetchedBets);
    } catch (err) {
      setError('Failed to load bets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMarketData() {
    try {
      const [crypto, stocks] = await Promise.all([
        marketService.getCryptoPrices(),
        marketService.getStockPrices()
      ]);
      setTickerData([...crypto, ...stocks]);
    } catch (err) {
      console.error('Failed to load market data:', err);
    }
  }

  async function createBet(bet: Omit<Bet, 'id' | 'comments' | 'yay' | 'nay' | 'userVote' | 'commentCount'>) {
    try {
      const id = `${context?.user?.fid || 'anon'}-${Date.now()}`;
      await betService.createBet({ ...bet, id });
      await loadBets();
    } catch (err) {
      setError('Failed to create bet');
      console.error(err);
    }
  }

  async function voteBet(betId: string, voteType: 'yay' | 'nay') {
    if (!context?.user?.fid) {
      setError('Must be logged in to vote');
      return;
    }

    try {
      await betService.voteBet(betId, context.user.fid.toString(), voteType);
      await loadBets();
    } catch (err) {
      setError('Failed to vote on bet');
      console.error(err);
    }
  }

  async function addComment(betId: string, content: string) {
    if (!context?.user?.fid) {
      setError('Must be logged in to comment');
      return;
    }

    try {
      await betService.addComment({
        betId,
        author: context.user.username || 'anonymous',
        content,
      });
      await loadBets();
    } catch (err) {
      setError('Failed to add comment');
      console.error(err);
    }
  }

  return {
    bets,
    tickerData,
    loading,
    error,
    createBet,
    voteBet,
    addComment,
    refreshBets: loadBets,
  };
} 