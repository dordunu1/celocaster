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
  writeBatch
} from 'firebase/firestore';
import { Bet, Comment, VoteType } from '../types/bet';

const BETS_COLLECTION = 'bets';
const COMMENTS_COLLECTION = 'comments';
const VOTES_COLLECTION = 'votes';

export const betService = {
  // Create a new bet
  async createBet(bet: Omit<Bet, 'id' | 'comments' | 'yay' | 'nay' | 'userVote' | 'commentCount'>): Promise<string> {
    const docRef = await addDoc(collection(db, BETS_COLLECTION), {
      ...bet,
      yay: 0,
      nay: 0,
      commentCount: 0,
      timestamp: Date.now(),
      status: 'ACTIVE',
    });
    return docRef.id;
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
        bet.userVote = voteSnapshot.empty ? null : (voteSnapshot.docs[0].data().voteType as VoteType);
      }

      // Get comments for this bet
      const commentsQuery = query(
        collection(db, COMMENTS_COLLECTION),
        where('betId', '==', bet.id),
        orderBy('timestamp', 'desc')
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      bet.comments = commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      bets.push(bet);
    }
    
    return bets;
  },

  // Add a comment to a bet
  async addComment(comment: Omit<Comment, 'id' | 'timestamp'>): Promise<string> {
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
  async voteBet(betId: string, userId: string, voteType: VoteType): Promise<void> {
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
        timestamp: Date.now()
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
        batch.update(existingVote.ref, { voteType });
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
}; 