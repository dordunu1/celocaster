import { betService } from '../lib/services/betService';
import { parseEther } from 'viem';
import { Bet } from '../lib/types/bet';
import { Abi } from 'viem';
import toast from 'react-hot-toast';

interface HandleCreateBetArgs {
  context: any;
  betcasterAddress: `0x${string}`;
  betcasterABI: Abi;
  newBetContent: string;
  newBetCategory: string;
  newBetDuration: string;
  newBetVoteAmount: string;
  betType: 'voting' | 'verified';
  selectedAsset: string;
  predictionType: 'pump' | 'dump';
  priceThreshold: number;
  price: string | null;
  writeContractAsync: (params: any) => Promise<any>;
  setPendingBetId: (id: string) => void;
  setPendingTxHash: (hash: string) => void;
  setIsCreatingBet: (val: boolean) => void;
  MIN_VOTE_STAKE: number;
  monadTestnet: any;
}

// Handler for creating a bet (contract + Firestore)
export async function handleCreateBet({
  context,
  betcasterAddress,
  betcasterABI,
  newBetContent,
  newBetCategory,
  newBetDuration,
  newBetVoteAmount,
  betType,
  selectedAsset,
  predictionType,
  priceThreshold,
  price,
  writeContractAsync,
  setPendingBetId,
  setPendingTxHash,
  setIsCreatingBet,
  MIN_VOTE_STAKE,
  monadTestnet,
}: HandleCreateBetArgs) {
  if (!context?.user?.fid) {
    toast.error('Please log in to create a bet');
    return;
  }
  if (!newBetContent.trim()) return;
  if (!betcasterAddress) {
    toast.error('Contract address is not configured');
    return;
  }
  if (!newBetVoteAmount || isNaN(Number(newBetVoteAmount)) || Number(newBetVoteAmount) < MIN_VOTE_STAKE) {
    toast.error(`Vote stake less than ${MIN_VOTE_STAKE} MON will fail. Please enter at least ${MIN_VOTE_STAKE} MON.`);
    return;
  }
  setIsCreatingBet(true);
  try {
    const durationHours = parseFloat(newBetDuration);
    const durationSeconds = Math.round(durationHours * 60 * 60);
    const betId = `${context.user.fid}-${Date.now()}`;
    setPendingBetId(betId);
    let gasLimit;
    try { gasLimit = BigInt(500000); } catch { gasLimit = undefined; }
    const params = {
      address: betcasterAddress,
      abi: betcasterABI,
      functionName: 'createBet',
      value: parseEther('3'),
      args: [
        betId,
        parseEther(newBetVoteAmount),
        BigInt(durationSeconds),
        betType === 'verified',
        selectedAsset || '',
        BigInt(priceThreshold),
        predictionType === 'pump'
      ],
      gas: BigInt(500000)
    };
    const hash = await writeContractAsync(params);
    if (!hash || typeof hash !== 'string') {
      setIsCreatingBet(false);
      return;
    }
    setPendingTxHash(hash);
  } catch (err) {
    toast.error('Failed to create bet: ' + (err instanceof Error ? err.message : JSON.stringify(err)));
    setIsCreatingBet(false);
  }
}

interface HandleTransactionSuccessArgs {
  context: any;
  newBetContent: string;
  newBetCategory: string;
  newBetDuration: string;
  newBetVoteAmount: string;
  betType: 'voting' | 'verified';
  selectedAsset: string;
  predictionType: 'pump' | 'dump';
  priceThreshold: number;
  price: string | null;
  pendingBetId: string | null;
  setIsCreateModalOpen: (val: boolean) => void;
  setNewBetContent: (val: string) => void;
  setBetType: (val: 'voting' | 'verified') => void;
  setPredictionType: (val: 'pump' | 'dump') => void;
  setPriceThreshold: (val: number) => void;
  setPendingBetId: (val: string | null) => void;
  setIsCreatingBet: (val: boolean) => void;
  loadBets: () => void;
}

// Handler for transaction success (Firestore creation)
export async function handleTransactionSuccess({
  context,
  newBetContent,
  newBetCategory,
  newBetDuration,
  newBetVoteAmount,
  betType,
  selectedAsset,
  predictionType,
  priceThreshold,
  price,
  pendingBetId,
  setIsCreateModalOpen,
  setNewBetContent,
  setBetType,
  setPredictionType,
  setPriceThreshold,
  setPendingBetId,
  setIsCreatingBet,
  loadBets,
}: HandleTransactionSuccessArgs) {
  try {
    const durationHours = parseFloat(newBetDuration);
    const baseBetData = {
      author: context?.user?.username || 'anonymous',
      category: newBetCategory,
      content: newBetContent.trim(),
      stakeAmount: 2,
      betAmount: Number(newBetVoteAmount),
      timeLeft: newBetDuration,
      expiryTime: Date.now() + (durationHours * 60 * 60 * 1000),
      timestamp: Date.now(),
      status: 'ACTIVE',
      pfpUrl: context?.user?.pfpUrl,
      betType: betType
    };
    if (!pendingBetId) throw new Error('No pending betId found');
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
    await betService.createBet(newBet as Bet);
    setIsCreateModalOpen(false);
    setNewBetContent('');
    setBetType('voting');
    setPredictionType('pump');
    setPriceThreshold(5);
    setPendingBetId(null);
  } catch (err) {
    toast.error('Failed to save bet details. Please check your bets or try again.');
  } finally {
    setIsCreatingBet(false);
    loadBets();
  }
} 