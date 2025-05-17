import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { betService } from '../lib/services/betService';
import { useMiniAppContext } from './use-miniapp-context';
import { useAssetPrice } from './useAssetPrice';
import celocasterArtifact from '../artifacts/contracts/Celocaster.sol/Celocaster.json';
import { Bet, Category } from '../lib/types/bet';
import toast from 'react-hot-toast';

const celocasterABI = celocasterArtifact.abi;
const MIN_VOTE_STAKE = 0.1; // 0.1 CELO

export function useCreateBet(celocasterAddress: `0x${string}`) {
  const { context } = useMiniAppContext();
  const [isCreatingBet, setIsCreatingBet] = useState(false);
  const [pendingBetId, setPendingBetId] = useState<string | null>(null);
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const [isFirestorePending, setIsFirestorePending] = useState(false);

  // Form state
  const [newBetContent, setNewBetContent] = useState('');
  const [newBetCategory, setNewBetCategory] = useState<Category>('Crypto');
  const [newBetDuration, setNewBetDuration] = useState('24');
  const [newBetVoteAmount, setNewBetVoteAmount] = useState<string>('0.1');
  const [selectedAsset, setSelectedAsset] = useState('');
  const [betType, setBetType] = useState<'voting' | 'verified'>('voting');
  const [predictionType, setPredictionType] = useState<'pump' | 'dump'>('pump');
  const [priceThreshold, setPriceThreshold] = useState<number>(5); // 5% default

  // Price feed state
  const { price, isLoading: isPriceLoading, error: chainlinkError } = useAssetPrice(
    selectedAsset,
    5000 // Update every 5 seconds
  );

  // Contract write hooks
  const { writeContract, data: createBetData, isError: isWriteError, error: writeError } = useWriteContract();
  const { writeContractAsync } = useWriteContract();
  const { isLoading: isTransactionPending, isSuccess: isTransactionSuccess } = useWaitForTransactionReceipt({
    hash: createBetData,
  });

  // Track when the contract transaction is confirmed
  useEffect(() => {
    if (pendingTxHash) {
      // Wait for transaction confirmation, then create in Firestore
      (async () => {
        setIsFirestorePending(true);
        try {
          await handleTransactionSuccess();
        } finally {
          setIsFirestorePending(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTxHash]);

  // Refactored handleCreateBet to return a promise that resolves after Firestore update
  const handleCreateBet = async () => {
    if (!context?.user?.fid) {
      toast.error('Please log in to create a bet');
      return false;
    }
    if (!newBetContent.trim()) return false;
    if (!newBetVoteAmount || isNaN(Number(newBetVoteAmount)) || Number(newBetVoteAmount) < MIN_VOTE_STAKE) {
      toast.error(`Vote stake less than ${MIN_VOTE_STAKE} CELO will fail. Please enter at least ${MIN_VOTE_STAKE} CELO.`);
      return false;
    }
    setIsCreatingBet(true);
    try {
      const durationHours = parseFloat(newBetDuration);
      const durationSeconds = Math.round(durationHours * 60 * 60);
      const betId = `${context.user.fid}-${Date.now()}`;
      setPendingBetId(betId);
      const params = {
        address: celocasterAddress,
        abi: celocasterABI,
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
      } as const;
      const hash = await writeContractAsync(params);
      if (!hash || typeof hash !== 'string') {
        throw new Error('Transaction failed');
      }
      setPendingTxHash(hash);
      // Wait for Firestore update (isFirestorePending will be true until done)
      await new Promise<void>((resolve) => {
        const check = () => {
          if (!isFirestorePending) resolve();
          else setTimeout(check, 200);
        };
        check();
      });
      return true;
    } catch (err) {
      setIsCreatingBet(false);
      toast.error('Failed to create bet: ' + (err instanceof Error ? err.message : JSON.stringify(err)));
      return false;
    }
  };

  const handleTransactionSuccess = async () => {
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
      setNewBetContent('');
      setBetType('voting');
      setPredictionType('pump');
      setPriceThreshold(5);
      setPendingBetId(null);
      setPendingTxHash(null);
    } catch (err) {
      console.error('Failed to create bet in Firebase:', err);
      toast.error('Failed to save bet details. Please check your bets or try again.');
    } finally {
      setIsCreatingBet(false);
    }
  };

  return {
    // Form state
    newBetContent,
    setNewBetContent,
    newBetCategory,
    setNewBetCategory,
    newBetDuration,
    setNewBetDuration,
    newBetVoteAmount,
    setNewBetVoteAmount,
    selectedAsset,
    setSelectedAsset,
    betType,
    setBetType,
    predictionType,
    setPredictionType,
    priceThreshold,
    setPriceThreshold,

    // Loading states
    isCreatingBet,
    isTransactionPending,
    isPriceLoading,
    chainlinkError,
    isFirestorePending,

    // Transaction states
    isWriteError,
    writeError,
    isTransactionSuccess,

    // Handlers
    handleCreateBet,
    handleTransactionSuccess
  };
} 