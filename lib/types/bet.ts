export type Category = 'Crypto' | 'Stocks' | 'General';

export type VoteType = 'yay' | 'nay';

export interface Bet {
  id: string;
  author: string;
  content: string;
  category: Category;
  stakeAmount: number;
  betAmount: number;
  timeLeft: string;
  expiryTime: number;
  timestamp: number;
  status: 'ACTIVE' | 'RESOLVED';
  yay: number;
  nay: number;
  userVote?: VoteType;
  comments?: Comment[];
  commentCount: number;
  pfpUrl?: string;
  betType: 'voting' | 'verified';
  // Fields for verified bets
  predictionType?: 'pump' | 'dump';
  priceThreshold?: number;
  startPrice?: number;
  currentPrice?: number;
  asset?: string;
}

export interface Comment {
  id?: string;
  author: string;
  content: string;
  timestamp?: number;
  pfpUrl?: string;
}

export interface TickerItem {
  symbol: string;
  price: number;
} 