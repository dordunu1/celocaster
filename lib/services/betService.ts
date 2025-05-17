import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  increment,
  writeBatch,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { Bet, Comment, VoteType } from '../types/bet';

const BETS_COLLECTION = 'bets';
const COMMENTS_COLLECTION = 'comments';
const VOTES_COLLECTION = 'votes';

export const betService = {
  // Create a new bet
  async createBet(bet: Omit<Bet, 'id' | 'comments' | 'yay' | 'nay' | 'userVote' | 'commentCount'> & { id: string }): Promise<string> {
    const betId = bet.id;
    await setDoc(doc(db, BETS_COLLECTION, betId), {
      ...bet,
      yay: 0,
      nay: 0,
      commentCount: 0,
      timestamp: Date.now(),
      status: 'ACTIVE',
    });
    return betId;
  },

  // Get a single bet by ID
  async getBet(betId: string, userId?: string): Promise<Bet | null> {
    const betDoc = await getDoc(doc(db, BETS_COLLECTION, betId));
    if (!betDoc.exists()) return null;
    
    const bet = { id: betDoc.id, ...betDoc.data() } as Bet;
    
    // Get user's vote if userId provided
    if (userId) {
      const voteQuery = query(
        collection(db, VOTES_COLLECTION),
        where('betId', '==', betId),
        where('userId', '==', userId)
      );
      const voteSnapshot = await getDocs(voteQuery);
      bet.userVote = voteSnapshot.empty ? undefined : (voteSnapshot.docs[0].data().voteType as VoteType);
    }

    // Get comments for this bet
    const commentsQuery = query(
      collection(db, COMMENTS_COLLECTION),
      where('betId', '==', String(betId)),
      orderBy('timestamp', 'desc')
    );
    const commentsSnapshot = await getDocs(commentsQuery);
    bet.comments = commentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }) as Comment);
    if (!Array.isArray(bet.comments)) bet.comments = [];
    
    return bet;
  },

  // Get all bets
  async getBets(userId?: string): Promise<Bet[]> {
    const q = query(collection(db, BETS_COLLECTION), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const bets: Bet[] = [];
    
    for (const doc of snapshot.docs) {
      const bet = { id: doc.id, ...doc.data() } as Bet;
      
      // Get user's vote if userId provided
      if (userId) {
        const voteQuery = query(
          collection(db, VOTES_COLLECTION),
          where('betId', '==', bet.id),
          where('userId', '==', userId)
        );
        const voteSnapshot = await getDocs(voteQuery);
        bet.userVote = voteSnapshot.empty ? undefined : (voteSnapshot.docs[0].data().voteType as VoteType);
      }

      // Get comments for this bet
      const commentsQuery = query(
        collection(db, COMMENTS_COLLECTION),
        where('betId', '==', String(bet.id)),
        orderBy('timestamp', 'desc')
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      bet.comments = commentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as Comment);
      if (!Array.isArray(bet.comments)) bet.comments = [];
      bets.push(bet);
    }
    
    return bets;
  },

  // Add a comment to a bet
  async addComment(comment: Omit<Comment, 'id' | 'timestamp'> & { betId: string }): Promise<string> {
    const batch = writeBatch(db);
    
    // Create comment
    const commentRef = doc(collection(db, COMMENTS_COLLECTION));
    batch.set(commentRef, {
      ...comment,
      timestamp: Date.now(),
    });

    // Increment comment count
    const betRef = doc(db, BETS_COLLECTION, comment.betId);
    batch.update(betRef, {
      commentCount: increment(1)
    });

    await batch.commit();
    return commentRef.id;
  },

  // Vote on a bet
  async voteBet(betId: string, userId: string, voteType: VoteType, username?: string, pfpUrl?: string): Promise<void> {
    const voteQuery = query(
      collection(db, VOTES_COLLECTION),
      where('betId', '==', betId),
      where('userId', '==', userId)
    );
    const voteSnapshot = await getDocs(voteQuery);
    
    const batch = writeBatch(db);
    const betRef = doc(db, BETS_COLLECTION, betId);
    
    if (voteSnapshot.empty) {
      // New vote
      const voteRef = doc(collection(db, VOTES_COLLECTION));
      batch.set(voteRef, {
        betId,
        userId,
        voteType,
        timestamp: Date.now(),
        username,
        pfpUrl
      });
      batch.update(betRef, {
        [voteType]: increment(1)
      });
    } else {
      const existingVote = voteSnapshot.docs[0];
      const existingVoteType = existingVote.data().voteType;
      
      if (existingVoteType === voteType) {
        // Remove vote
        batch.delete(existingVote.ref);
        batch.update(betRef, {
          [voteType]: increment(-1)
        });
      } else {
        // Change vote
        batch.update(existingVote.ref, { 
          voteType,
          username,
          pfpUrl
        });
        batch.update(betRef, {
          [existingVoteType]: increment(-1),
          [voteType]: increment(1)
        });
      }
    }
    
    await batch.commit();
  },

  // Update bet status
  async updateBetStatus(betId: string, status: Bet['status']): Promise<void> {
    const betRef = doc(db, BETS_COLLECTION, betId);
    await updateDoc(betRef, { status });
  },

  // Get votes for a bet
  async getVotes(voteQuery: any) {
    return getDocs(voteQuery);
  },

  // Get top bet creators for leaderboard
  async getTopCreators(limit: number = 20) {
    const betsRef = collection(db, BETS_COLLECTION);
    
    // Note: Firestore does not support grouping and aggregation directly in a single query.
    // We will fetch all bets and process the aggregation in the application code.
    // For a large number of bets, a backend solution would be more scalable.
    
    const snapshot = await getDocs(betsRef);
    
    const creatorStats: { [address: string]: { author: string; totalBets: number; totalPool: number; pfpUrl?: string; latestTimestamp: number } } = {};
    
    snapshot.docs.forEach(doc => {
      const bet = doc.data() as Bet;
      if (bet.authorAddress) {
        if (!creatorStats[bet.authorAddress]) {
          creatorStats[bet.authorAddress] = {
            author: bet.author || 'anonymous',
            totalBets: 0,
            totalPool: 0,
            pfpUrl: bet.pfpUrl,
            latestTimestamp: bet.timestamp || 0
          };
        }

        if (bet.timestamp && bet.timestamp > creatorStats[bet.authorAddress].latestTimestamp) {
           creatorStats[bet.authorAddress].pfpUrl = bet.pfpUrl;
           creatorStats[bet.authorAddress].latestTimestamp = bet.timestamp;
        }

        creatorStats[bet.authorAddress].totalBets++;
        // Assuming bet.betAmount is the stake per voter, and yay/nay are vote counts
        // Total pool for a bet is (yay + nay) * betAmount
        const totalBetPool = (bet.yay + bet.nay) * (bet.betAmount || 0);
        creatorStats[bet.authorAddress].totalPool += totalBetPool;
      }
    });
    
    // Convert to array and sort by total pool (descending), then total bets (descending)
    const sortedCreators = Object.entries(creatorStats)
      .map(([address, stats]) => ({ address, author: stats.author, totalBets: stats.totalBets, totalPool: stats.totalPool, pfpUrl: stats.pfpUrl }))
      .sort((a, b) => {
        if (b.totalPool !== a.totalPool) {
          return b.totalPool - a.totalPool; // Sort by total pool descending
        }
        return b.totalBets - a.totalBets; // Then sort by total bets descending
      });
      
    // Return the top N creators
    return sortedCreators.slice(0, limit);
  },

  // Get top voters by total vote amount staked
  async getTopVoters(limit: number = 20) {
    const votesRef = collection(db, VOTES_COLLECTION);
    const betsRef = collection(db, BETS_COLLECTION);
    
    // Fetch all votes
    const votesSnapshot = await getDocs(votesRef);
    
    // Fetch all bets to get stake amounts (could be optimized by fetching only relevant bets)
    const betsSnapshot = await getDocs(betsRef);
    const betsMap = new Map<string, Bet>();
    betsSnapshot.docs.forEach(doc => {
      betsMap.set(doc.id, doc.data() as Bet);
    });

    const voterStats: { [userId: string]: { 
      totalVoteAmount: number; 
      userId: string;
      username?: string;
      pfpUrl?: string;
      latestTimestamp: number;
    }} = {};

    votesSnapshot.docs.forEach(doc => {
      const vote = doc.data() as { 
        betId: string; 
        userId: string; 
        voteType: string; 
        timestamp: number;
        username?: string;
        pfpUrl?: string;
      };
      const bet = betsMap.get(vote.betId);

      if (bet && bet.betAmount !== undefined) {
        if (!voterStats[vote.userId]) {
          voterStats[vote.userId] = {
            userId: vote.userId,
            totalVoteAmount: 0,
            username: vote.username,
            pfpUrl: vote.pfpUrl,
            latestTimestamp: vote.timestamp
          };
        } else {
          // Update username and pfpUrl if this vote is more recent
          if (vote.timestamp > voterStats[vote.userId].latestTimestamp) {
            voterStats[vote.userId].username = vote.username;
            voterStats[vote.userId].pfpUrl = vote.pfpUrl;
            voterStats[vote.userId].latestTimestamp = vote.timestamp;
          }
        }
        voterStats[vote.userId].totalVoteAmount += bet.betAmount;
      }
    });

    // Convert to array and sort by total vote amount descending
    const sortedVoters = Object.entries(voterStats)
      .map(([userId, stats]) => ({ 
        userId, 
        totalVoteAmount: stats.totalVoteAmount,
        username: stats.username,
        pfpUrl: stats.pfpUrl
      }))
      .sort((a, b) => b.totalVoteAmount - a.totalVoteAmount);
    
    return sortedVoters.slice(0, limit);
  }
};