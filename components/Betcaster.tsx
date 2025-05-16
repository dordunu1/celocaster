'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Clock, Award, MessageSquare, ThumbsUp, ThumbsDown, ChevronUp, ChevronDown, Edit3, TrendingUp, Activity, Globe, X, Moon, Sun, Info, User, Share2, Flame } from 'lucide-react';
import { useMiniAppContext } from '../hooks/use-miniapp-context';
import sdk from '@farcaster/frame-sdk';
import { betService } from '../lib/services/betService';
import { db } from '../lib/firebase/config';
import { collection, query, where, onSnapshot, getDocs, orderBy } from 'firebase/firestore';
import TickerItem from './TickerItem';
import { Category, Bet, Comment, VoteType } from '../lib/types/bet';
import { useAssetPrice } from '../hooks/useAssetPrice';
import Image from 'next/image';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { farcasterFrame } from '@farcaster/frame-wagmi-connector';
import { monadTestnet } from 'wagmi/chains';
import dynamic from 'next/dynamic';
import BetPriceTracker from './BetPriceTracker';
import { parseEther } from 'viem';
import BetVoting from './BetVoting';
import { Abi } from 'viem';
import betcasterArtifact from '../artifacts/contracts/Betcaster.sol/Betcaster.json';
const betcasterABI = betcasterArtifact.abi as Abi;
import HotBetsRow from './HotBetsRow';
import CountdownTimer from './CountdownTimer';
import BottomNav from './BottomNav';
import ChainSwitchModal from './ChainSwitchModal';
import PredictionSection from './PredictionSection';
import BetInfo from './BetInfo';
import Tooltip from './Tooltip';
import WalletModal from './WalletModal';
import ReconnectWalletModal from './ReconnectWalletModal';
import CreateBetModal from './CreateBetModal';
import { useWallet } from '../hooks/useWallet';
import { useUIState } from '../hooks/useUIState';
import { useCreateBet } from '../hooks/useCreateBet';
import { useBets } from '../hooks/useBets';
import { useComments } from '../hooks/useComments';
import MyActivities from './MyActivities';
import { motion } from 'framer-motion';

// Add contract address from app/page.tsx
const BETCASTER_ADDRESS = process.env.NEXT_PUBLIC_BETCASTER_ADDRESS as `0x${string}`;

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

function BetSkeletonCard({ darkMode }: { darkMode: boolean }) {
  return (
    <motion.div
      className={`border-2 ${darkMode ? 'border-purple-900' : 'border-purple-700'} ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'} rounded-lg shadow-md overflow-hidden transition-colors duration-200 animate-pulse`}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
    >
      {/* Post Header */}
      <div className={`px-4 py-3 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-b flex items-center justify-between transition-colors duration-200`}>
        <div className="flex items-center space-x-2">
          <div className={`h-8 w-8 rounded-full ${darkMode ? 'bg-purple-300' : 'bg-purple-200'}`} />
          <div>
            <div className={`h-4 w-24 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} mb-1`} />
            <div className="flex items-center text-xs">
              <div className={`h-4 w-20 rounded-full ${darkMode ? 'bg-purple-900' : 'bg-purple-100'} mr-2`} />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end min-w-[80px]">
          <div className={`h-4 w-20 rounded-md ${darkMode ? 'bg-purple-200' : 'bg-purple-700'} mb-1`} />
          <div className={`h-4 w-12 rounded-md ${darkMode ? 'bg-green-900' : 'bg-green-100'}`} />
        </div>
      </div>
      {/* Post Content */}
      <div className="px-4 py-3 flex items-center relative">
        <div className={`h-6 w-3/4 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} mb-2`} />
      </div>
      {/* Vote Section */}
      <div className={`px-4 py-3 flex items-center justify-between border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} transition-colors duration-200`}>
        <div className="flex items-center space-x-4">
          <div className={`h-6 w-24 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        </div>
        <div className={`h-4 w-10 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      </div>
    </motion.div>
  );
}

export default function BetCaster({ betcasterAddress }: { betcasterAddress: `0x${string}` }) {
  const { context, actions, isEthProviderAvailable } = useMiniAppContext() as { context: any, actions: typeof sdk.actions | null, isEthProviderAvailable: boolean };
  const { isConnected, address, chainId } = useAccount();
  const { connect, connectors, error: connectError } = useConnect();
  const { switchChain, error: switchError } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const { data: balanceData } = useBalance({
    address: address,
  });

  // Use our custom hooks
  const { bets, loading, expandedComments, loadBets, listenToCommentsForBet, updateSingleBet } = useBets(context?.user?.fid?.toString());
  const { darkMode, setDarkMode } = useUIState();
  const { isPosting, commentText, setCommentText, handleAddComment } = useComments();
  const { handleWalletConnect: onWalletConnect, handleChainSwitch: onChainSwitch } = useWallet();

  // State management
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tickerPosition, setTickerPosition] = useState(0);
  const [tickerData, setTickerData] = useState<TickerItem[]>([]);
  const [showChainSwitchModal, setShowChainSwitchModal] = useState(false);
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [connectionAttempted, setConnectionAttempted] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const [walletState, setWalletState] = useState<'disconnected' | 'wrong_chain' | 'connected'>('disconnected');
  const [newBetContent, setNewBetContent] = useState('');
  const [newBetCategory, setNewBetCategory] = useState('Crypto');
  const [newBetDuration, setNewBetDuration] = useState('24');
  const [newBetVoteAmount, setNewBetVoteAmount] = useState<string>('0.1');
  const [selectedAsset, setSelectedAsset] = useState('');
  const [betType, setBetType] = useState<'voting' | 'verified'>('voting');
  const [predictionType, setPredictionType] = useState<'pump' | 'dump'>('pump');
  const [priceThreshold, setPriceThreshold] = useState<number>(5);
  const [pendingBetId, setPendingBetId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [authorSearch, setAuthorSearch] = useState('');
  const [commentsShown, setCommentsShown] = useState<{ [betId: string]: number }>({});
  const [showReconnectModal, setShowReconnectModal] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [isCreatingBet, setIsCreatingBet] = useState(false);
  const commentsUnsubscribeRef = useRef<(() => void) | null>(null);
  const [activePage, setActivePage] = useState<'feed' | 'activities'>('feed');
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Use the useCreateBet hook for bet creation
  const createBet = useCreateBet(betcasterAddress);

  // Rename the handlers to avoid conflicts
  const handleWalletConnect = () => {
    setIsWalletLoading(true);
    onWalletConnect().finally(() => setIsWalletLoading(false));
  };

  const handleChainSwitch = () => {
    setIsWalletLoading(true);
    onChainSwitch().finally(() => setIsWalletLoading(false));
  };

  // Filter bets based on selected filter and search
  const filteredBets = bets.filter((bet: Bet) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'crypto') return bet.category.toLowerCase() === 'crypto';
    if (selectedFilter === 'general') return bet.category.toLowerCase() === 'general';
    if (selectedFilter === 'active') return bet.status !== 'RESOLVED';
    if (selectedFilter === 'resolved') return bet.status === 'RESOLVED';
    if (selectedFilter === 'community') return bet.betType === 'voting';
    return true;
  }).filter((bet: Bet) => selectedCategory === 'all' || bet.category.toLowerCase() === selectedCategory.toLowerCase())
    .filter((bet: Bet) => !authorSearch || (bet.author && bet.author.toLowerCase().includes(authorSearch.toLowerCase())));

  // Price feed state
  const { price, isLoading: isPriceLoading, error: chainlinkError } = useAssetPrice(
    selectedAsset,
    5000 // Update every 5 seconds
  );

  // Add contract write hook with proper error handling
  const { writeContract, data: createBetData, isError: isWriteError, error: writeError } = useWriteContract();
  const { writeContractAsync } = useWriteContract();

  // Add transaction receipt hook
  const { isLoading: isTransactionPending, isSuccess: isTransactionSuccess } = useWaitForTransactionReceipt({
    hash: createBetData,
  });

  // Watch for transaction success with error handling
  useEffect(() => {
    if (isTransactionSuccess) {
      console.log('Transaction successful:', createBetData);
      createBet.handleTransactionSuccess();
    } else if (isWriteError) {
      console.error('Write error:', writeError);
      setIsCreatingBet(false);
      alert('Failed to create bet: ' + (writeError instanceof Error ? writeError.message : 'Unknown error'));
    }
  }, [isTransactionSuccess, isWriteError, writeError]);

  // Check user's preferred color scheme on initial load
  useEffect(() => {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, []);

  const togglePostExpand = (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      if (commentsUnsubscribeRef.current) {
        commentsUnsubscribeRef.current();
        commentsUnsubscribeRef.current = null;
      }
    } else {
      setExpandedPostId(postId);
      if (commentsUnsubscribeRef.current) {
        commentsUnsubscribeRef.current();
      }
      commentsUnsubscribeRef.current = listenToCommentsForBet(postId);
    }
  };
  
  // Update wallet state when connection changes
  useEffect(() => {
    if (!isConnected) {
      setWalletState('disconnected');
    } else if (chainId !== monadTestnet.id) {
      setWalletState('wrong_chain');
    } else {
      setWalletState('connected');
    }
  }, [isConnected, chainId]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleNewBetVoteAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    createBet.setNewBetVoteAmount(e.target.value);
  };

  // Simple auto-connect effect matching sample code
  useEffect(() => {
    if (isEthProviderAvailable && !isConnected && connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  }, [isEthProviderAvailable, isConnected, connectors, connect]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Wrapper for setNewBetCategory to match expected prop type
  const handleSetNewBetCategory = (cat: string) => {
    createBet.setNewBetCategory(cat as any); // Cast to Category
  };

  // Optionally, clean up on unmount
  useEffect(() => {
    return () => {
      if (commentsUnsubscribeRef.current) {
        commentsUnsubscribeRef.current();
      }
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      const timeout = setTimeout(() => setShowSkeleton(false), 1000);
      return () => clearTimeout(timeout);
    } else {
      setShowSkeleton(true);
    }
  }, [loading]);

  return (
    <div className={`flex flex-col min-h-screen w-full max-w-md mx-auto ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'} transition-colors duration-200`}>
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

      {/* Main Content: Feed or MyActivities */}
      {activePage === 'feed' ? (
        <>
          <HotBetsRow darkMode={darkMode} />
          {/* Unified filter bar: All, Crypto, General, Active, Resolved, Community Vote */}
          <div className="container mx-auto px-4 pt-4 pb-4">
            <div className="flex items-center space-x-2 overflow-x-auto whitespace-nowrap hide-scrollbar">
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedFilter === 'all' ? (darkMode ? 'bg-purple-800 text-white' : 'bg-purple-700 text-white') : (darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')}`}
                onClick={() => setSelectedFilter('all')}
              >
                All
              </button>
              {/* Author search bar */}
              <input
                type="text"
                value={authorSearch}
                onChange={e => setAuthorSearch(e.target.value)}
                placeholder="Search author..."
                className={`px-3 py-2 rounded-full text-sm border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400'}`}
                style={{ minWidth: 160, maxWidth: 220 }}
              />
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition-colors ${selectedFilter === 'crypto' ? (darkMode ? 'bg-purple-800 text-white' : 'bg-purple-700 text-white') : (darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')}`}
                onClick={() => setSelectedFilter('crypto')}
              >
                <TrendingUp size={16} className="mr-1" /> Crypto
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition-colors ${selectedFilter === 'general' ? (darkMode ? 'bg-purple-800 text-white' : 'bg-purple-700 text-white') : (darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')}`}
                onClick={() => setSelectedFilter('general')}
              >
                <Globe size={16} className="mr-1" /> General
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition-colors ${selectedFilter === 'active' ? (darkMode ? 'bg-purple-800 text-white' : 'bg-purple-700 text-white') : (darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')}`}
                onClick={() => setSelectedFilter('active')}
              >
                <Clock size={16} className="mr-1" /> Active
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition-colors ${selectedFilter === 'resolved' ? (darkMode ? 'bg-purple-800 text-white' : 'bg-purple-700 text-white') : (darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')}`}
                onClick={() => setSelectedFilter('resolved')}
              >
                <Award size={16} className="mr-1" /> Resolved
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition-colors ${selectedFilter === 'community' ? (darkMode ? 'bg-purple-800 text-white' : 'bg-purple-700 text-white') : (darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')}`}
                onClick={() => setSelectedFilter('community')}
              >
                <User size={16} className="mr-1" /> Community Vote
              </button>
            </div>
          </div>
          {/* Posts */}
          <main className="container mx-auto px-4 py-4 flex-1">
            {showSkeleton ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <BetSkeletonCard key={i} darkMode={darkMode} />
                ))}
              </div>
            ) : (
              loading ? (
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
                      <div className="px-4 py-3 flex items-center relative">
                        {/* Threshold percentage badge at top right */}
                        {bet.betType === 'verified' && bet.predictionType && typeof bet.priceThreshold === 'number' && (
                          <span className={
                            `absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold ` +
                            (bet.predictionType === 'pump'
                              ? (darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700')
                              : (darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700'))
                          }>
                            {bet.predictionType === 'pump' ? '+' : '-'}{bet.priceThreshold}%
                          </span>
                        )}
                        <p className={`${darkMode ? 'text-gray-100' : 'text-gray-800'} text-lg font-medium transition-colors duration-200 mr-2`}>{bet.content}</p>
                        <div className="flex flex-col items-end ml-auto">
                          {/* Share button below threshold badge */}
                          <button
                            onClick={async () => {
                              const shareUrl = window.location.origin;
                              const shareText = `🎲 Bet Prediction: ${bet.content}\nVote YAY or NAY on BetCaster!`;
                              if (actions && actions.composeCast) {
                                await actions.composeCast({
                                  text: shareText,
                                  embeds: [shareUrl]
                                });
                              } else {
                                const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl)}`;
                                window.open(url, '_blank');
                              }
                            }}
                            className={`mt-1 px-2 py-1 border rounded text-xs flex items-center ${darkMode ? 'border-blue-400 text-blue-200 hover:bg-blue-900/30' : 'border-blue-700 text-blue-700 hover:bg-blue-100'}`}
                            title="Share this bet to Farcaster"
                          >
                            <Share2 className="w-4 h-4 mr-1" /> Share
                          </button>
                        </div>
                      </div>
                      {/* Vote Section */}
                      <div className={`px-4 py-3 flex items-center justify-between border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} transition-colors duration-200`}>
                        <div className="flex items-center space-x-4">
                          <BetVoting
                            betId={bet.id}
                            voteStake={bet.betAmount}
                            betcasterAddress={betcasterAddress}
                            onVoteSuccess={loadBets}
                            updateSingleBet={updateSingleBet}
                            userVote={bet.userVote}
                            yayCount={bet.yay}
                            nayCount={bet.nay}
                            isResolved={bet.status === 'RESOLVED'}
                            predictionType={bet.betType === 'verified' ? bet.predictionType : undefined}
                            disableVoting={bet.status !== 'RESOLVED' && bet.expiryTime - Date.now() < 60000}
                            darkMode={darkMode}
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
              )
            )}
          </main>
        </>
      ) : (
        <MyActivities darkMode={darkMode} />
      )}

      {/* Client-side only components */}
      {mounted && (
        <BottomNav 
          isConnected={isConnected}
          address={address}
          chainId={chainId}
          darkMode={darkMode}
          connectors={connectors}
          connect={connect}
          switchChain={switchChain}
          balanceData={balanceData}
          isEthProviderAvailable={isEthProviderAvailable}
          connectError={connectError}
          switchError={switchError}
          activePage={activePage}
          onNavigate={setActivePage}
        />
      )}

      {/* Add padding at the bottom to account for navigation bar */}
      <div className="pb-20" />

      {/* Create Bet Modal */}
      {isCreateModalOpen && (
        <CreateBetModal
          darkMode={darkMode}
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          isCreatingBet={createBet.isCreatingBet}
          isTransactionPending={createBet.isTransactionPending}
          isWriteError={createBet.isWriteError}
          isFirestorePending={createBet.isFirestorePending}
          handleCreateBet={createBet.handleCreateBet}
          newBetContent={createBet.newBetContent}
          setNewBetContent={createBet.setNewBetContent}
          newBetCategory={createBet.newBetCategory}
          setNewBetCategory={handleSetNewBetCategory}
          newBetDuration={createBet.newBetDuration}
          setNewBetDuration={createBet.setNewBetDuration}
          newBetVoteAmount={createBet.newBetVoteAmount}
          setNewBetVoteAmount={createBet.setNewBetVoteAmount}
          betType={createBet.betType}
          setBetType={createBet.setBetType}
          selectedAsset={createBet.selectedAsset}
          setSelectedAsset={createBet.setSelectedAsset}
          predictionType={createBet.predictionType}
          setPredictionType={createBet.setPredictionType}
          priceThreshold={createBet.priceThreshold}
          setPriceThreshold={createBet.setPriceThreshold}
          mockCategories={mockCategories}
          SUPPORTED_ASSETS={SUPPORTED_ASSETS}
          handleNewBetVoteAmountChange={handleNewBetVoteAmountChange}
          MIN_VOTE_STAKE={MIN_VOTE_STAKE}
        />
      )}

      {showWalletModal && (
        <WalletModal 
          darkMode={darkMode}
          onClose={() => setShowWalletModal(false)}
          walletState={walletState}
          chainId={chainId}
          isWalletLoading={isWalletLoading}
          onConnect={handleWalletConnect}
          onSwitch={handleChainSwitch}
        />
      )}
      
      {showReconnectModal && (
        <ReconnectWalletModal 
          darkMode={darkMode}
          onClose={() => setShowReconnectModal(false)}
          onReconnect={() => {
            disconnect();
            setShowReconnectModal(false);
            setTimeout(() => handleWalletConnect(), 100);
          }}
        />
      )}
    </div>
  );
} 