import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy, QuerySnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { betService } from '../lib/services/betService';
import { Bet, VoteType } from '../lib/types/bet';

interface Vote {
  id: string;
  betId: string;
  userId: string;
  voteType: VoteType;
  timestamp: number;
}

export function useMyActivities(username?: string, fid?: string) {
  const [myBets, setMyBets] = useState<Bet[]>([]);
  const [myVotes, setMyVotes] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch bets created by the user (by username)
  const fetchMyBets = useCallback(async () => {
    if (!username) return;
    try {
      const q = query(
        collection(db, 'bets'),
        where('author', '==', username),
        orderBy('timestamp', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const bets = await Promise.all(snapshot.docs.map(async (doc) => {
          const bet = { id: doc.id, ...doc.data() } as Bet;
          
          // Get user's vote
          const voteQuery = query(
            collection(db, 'votes'),
            where('betId', '==', bet.id),
            where('userId', '==', username)
          );
          const voteSnapshot: QuerySnapshot<any> = await betService.getVotes(voteQuery);
          bet.userVote = voteSnapshot.empty ? undefined : (voteSnapshot.docs[0].data().voteType as VoteType);
          
          return bet;
        }));
        setMyBets(bets);
      });

      return unsubscribe;
    } catch (err) {
      console.error('Failed to fetch my bets:', err);
      setMyBets([]);
    }
  }, [username]);

  // Fetch bets voted on by the user (by FID)
  const fetchMyVotes = useCallback(async () => {
    if (!fid) return;
    try {
      const voteQuery = query(
        collection(db, 'votes'),
        where('userId', '==', fid),
        orderBy('timestamp', 'desc')
      );
      
      const unsubscribe = onSnapshot(voteQuery, async (voteSnapshot) => {
        const votes = voteSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Vote[];
        
        // Get all bets that were voted on
        const bets = await Promise.all(votes.map(async (vote) => {
          const bet = await betService.getBet(vote.betId, fid);
          if (bet) {
            // Add the user's vote type to the bet
            bet.userVote = vote.voteType;
          }
          return bet;
        }));
        
        setMyVotes(bets.filter((bet): bet is Bet => bet !== null));
      });

      return unsubscribe;
    } catch (err) {
      console.error('Failed to fetch my votes:', err);
      setMyVotes([]);
    }
  }, [fid]);

  // Set up real-time listeners
  useEffect(() => {
    setLoading(true);
    const unsubscribers: (() => void)[] = [];

    const setupListeners = async () => {
      const myBetsUnsubscribe = await fetchMyBets();
      const myVotesUnsubscribe = await fetchMyVotes();
      
      if (myBetsUnsubscribe) unsubscribers.push(myBetsUnsubscribe);
      if (myVotesUnsubscribe) unsubscribers.push(myVotesUnsubscribe);
      
      setLoading(false);
    };

    setupListeners();

    return () => unsubscribers.forEach(unsub => unsub());
  }, [fetchMyBets, fetchMyVotes]);

  return {
    myBets,
    myVotes,
    loading
  };
}