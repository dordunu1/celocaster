import { useState, useEffect, useCallback } from 'react';
import { betService } from '../services/betService';
import { db } from '../../lib/firebase/config';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Bet, Comment } from '../types/bet';

export function useBets(userFid?: string) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedComments, setExpandedComments] = useState<{ [betId: string]: Comment[] }>({});

  const loadBets = useCallback(async () => {
    try {
      setLoading(true);
      const loadedBets = await betService.getBets();
      setBets(loadedBets);
    } catch (err) {
      console.error('Failed to load bets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const listenToCommentsForBet = useCallback((betId: string) => {
    const commentsQuery = query(
      collection(db, 'comments'),
      where('betId', '==', betId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const comments: Comment[] = [];
      snapshot.forEach((doc) => {
        comments.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setExpandedComments(prev => ({ ...prev, [betId]: comments }));
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    loadBets();
  }, [loadBets]);

  return {
    bets,
    loading,
    expandedComments,
    loadBets,
    listenToCommentsForBet
  };
} 