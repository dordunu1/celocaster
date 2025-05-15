import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { betService } from '../lib/services/betService';
import { Bet, VoteType, Comment } from '../lib/types/bet';

export function useBets(userId?: string) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedComments, setExpandedComments] = useState<{ [betId: string]: Comment[] }>({});

  // Load bets function for manual refreshes
  const loadBets = useCallback(async () => {
    try {
      setLoading(true);
      const updatedBets = await betService.getBets(userId);
      setBets(updatedBets);
    } catch (err) {
      console.error('Failed to load bets:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Set up real-time listener
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];
    
    try {
      // Set up real-time listener for bets collection
      const q = query(collection(db, 'bets'), orderBy('timestamp', 'desc'));
      const betsUnsubscribe = onSnapshot(q, async (snapshot) => {
        const updatedBets = await Promise.all(snapshot.docs.map(async (doc) => {
          const bet = { id: doc.id, ...doc.data() } as Bet;
          
          // Get user's vote if userId provided
          if (userId) {
            const voteQuery = query(
              collection(db, 'votes'),
              where('betId', '==', bet.id),
              where('userId', '==', userId)
            );
            const voteSnapshot = await getDocs(voteQuery);
            bet.userVote = voteSnapshot.empty ? undefined : (voteSnapshot.docs[0].data().voteType as VoteType);
          }
          
          return bet;
        }));
        setBets(updatedBets);
        setLoading(false);
      });
      
      unsubscribers.push(betsUnsubscribe);
    } catch (err) {
      console.error('Failed to set up real-time listener:', err);
      setLoading(false);
    }

    return () => unsubscribers.forEach(unsub => unsub());
  }, [userId]);

  // Fetch comments for a bet when expanded (real-time)
  const listenToCommentsForBet = useCallback((betId: string) => {
    const commentsQuery = query(
      collection(db, 'comments'),
      where('betId', '==', String(betId)),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(commentsQuery, (commentsSnapshot) => {
      const comments = commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comment[];
      setExpandedComments(prev => ({ ...prev, [betId]: comments }));
    });
    return unsubscribe;
  }, []);

  return {
    bets,
    loading,
    expandedComments,
    loadBets,
    listenToCommentsForBet
  };
} 