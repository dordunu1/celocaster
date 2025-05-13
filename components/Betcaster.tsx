'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Award, MessageSquare, ThumbsUp, ThumbsDown, ChevronUp, ChevronDown, Edit3, TrendingUp, Activity, Globe, X, Moon, Sun, Info } from 'lucide-react';
import { useMiniAppContext } from '../hooks/use-miniapp-context';
import { marketService } from '../lib/services/marketService';
import { betService } from '../lib/services/betService';
import { db } from '../lib/firebase/config';
import { collection, query, where, onSnapshot, getDocs, orderBy } from 'firebase/firestore';
import TickerItem from './TickerItem';
import { Category, Bet, Comment, VoteType } from '../lib/types/bet';
import { useAssetPrice } from '../hooks/useAssetPrice';
import Image from 'next/image';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { farcasterFrame } from '@farcaster/frame-wagmi-connector';
import { monadTestnet } from 'wagmi/chains';
import dynamic from 'next/dynamic';
import BetPriceTracker from './BetPriceTracker';
import { parseEther } from 'viem';
import BetVoting from './BetVoting';

// Import ABI directly
const betcasterABI = [
  {
    "inputs": [
      { "name": "betId", "type": "string" },
      { "name": "voteStake", "type": "uint256" },
      { "name": "duration", "type": "uint256" },
      { "name": "isVerified", "type": "bool" },
      { "name": "asset", "type": "string" },
      { "name": "priceThreshold", "type": "uint256" },
      { "name": "isPump", "type": "bool" }
    ],
    "name": "createBet",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
] as const;

// Add contract address from app/page.tsx
const BETCASTER_ADDRESS = '0x8AEA4985c1739d21968659bE091A2c7be6eA48a7' as `0x${string}`;

// Add contract constants
const MIN_VOTE_STAKE = 0.1; // 0.1 MON

interface TickerItem {
  symbol: string;
  price: number;
}

interface CategoryOption {
  id: number;
  name: Category;
  icon: React.ReactNode;
}

const mockCategories: CategoryOption[] = [
  { id: 1, name: 'Crypto', icon: <TrendingUp size={16} /> },
  { id: 3, name: 'General', icon: <Globe size={16} /> }
];

const SUPPORTED_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '/images/btc.svg' },
  { symbol: 'ETH', name: 'Ethereum', icon: '/images/eth.svg' }
];

function CountdownTimer({ expiryTime, darkMode, status }: { expiryTime: number, darkMode: boolean, status?: string }) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  const calculateTimeLeft = useCallback(() => {
    const now = Date.now();
    const diff = expiryTime - now;

    if (diff <= 0) {
      setIsExpired(true);
      return "Expired";
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }, [expiryTime]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  return (
    <div className={`flex items-center ${isExpired ? 'text-red-500' : darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
      <Clock size={12} className="mr-1" />
      <span className="text-xs">
        {status === 'RESOLVED' ? 'Resolved' : isExpired ? 'Expired' : timeLeft + ' left'}
      </span>
    </div>
  );
}

interface BetcasterProps {
  betcasterAddress: `0x${string}`;
}

// Create a client-side only bottom navigation component
const BottomNav = dynamic(() => Promise.resolve(({ 
  isConnected, 
  address, 
  chainId, 
  darkMode, 
  handleWalletConnection 
}: { 
  isConnected: boolean;
  address?: string;
  chainId?: number;
  darkMode: boolean;
  handleWalletConnection: () => void;
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t shadow-lg`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-2">
          {/* Feed */}
          <button className={`flex flex-col items-center p-2 ${darkMode ? 'text-gray-300 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'}`}>
            <Award className="h-6 w-6" />
            <span className="text-xs mt-1">Feed</span>
          </button>

          {/* My Bets */}
          <button className={`flex flex-col items-center p-2 ${darkMode ? 'text-gray-300 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'}`}>
            <TrendingUp className="h-6 w-6" />
            <span className="text-xs mt-1">My Bets</span>
          </button>

          {/* Leaderboard */}
          <button className={`flex flex-col items-center p-2 ${darkMode ? 'text-gray-300 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'}`}>
            <Activity className="h-6 w-6" />
            <span className="text-xs mt-1">Leaders</span>
          </button>

          {/* Wallet Connection */}
          <button 
            onClick={handleWalletConnection}
            className={`flex flex-col items-center p-2 relative ${
              isConnected
                ? darkMode 
                  ? 'text-purple-400 hover:text-purple-300' 
                  : 'text-purple-600 hover:text-purple-700'
                : darkMode 
                  ? 'text-gray-300 hover:text-purple-400' 
                  : 'text-gray-600 hover:text-purple-600'
            }`}
          >
            <div className="relative">
              <Globe className="h-6 w-6" />
              {isConnected && (
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                  chainId === monadTestnet.id
                    ? 'bg-green-500'
                    : 'bg-yellow-500'
                }`} />
              )}
            </div>
            {isConnected ? (
              <div className="flex flex-col items-center">
                <span className="text-xs mt-1 font-mono">
                  {address?.slice(0, 4)}...{address?.slice(-4)}
                </span>
                <span className="text-[10px] mt-0.5">
                  {chainId === monadTestnet.id ? 'Monad' : 'Wrong Chain'}
                </span>
              </div>
            ) : (
              <span className="text-xs mt-1">Connect</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}), { ssr: false });

// Create a client-side only chain switch modal component
const ChainSwitchModal = dynamic(() => Promise.resolve(({
  darkMode,
  chainId,
  onClose,
  onSwitch
}: {
  darkMode: boolean;
  chainId?: number;
  onClose: () => void;
  onSwitch: () => void;
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl p-6 m-4 max-w-sm w-full`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            Switch Network
          </h3>
          <button 
            onClick={onClose}
            className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'}`}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6">
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            Please switch to Monad Testnet to use BetCaster
          </p>
          <div className={`flex items-center p-3 rounded-lg mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className="flex-1">
              <div className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Current Network
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {chainId === 8453 ? 'Base Mainnet' : 'Unknown Network'}
              </div>
            </div>
          </div>
          <div className={`flex items-center p-3 rounded-lg ${darkMode ? 'bg-purple-900/50' : 'bg-purple-50'}`}>
            <div className="flex-1">
              <div className={`font-medium ${darkMode ? 'text-purple-100' : 'text-purple-900'}`}>
                Required Network
              </div>
              <div className={`text-sm ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                Monad Testnet
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onSwitch}
          className={`w-full py-2 px-4 rounded-lg font-medium ${
            darkMode 
              ? 'bg-purple-600 hover:bg-purple-500 text-white' 
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          Switch to Monad Testnet
        </button>
      </div>
    </div>
  );
}), { ssr: false });

interface PredictionSectionProps {
  bet: {
    asset: string;
    startPrice: number;
    timestamp: number;
    predictionType: 'pump' | 'dump';
    priceThreshold: number;
    betAmount: number;
  yay: number;
  nay: number;
    expiryTime: number;
  };
  darkMode: boolean;
}

// Create a stable prediction section component
const PredictionSection = React.memo(({ bet, darkMode }: PredictionSectionProps) => {
  return (
    <div className="flex items-center justify-between min-h-[48px] transition-all duration-300 ease-in-out">
      <div className="min-w-[200px] flex justify-end">
        <BetPriceTracker
          asset={bet.asset}
          startPrice={bet.startPrice}
          startTime={bet.timestamp}
          isPump={bet.predictionType === 'pump'}
          priceThreshold={bet.priceThreshold}
          darkMode={darkMode}
        />
      </div>
    </div>
  );
});

PredictionSection.displayName = 'PredictionSection';

interface BetInfoProps {
  bet: Bet;
  darkMode: boolean;
  betcasterAddress: `0x${string}`;
  onVoteSuccess: () => void;
}

// Update the BetInfo component
const BetInfo = ({ bet, darkMode, betcasterAddress, onVoteSuccess }: BetInfoProps) => {
  // Type guard function to check if bet has all required properties for PredictionSection
  const isVerifiedBetWithPrice = (bet: Bet): bet is Bet & {
    asset: string;
    startPrice: number;
    timestamp: number;
    predictionType: 'pump' | 'dump';
    priceThreshold: number;
    betAmount: number;
    yay: number;
    nay: number;
    expiryTime: number;
  } => {
    return bet.betType === 'verified' 
      && typeof bet.asset === 'string'
      && typeof bet.startPrice === 'number'
      && typeof bet.timestamp === 'number'
      && (bet.predictionType === 'pump' || bet.predictionType === 'dump')
      && typeof bet.priceThreshold === 'number'
      && typeof bet.betAmount === 'number'
      && typeof bet.yay === 'number'
      && typeof bet.nay === 'number'
      && typeof bet.expiryTime === 'number';
  };

  if (isVerifiedBetWithPrice(bet)) {
    return (
      <div className={`px-4 py-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-t transition-colors duration-200`}>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center text-sm">
            <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-200`}>
              <span className="font-medium">{bet.betAmount} MON to vote</span>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                Chainlink Verified
              </span>
            </div>
          </div>
          
          <PredictionSection bet={bet} darkMode={darkMode} />
        </div>
      </div>
    );
  }

  return (
    <div className={`px-4 py-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-t transition-colors duration-200`}>
      <div className="flex items-center text-sm">
        <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-200`}>
          <span className="font-medium">{bet.betAmount} MON to vote</span>
          <span className="text-xs ml-1">• Community vote</span>
        </div>
      </div>
    </div>
  );
};

// Add a tooltip component for reusability
const Tooltip = ({ content, children, darkMode }: { content: string, children: React.ReactNode, darkMode: boolean }) => {
  return (
    <div className="relative group">
      {children}
      <div className={`absolute z-50 invisible group-hover:visible text-sm rounded-lg py-2 px-3 right-0 mt-2 min-w-[280px] max-w-[320px] shadow-xl
        ${darkMode ? 'bg-black/90 text-white' : 'bg-white text-gray-900 border border-gray-200'}`}
      >
        <div className={`absolute -top-2 right-3 w-4 h-4 transform rotate-45
          ${darkMode ? 'bg-black/90' : 'bg-white border-l border-t border-gray-200'}`}></div>
        {content}
      </div>
    </div>
  );
};

export default function BetCaster({ betcasterAddress }: BetcasterProps) {
  const { context, isEthProviderAvailable } = useMiniAppContext();
  const { isConnected, address, chainId } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [bets, setBets] = useState<Bet[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [tickerPosition, setTickerPosition] = useState(0);
  const [tickerData, setTickerData] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [isCreatingBet, setIsCreatingBet] = useState(false);
  const [showChainSwitchModal, setShowChainSwitchModal] = useState(false);
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [connectionAttempted, setConnectionAttempted] = useState(false);
  
  // Form state for create bet modal
  const [newBetContent, setNewBetContent] = useState('');
  const [newBetCategory, setNewBetCategory] = useState('Crypto');
  const [newBetDuration, setNewBetDuration] = useState('24h');
  const [commentText, setCommentText] = useState('');
  const [newBetVoteAmount, setNewBetVoteAmount] = useState<number>(0.1);
  const [selectedAsset, setSelectedAsset] = useState('');

  // Add new state for bet type
  const [betType, setBetType] = useState<'voting' | 'verified'>('voting');
  const [predictionType, setPredictionType] = useState<'pump' | 'dump'>('pump');
  const [priceThreshold, setPriceThreshold] = useState<number>(5); // 5% default

  // Price feed state
  const { price, isLoading: isPriceLoading, error: chainlinkError } = useAssetPrice(
    selectedAsset,
    5000 // Update every 5 seconds
  );

  // Add contract write hook with proper error handling
  const { writeContract, data: createBetData, isError: isWriteError, error: writeError } = useWriteContract();

  // Add transaction receipt hook
  const { isLoading: isTransactionPending, isSuccess: isTransactionSuccess } = useWaitForTransactionReceipt({
    hash: createBetData,
  });

  // Watch for transaction success with error handling
  useEffect(() => {
    if (isTransactionSuccess) {
      console.log('Transaction successful:', createBetData);
      handleTransactionSuccess();
    } else if (isWriteError) {
      console.error('Write error:', writeError);
      setIsCreatingBet(false);
      alert('Failed to create bet: ' + (writeError instanceof Error ? writeError.message : 'Unknown error'));
    }
  }, [isTransactionSuccess, isWriteError, writeError]);

  // Load bets function for manual refreshes
  const loadBets = useCallback(async () => {
    try {
      setLoading(true);
      const updatedBets = await betService.getBets(context?.user?.fid?.toString());
      setBets(updatedBets);
    } catch (err) {
      console.error('Failed to load bets:', err);
    } finally {
      setLoading(false);
    }
  }, [context?.user?.fid]);

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
          if (context?.user?.fid) {
            const voteQuery = query(
              collection(db, 'votes'),
              where('betId', '==', bet.id),
              where('userId', '==', context.user.fid.toString())
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
  }, [context?.user?.fid]);

  // Add new state for pending betId
  const [pendingBetId, setPendingBetId] = useState<string | null>(null);

  // Load bets function for manual refreshes
  const handleTransactionSuccess = async () => {
    try {
      const durationHours = parseInt(newBetDuration);
      const baseBetData = {
        author: context?.user?.username || 'anonymous',
        category: newBetCategory as Category,
        content: newBetContent.trim(),
        stakeAmount: 2,
        betAmount: newBetVoteAmount,
        timeLeft: newBetDuration,
        expiryTime: Date.now() + (durationHours * 60 * 60 * 1000),
        timestamp: Date.now(),
        status: 'ACTIVE' as const,
        pfpUrl: context?.user?.pfpUrl,
        betType: betType
      };

      if (!pendingBetId) {
        throw new Error('No pending betId found');
      }

      // Add additional fields for verified bets
      const newBet = betType === 'verified' && selectedAsset
        ? {
            ...baseBetData,
            predictionType,
            priceThreshold,
            startPrice: price ? parseFloat(price.replace('$', '')) : 0,
            currentPrice: price ? parseFloat(price.replace('$', '')) : 0,
            asset: selectedAsset,
            id: pendingBetId
          }
        : {
            ...baseBetData,
            id: pendingBetId
          };
      
      await betService.createBet(newBet);
      setIsCreateModalOpen(false);
      setNewBetContent('');
      setBetType('voting');
      setPredictionType('pump');
      setPriceThreshold(5);
      setPendingBetId(null);
    } catch (err) {
      console.error('Failed to create bet in Firebase:', err);
    } finally {
      setIsCreatingBet(false);
    }
  };

  // Fetch market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const crypto = await marketService.getCryptoPrices();
        setTickerData(crypto);
      } catch (err) {
        console.error('Failed to fetch market data:', err);
      }
    };

    // Initial fetch
    fetchMarketData();

    // Refresh every minute
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // Animate ticker
  useEffect(() => {
    const tickerInterval = setInterval(() => {
      setTickerPosition((prev: number) => (prev - 1) % -1000); // Loop the ticker
    }, 30);
    
    return () => clearInterval(tickerInterval);
  }, []);

  // Check user's preferred color scheme on initial load
  useEffect(() => {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, []);
  
  const [expandedComments, setExpandedComments] = useState<{ [betId: string]: any[] }>({});

  // Fetch comments for a bet when expanded (real-time)
  const listenToCommentsForBet = useCallback((betId: string) => {
    const commentsQuery = query(
      collection(db, 'comments'),
      where('betId', '==', String(betId)),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(commentsQuery, (commentsSnapshot) => {
      const comments = commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpandedComments(prev => ({ ...prev, [betId]: comments }));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (expandedPostId) {
      const unsubscribe = listenToCommentsForBet(expandedPostId);
      return () => unsubscribe();
    }
  }, [expandedPostId, listenToCommentsForBet]);

  const togglePostExpand = (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
    } else {
      setExpandedPostId(postId);
      // No need to manually fetch, real-time listener will handle
    }
  };
  
  // Filter bets by category
  const filteredBets = selectedCategory === 'all' 
    ? bets 
    : bets.filter(bet => bet.category.toLowerCase() === selectedCategory.toLowerCase());

  // Update comment handling to show loading state
  const handleAddComment = async (betId: string) => {
    if (!commentText.trim()) return;
    if (!context?.user?.fid) {
      alert('Please log in to comment');
      return;
    }
    
    setIsPosting(true);
    try {
      const comment: Omit<Comment, 'id' | 'timestamp'> & { betId: string } = {
        betId,
        author: context.user.username || 'anonymous',
        content: commentText.trim(),
        pfpUrl: context.user.pfpUrl
      };
      
      await betService.addComment(comment);
      setCommentText('');
      
      // Refresh bets to show new comment
      const updatedBets = await betService.getBets(context.user.fid.toString());
      setBets(updatedBets);
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsPosting(false);
    }
  };
  
  // Update bet creation to show loading state
  const handleCreateBet = async () => {
    if (!context?.user?.fid) {
      alert('Please log in to create a bet');
      return;
    }

    if (!newBetContent.trim()) return;
    
    if (!betcasterAddress) {
      console.error('Contract address is undefined');
      alert('Contract address is not configured');
      return;
    }

    setIsCreatingBet(true);
    try {
      const durationHours = parseInt(newBetDuration);
      const durationSeconds = durationHours * 60 * 60;
      const betId = `${context.user.fid}-${Date.now()}`; // Unique bet ID
      setPendingBetId(betId);

      const params = {
        address: betcasterAddress as `0x${string}`,
        abi: betcasterABI,
        functionName: 'createBet',
        value: parseEther('2'), // 2 MON platform stake
        args: [
          betId,
          parseEther(newBetVoteAmount.toString()), // voteStake
          BigInt(durationSeconds), // duration in seconds
          betType === 'verified', // isVerified
          selectedAsset || '', // asset (empty string for non-verified bets)
          BigInt(priceThreshold), // priceThreshold
          predictionType === 'pump' // isPump
        ]
      } as const;

      console.log('Creating bet on-chain with betId:', betId);
      console.log('createBet contract args:', params.args);
      console.log('createBet contract params:', params);

      // Call contract function
      const hash = await writeContract(params);
      console.log('Transaction hash:', hash);

    } catch (err) {
      console.error('Failed to create bet:', err);
      alert('Failed to create bet: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setIsCreatingBet(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleNewBetVoteAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      if (value < MIN_VOTE_STAKE) {
        alert(`Vote stake must be at least ${MIN_VOTE_STAKE} MON`);
        setNewBetVoteAmount(MIN_VOTE_STAKE);
      } else {
        setNewBetVoteAmount(value);
      }
    }
  };

  // Auto-connect to Monad
  useEffect(() => {
    if (!mounted || connectionAttempted) return;

    const autoConnect = async () => {
      if (isAutoConnecting) return;
      
      try {
        setIsAutoConnecting(true);
        setConnectionAttempted(true);
        
        // If not connected, connect first
        if (!isConnected && isEthProviderAvailable) {
          console.log('Attempting to connect wallet...');
          await connect({ connector: farcasterFrame() });
          // Wait a bit for connection to establish
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Always try to switch to Monad if we're not on it
        if (chainId !== monadTestnet.id) {
          console.log('Switching to Monad...');
          await switchChain({ chainId: monadTestnet.id });
        }
      } catch (err) {
        console.error('Auto-connection error:', err);
        // If auto-connection fails, show the manual switch modal
        if (isConnected && chainId !== monadTestnet.id) {
          setShowChainSwitchModal(true);
        }
      } finally {
        setIsAutoConnecting(false);
      }
    };

    autoConnect();
  }, [mounted, isConnected, chainId, connect, switchChain, isEthProviderAvailable, isAutoConnecting, connectionAttempted]);

  // Reset connection attempt when chain changes
  useEffect(() => {
    if (chainId === monadTestnet.id) {
      setConnectionAttempted(false);
    }
  }, [chainId]);

  // Function to handle wallet connection
  const handleWalletConnection = async () => {
    try {
      if (!isConnected) {
        await connect({ connector: farcasterFrame() });
        // Wait a bit for connection to establish
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Always try to switch to Monad
      if (chainId !== monadTestnet.id) {
        await switchChain({ chainId: monadTestnet.id });
      }
    } catch (err) {
      console.error('Connection error:', err);
      if (isConnected && chainId !== monadTestnet.id) {
        setShowChainSwitchModal(true);
      }
    }
  };

  // Function to handle chain switch
  const handleChainSwitch = async () => {
    try {
      await switchChain({ chainId: monadTestnet.id });
      setShowChainSwitchModal(false);
    } catch (err) {
      console.error('Chain switch error:', err);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // In the BetCaster component, add state to track how many comments to show per bet
  const [commentsShown, setCommentsShown] = useState<{ [betId: string]: number }>({});

  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'} transition-colors duration-200`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 ${darkMode ? 'bg-purple-900' : 'bg-purple-700'} text-white shadow-md transition-colors duration-200`}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="h-6 w-6" />
            <h1 className="text-xl font-bold">BetCaster</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={toggleDarkMode}
              className={`rounded-full p-2 ${darkMode ? 'bg-purple-800 hover:bg-purple-700' : 'bg-purple-600 hover:bg-purple-800'} transition-colors`}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button 
              className={`${darkMode ? 'bg-purple-800 hover:bg-purple-700' : 'bg-purple-600 hover:bg-purple-800'} text-white px-4 py-2 rounded-md flex items-center transition-colors`}
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Create Bet
            </button>
          </div>
        </div>
      </header>

      {/* Ticker */}
      <div className={`overflow-hidden ${darkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-gray-800 border-gray-200'} border-b py-2 transition-colors duration-200`}>
        <div 
          className="whitespace-nowrap inline-block transition-transform" 
          style={{ transform: `translateX(${tickerPosition}px)` }}
        >
          {tickerData.length > 0 ? (
            Array(3).fill(tickerData).flat().map((item, index) => (
              <TickerItem
              key={`${item.symbol}-${index}`} 
                symbol={item.symbol}
                price={item.price}
                darkMode={darkMode}
              />
            ))
          ) : (
            <span className={`inline-flex items-center mx-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading market data...
              </span>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all' 
                ? darkMode ? 'bg-purple-800 text-white' : 'bg-purple-700 text-white' 
                : darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </button>
          
          {mockCategories.map(category => (
            <button
              key={category.id}
              className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition-colors ${
                selectedCategory === category.name.toLowerCase()
                  ? darkMode ? 'bg-purple-800 text-white' : 'bg-purple-700 text-white' 
                  : darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
              onClick={() => setSelectedCategory(category.name.toLowerCase())}
            >
              <span className="mr-1">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <main className="container mx-auto px-4 py-4 flex-1">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBets.map(bet => (
              <div key={bet.id} className={`border-2 ${darkMode ? 'border-purple-900' : 'border-purple-700'} ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'} rounded-lg shadow-md overflow-hidden transition-colors duration-200`}>
                {/* Post Header */}
                <div className={`px-4 py-3 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-b flex items-center justify-between transition-colors duration-200`}>
                  <div className="flex items-center space-x-2">
                    {bet.pfpUrl ? (
                      <img 
                        src={bet.pfpUrl} 
                        alt={bet.author}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`h-8 w-8 rounded-full ${darkMode ? 'bg-purple-300 text-purple-900' : 'bg-purple-200 text-purple-700'} flex items-center justify-center font-bold transition-colors duration-200`}>
                        {bet.author.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'} transition-colors duration-200`}>{bet.author}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <span className={`px-2 py-0.5 ${darkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'} rounded-full flex items-center transition-colors duration-200`}>
                          {bet.category === 'Crypto' && <TrendingUp size={12} className="mr-1" />}
                          {bet.category === 'General' && <Globe size={12} className="mr-1" />}
                          {bet.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col items-end min-w-[80px]">
                      <div className={`text-xs ${darkMode ? 'text-purple-200' : 'text-purple-700'} font-medium`}>
                        {((bet.yay + bet.nay) * bet.betAmount).toFixed(1)} MON in pool
                      </div>
                      {bet.status === "RESOLVED" && (
                        <span className={`mt-1 px-2 py-0.5 rounded text-[10px] font-semibold ${darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>RESOLVED</span>
                      )}
                      {bet.status !== "RESOLVED" && (
                        <CountdownTimer expiryTime={bet.expiryTime} darkMode={darkMode} status={bet.status} />
                      )}
                    </div>
                    <Tooltip content={
                      bet.betType === 'verified' 
                        ? `This is a Chainlink-verified price prediction bet. To participate, stake ${bet.betAmount} MON on either Yay or Nay. If the price ${bet.predictionType === 'pump' ? 'increases' : 'decreases'} by ${bet.priceThreshold}% or more, Yay voters win. Otherwise, Nay voters win. Winners split the total pool proportionally to their stake.`
                        : `This is a community-voted prediction. Stake ${bet.betAmount} MON to vote Yay or Nay. When the bet expires, the side with more votes wins and splits the total pool proportionally to their stake.`
                    } darkMode={darkMode}>
                      <Info size={16} className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'} cursor-help transition-colors duration-200`} />
                    </Tooltip>
                  </div>
                </div>
                {/* Post Content */}
                <div className="px-4 py-3 flex items-center">
                  <p className={`${darkMode ? 'text-gray-100' : 'text-gray-800'} text-lg font-medium transition-colors duration-200 mr-2`}>{bet.content}</p>
                  {bet.betType === 'verified' && bet.predictionType && typeof bet.priceThreshold === 'number' && (
                    <span className={
                      `ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ` +
                      (bet.predictionType === 'pump'
                        ? (darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700')
                        : (darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700'))
                    }>
                      {bet.predictionType === 'pump' ? '+' : '-'}{bet.priceThreshold}%
                    </span>
                  )}
                </div>
                {/* Vote Section */}
                <div className={`px-4 py-3 flex items-center justify-between border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} transition-colors duration-200`}>
                  <div className="flex items-center space-x-4">
                    <BetVoting
                      betId={bet.id}
                      voteStake={bet.betAmount}
                      betcasterAddress={betcasterAddress}
                      onVoteSuccess={loadBets}
                      userVote={bet.userVote}
                      yayCount={bet.yay}
                      nayCount={bet.nay}
                    />
                  </div>
                  {/* Comments button */}
                  <button 
                    className={`flex items-center space-x-1 ${darkMode ? 'text-gray-400 hover:text-purple-400' : 'text-gray-500 hover:text-purple-600'} transition-colors duration-200`}
                    onClick={() => togglePostExpand(bet.id)}
                  >
                    <MessageSquare size={18} />
                    <span className="text-sm">{bet.commentCount}</span>
                  </button>
                </div>
                {/* Bet Info */}
                <BetInfo 
                  bet={bet} 
                  darkMode={darkMode} 
                  betcasterAddress={BETCASTER_ADDRESS}
                  onVoteSuccess={loadBets}
                />
                {/* Expanded Comments Section */}
                {expandedPostId === bet.id && (
                  <div className={`px-4 py-3 border-t ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'} transition-colors duration-200`}>
                    <div className="flex items-center space-x-2 mb-3">
                      {context?.user?.pfpUrl ? (
                        <img 
                          src={context.user.pfpUrl} 
                          alt={context.user.username || 'User'}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`h-8 w-8 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} transition-colors duration-200`}></div>
                      )}
                      <div className="flex-1 flex">
                        <input 
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Add a comment..."
                          className={`flex-1 border ${darkMode ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-700'} rounded-l-full px-4 py-2 text-sm focus:outline-none transition-colors duration-200`}
                        />
                        <button 
                          onClick={() => handleAddComment(bet.id)}
                          disabled={isPosting}
                          className={`$${
                            darkMode 
                              ? isPosting ? 'bg-purple-800' : 'bg-purple-700 hover:bg-purple-600' 
                              : isPosting ? 'bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'
                          } text-white px-6 py-2 rounded-r-full text-sm transition-colors duration-200 disabled:opacity-50 min-w-[80px] flex items-center justify-center`}
                          style={{ backgroundColor: darkMode ? '#7c3aed' : '#6d28d9', color: '#fff', opacity: isPosting ? 0.5 : 1 }}
                        >
                          {isPosting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          ) : 'Post'}
                        </button>
                      </div>
                    </div>
                    {/* Display paginated comments in a scrollable container */}
                    <div className="space-y-3 max-h-[260px] overflow-y-auto">
                      {(expandedComments[bet.id] && expandedComments[bet.id].length > 0) ? (
                        <>
                          {expandedComments[bet.id].slice(0, commentsShown[bet.id] || 3).map((comment, index) => (
                            <div key={comment.id || index} className="flex space-x-2">
                              {comment.pfpUrl ? (
                                <img 
                                  src={comment.pfpUrl} 
                                  alt={comment.author}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className={`h-8 w-8 rounded-full ${darkMode ? 'bg-purple-300 text-purple-900' : 'bg-purple-200 text-purple-700'} flex items-center justify-center font-bold transition-colors duration-200`}>
                                  {comment.author.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className={`flex-1 ${darkMode ? 'bg-gray-800' : 'bg-white'} p-2 rounded-lg shadow-sm transition-colors duration-200`}>
                                  <p className={`font-medium text-sm ${darkMode ? 'text-gray-100' : 'text-gray-800'} transition-colors duration-200`}>{comment.author}</p>
                                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm transition-colors duration-200`}>{comment.content}</p>
                              </div>
                            </div>
                          ))}
                          {expandedComments[bet.id].length > (commentsShown[bet.id] || 3) && (
                            <button
                              className={`mt-2 px-4 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-purple-900 text-purple-200 hover:bg-purple-800' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'} transition-colors`}
                              onClick={() => setCommentsShown(prev => ({ ...prev, [bet.id]: (prev[bet.id] || 3) + 3 }))}
                            >
                              Show more comments
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="text-gray-400 text-sm">No comments yet.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Client-side only components */}
      {mounted && (
        <>
          <BottomNav 
            isConnected={isConnected}
            address={address}
            chainId={chainId}
            darkMode={darkMode}
            handleWalletConnection={handleWalletConnection}
          />

          {showChainSwitchModal && (
            <ChainSwitchModal
              darkMode={darkMode}
              chainId={chainId}
              onClose={() => setShowChainSwitchModal(false)}
              onSwitch={handleChainSwitch}
            />
          )}
        </>
      )}

      {/* Add padding at the bottom to account for navigation bar */}
      <div className="pb-20" />

      {/* Create Bet Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'} rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]`}>
            {/* Modal Header - Fixed */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Create New Bet</h2>
              <button 
                className={`${darkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-500 hover:text-gray-700'} transition-colors duration-200`}
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X size={20} />
              </button>
              </div>
            </div>
            
            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {/* Category Selection */}
              <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {mockCategories.map(category => (
                    <button
                      key={category.id}
                      type="button"
                      className={`px-4 py-2 border rounded-md text-sm flex items-center justify-center transition-colors duration-200 ${
                        newBetCategory === category.name
                          ? darkMode ? 'border-purple-500 bg-purple-900 text-purple-300' : 'border-purple-500 bg-purple-50 text-purple-700'
                          : darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                      onClick={() => setNewBetCategory(category.name)}
                    >
                      <span className="mr-1">{category.icon}</span>
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Bet Content */}
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 transition-colors duration-200`}>What's your prediction?</label>
                <textarea
                  className={`w-full px-3 py-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-700'} transition-colors duration-200`}
                  rows={3}
                  value={newBetContent}
                  onChange={(e) => setNewBetContent(e.target.value)}
                  placeholder="Share your prediction..."
                ></textarea>
              </div>
              
                {/* Fixed Platform Stake Display */}
              <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 transition-colors duration-200`}>Platform Stake</label>
                  <div className={`w-full px-3 py-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-700'} transition-colors duration-200`}>
                    2 MON (Fixed)
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1 transition-colors duration-200`}>
                    Required platform stake to create a bet. This ensures quality predictions.
                  </p>
              </div>
              
                {/* Vote Stake Amount Input */}
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 transition-colors duration-200`}>Vote Stake Amount (MON)</label>
                  <input
                    type="number"
                    className={`w-full px-3 py-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-700'} transition-colors duration-200`}
                    value={newBetVoteAmount}
                    onChange={handleNewBetVoteAmountChange}
                    min={MIN_VOTE_STAKE}
                    step="0.1"
                  />
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1 transition-colors duration-200`}>
                    Amount each voter must stake to participate (minimum {MIN_VOTE_STAKE} MON). Winners split the total pool.
                  </p>
                </div>
              
              {/* Duration */}
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 transition-colors duration-200`}>Duration</label>
                <select 
                  className={`w-full px-3 py-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-700'} transition-colors duration-200`}
                  value={newBetDuration}
                  onChange={(e) => setNewBetDuration(e.target.value)}
                >
                  <option value="1h">1 hour</option>
                  <option value="4h">4 hours</option>
                  <option value="12h">12 hours</option>
                  <option value="24h">24 hours</option>
                  <option value="48h">48 hours</option>
                  <option value="72h">72 hours</option>
                </select>
              </div>
              
                {/* Bet Type Selection */}
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 transition-colors duration-200`}>Bet Type</label>
                  <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                      className={`px-4 py-2 border rounded-md text-sm flex items-center justify-center transition-colors duration-200 ${
                        betType === 'voting'
                          ? darkMode ? 'border-purple-500 bg-purple-900 text-purple-300' : 'border-purple-500 bg-purple-50 text-purple-700'
                          : darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                      onClick={() => setBetType('voting')}
                    >
                      Community Vote
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 border rounded-md text-sm flex items-center justify-center transition-colors duration-200 ${
                        betType === 'verified'
                          ? darkMode ? 'border-purple-500 bg-purple-900 text-purple-300' : 'border-purple-500 bg-purple-50 text-purple-700'
                          : darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                      onClick={() => setBetType('verified')}
                    >
                      Price Verified
                </button>
              </div>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1 transition-colors duration-200`}>
                    {betType === 'voting' 
                      ? 'Winners determined by majority vote'
                      : 'Winners determined by actual price movement via Chainlink'
                    }
                  </p>
            </div>
                
                {/* Show additional options for verified bets */}
                {betType === 'verified' && (
                  <>
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Select Asset
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {SUPPORTED_ASSETS.map((asset) => (
                          <button
                            key={asset.symbol}
                            type="button"
                            onClick={() => setSelectedAsset(asset.symbol)}
                            className={`relative flex flex-col items-center p-4 rounded-lg border transition-all duration-200 ${
                              selectedAsset === asset.symbol
                                ? darkMode
                                  ? 'border-purple-500 bg-purple-900/50 shadow-lg shadow-purple-500/20'
                                  : 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-500/20'
                                : darkMode
                                  ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                                  : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="relative w-8 h-8 mb-2">
                              <Image
                                src={asset.icon}
                                alt={asset.name}
                                fill
                                className="object-contain"
                              />
          </div>
                            <span className={`text-sm font-medium ${
                              selectedAsset === asset.symbol
                                ? darkMode ? 'text-purple-300' : 'text-purple-700'
                                : darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {asset.symbol}
                            </span>
                            <span className={`text-xs ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {asset.name}
                            </span>
                            {selectedAsset === asset.symbol && (
                              <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${
                                darkMode ? 'bg-purple-500' : 'bg-purple-600'
                              } flex items-center justify-center`}>
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>

                      {selectedAsset && (
                        <div className={`mt-4 p-4 rounded-lg ${
                          darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="relative w-6 h-6">
                                <Image
                                  src={SUPPORTED_ASSETS.find(a => a.symbol === selectedAsset)?.icon || ''}
                                  alt={selectedAsset}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                              <span className={`font-medium ${
                                darkMode ? 'text-gray-200' : 'text-gray-700'
                              }`}>
                                Current Price:
                              </span>
                            </div>
                            {isPriceLoading ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Loading...
                                </span>
                              </div>
                            ) : chainlinkError ? (
                              <span className="text-red-500 text-sm">{chainlinkError}</span>
                            ) : (
                              <span className={`font-mono font-medium ${
                                darkMode ? 'text-gray-200' : 'text-gray-800'
                              }`}>
                                {price}
                              </span>
                            )}
                          </div>
                          <p className={`mt-2 text-xs ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Price feed provided by Chainlink Oracle
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 transition-colors duration-200`}>Price Movement</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          className={`px-4 py-2 border rounded-md text-sm flex items-center justify-center transition-colors duration-200 ${
                            predictionType === 'pump'
                              ? darkMode ? 'border-green-500 bg-green-900 text-green-300' : 'border-green-500 bg-green-50 text-green-700'
                              : darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                          }`}
                          onClick={() => setPredictionType('pump')}
                        >
                          Will Pump
                        </button>
                <button
                  type="button"
                          className={`px-4 py-2 border rounded-md text-sm flex items-center justify-center transition-colors duration-200 ${
                            predictionType === 'dump'
                              ? darkMode ? 'border-red-500 bg-red-900 text-red-300' : 'border-red-500 bg-red-50 text-red-700'
                              : darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                          }`}
                          onClick={() => setPredictionType('dump')}
                >
                          Will Dump
                </button>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 transition-colors duration-200`}>Price Change Threshold</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min="1"
                          max="20"
                          value={priceThreshold}
                          onChange={(e) => setPriceThreshold(parseInt(e.target.value))}
                          className="flex-1"
                        />
                        <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{priceThreshold}%</span>
                      </div>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1 transition-colors duration-200`}>
                        Price must move by at least this percentage to be considered a pump/dump
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                disabled={isCreatingBet || isTransactionPending}
                className={`w-full ${
                  darkMode 
                    ? (isCreatingBet || isTransactionPending) ? 'bg-purple-800' : 'bg-purple-700 hover:bg-purple-600' 
                    : (isCreatingBet || isTransactionPending) ? 'bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'
                } text-white py-2 px-4 rounded-md font-medium transition-colors duration-200 disabled:opacity-50 flex items-center justify-center`}
                onClick={handleCreateBet}
              >
                {isCreatingBet ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Waiting for wallet...</span>
                  </div>
                ) : isTransactionPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Confirming transaction...</span>
                  </div>
                ) : isWriteError ? (
                  <div className="flex items-center space-x-2 text-red-300">
                    <span>Failed - Click to retry</span>
                  </div>
                ) : (
                  'Create Bet (2 MON stake)'
                )}
              </button>

              {/* betCreated state is not used in the current implementation */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 