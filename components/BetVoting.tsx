import { useWriteContract, useWaitForTransactionReceipt, useChainId, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { useState, useEffect, useRef } from 'react';
import { useMiniAppContext } from '../hooks/use-miniapp-context';
import { betService } from '../lib/services/betService';
import CelocasterArtifact from '../artifacts/contracts/Celocaster.sol/Celocaster.json';
import { ethers } from 'ethers';
import { writeContract } from 'wagmi/actions';
import toast from 'react-hot-toast';

// Add FallbackProvider setup for Celo RPCs
const CELO_RPC_URLS = [
  process.env.NEXT_PUBLIC_CELO_RPC_1,
].filter(Boolean);

function getFallbackProvider() {
  if (CELO_RPC_URLS.length === 1) {
    return new ethers.providers.JsonRpcProvider(CELO_RPC_URLS[0]);
  }
  const providers = CELO_RPC_URLS.map(url => new ethers.providers.JsonRpcProvider(url));
  return new ethers.providers.FallbackProvider(providers);
}

// Import ABI for the castVote function
const celocasterABI = CelocasterArtifact.abi;

// Contract constants
const MIN_VOTE_STAKE = 0.1; // 0.1 CELO

interface BetVotingProps {
  betId: string;
  voteStake: number; // This is the vote stake amount set by the bet creator
  celocasterAddress: `0x${string}`;
  onVoteSuccess?: () => void;
  userVote?: 'yay' | 'nay';
  yayCount?: number;
  nayCount?: number;
  isResolved?: boolean;
  predictionType?: 'pump' | 'dump';
  disableVoting?: boolean;
  updateSingleBet?: (betId: string) => Promise<void>;
  darkMode: boolean;
}

// Helper: fetch claimable prize (estimate, not on-chain call)
function getClaimAmount(voteStake: number, yayCount: number, nayCount: number, yayWon: boolean, userVote: 'yay' | 'nay') {
  const totalWinners = yayWon ? yayCount : nayCount;
  if (!totalWinners) return 0;
  return ((yayCount + nayCount) * voteStake) / totalWinners;
}

export default function BetVoting({ betId, voteStake, celocasterAddress, onVoteSuccess, userVote, yayCount = 0, nayCount = 0, isResolved = false, predictionType, disableVoting = false, updateSingleBet, darkMode }: BetVotingProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [lastVoteType, setLastVoteType] = useState<'yay' | 'nay' | null>(null);
  const [currentTxHash, setCurrentTxHash] = useState<`0x${string}` | undefined>(undefined);
  const { context } = useMiniAppContext();
  const chainId = useChainId();
  const { address } = useAccount();

  // Contract write hook
  const { writeContractAsync } = useWriteContract();

  // Transaction receipt hook
  const { isLoading: isTransactionPending, isSuccess: isTransactionSuccess, error: transactionError } = useWaitForTransactionReceipt({
    hash: currentTxHash,
    timeout: 30_000, // 30 seconds timeout
  });

  // Watch for transaction success and errors
  useEffect(() => {
    const handleTransaction = async () => {
      // Only proceed if we have a transaction hash
      if (!currentTxHash) return;

      if (isTransactionSuccess && lastVoteType) {
        try {
          // Update Firebase after blockchain transaction is confirmed
          await betService.voteBet(
            betId, 
            context?.user?.fid.toString() || '', 
            lastVoteType,
            context?.user?.username,
            context?.user?.pfpUrl
          );
          // Update only this bet instead of reloading all bets
          if (updateSingleBet) {
            await updateSingleBet(betId);
          } else {
            onVoteSuccess?.();
          }
        } catch (err) {
          toast.error('Vote confirmed on blockchain but failed to update in database. Please refresh.');
        } finally {
          setIsVoting(false);
          setLastVoteType(null);
          setCurrentTxHash(undefined);
        }
      } else if (transactionError) {
        setIsVoting(false);
        setLastVoteType(null);
        setCurrentTxHash(undefined);
        toast.error('Transaction failed: ' + (transactionError instanceof Error ? transactionError.message : 'Unknown error'));
      }
    };

    handleTransaction();
  }, [
    isTransactionSuccess,
    currentTxHash,
    lastVoteType,
    betId,
    context?.user?.fid,
    onVoteSuccess,
    updateSingleBet,
    transactionError,
    setIsVoting,
    setLastVoteType,
    setCurrentTxHash,
    betService
  ]);

  const handleVote = async (isYay: boolean) => {
    if (!context?.user?.fid) {
      toast.error('Please connect your Farcaster account to vote');
      return;
    }

    if (!chainId) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    // Validate vote stake amount
    if (voteStake < MIN_VOTE_STAKE) {
      toast.error(`Minimum stake required is ${MIN_VOTE_STAKE} CELO`);
      return;
    }

    setIsVoting(true);
    setLastVoteType(isYay ? 'yay' : 'nay');

    try {
      // Convert voteStake from CELO to wei
      const voteStakeWei = parseEther(voteStake.toString());

      // Prepare transaction parameters with proper configuration
      const params = {
        address: celocasterAddress,
        abi: celocasterABI,
        functionName: 'castVote',
        args: [betId, isYay],
        value: voteStakeWei,
        chainId,
        account: address,
      } as const;

      // Send transaction and get hash
      const txResponse = await writeContractAsync(params);
      setCurrentTxHash(txResponse);

    } catch (err) {
      setIsVoting(false);
      setLastVoteType(null);
      setCurrentTxHash(undefined);
      
      if (err instanceof Error) {
        if (err.message.includes('insufficient funds')) {
          toast.error('Insufficient CELO balance');
        } else if (err.message.includes('user rejected') || err.message.includes('user denied')) {
          // Don't show any toast for user rejections
          return;
        } else {
          toast.error('Failed to place vote. Please try again');
        }
      } else {
        toast.error('Failed to place vote. Please try again');
      }
    }
  };

  const [showClaimModal, setShowClaimModal] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [yayWon, setYayWon] = useState<boolean | null>(null);
  const [claimAmount, setClaimAmount] = useState<number>(0);
  const claimBtnRef = useRef<HTMLButtonElement>(null);

  // Debug logs for claim eligibility
  useEffect(() => {
  }, [isResolved, yayWon, userVote, hasClaimed]);

  // Fetch yayWon from contract if resolved
  useEffect(() => {
    async function fetchYayWon() {
      if (!isResolved) return;
      try {
        const provider = getFallbackProvider();
        const contract = new ethers.Contract(celocasterAddress, celocasterABI, provider);
        const result = await contract.getBetInfo(betId);
        setYayWon(result.yayWon);
      } catch (e) {
        setYayWon(null);
      }
    }
    fetchYayWon();
  }, [isResolved, betId, celocasterAddress]);

  // Check if user can claim
  const canClaim = isResolved && yayWon !== null && userVote && ((yayWon && userVote === 'yay') || (!yayWon && userVote === 'nay')) && !hasClaimed;
  useEffect(() => {
    if (canClaim) {
      setClaimAmount(getClaimAmount(voteStake, yayCount, nayCount, !!yayWon, userVote!));
    }
  }, [canClaim, voteStake, yayCount, nayCount, yayWon, userVote]);

  // Check if user has already claimed (on mount and when bet/user changes)
  useEffect(() => {
    async function checkClaimed() {
      if (!address || !betId) return;
      try {
        const provider = getFallbackProvider();
        const contract = new ethers.Contract(celocasterAddress, celocasterABI, provider);
        const [, , claimed] = await contract.getUserVoteInfo(betId, address);
        setHasClaimed(claimed);
      } catch (e) {
        setHasClaimed(false);
      }
    }
    checkClaimed();
  }, [address, betId, celocasterAddress]);

  // Claim handler
  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      const txResponse = await writeContractAsync({
        address: celocasterAddress,
        abi: celocasterABI,
        functionName: 'claimPrize',
        args: [betId],
        chainId,
        account: address,
        gas: BigInt(300000), // Use BigInt constructor instead of literal
      });
      
      // Wait for transaction receipt
      const receipt = await new Promise((resolve, reject) => {
        const checkReceipt = async () => {
          try {
            const provider = getFallbackProvider();
            const receipt = await provider.getTransactionReceipt(txResponse);
            if (receipt) {
              resolve(receipt);
            } else {
              setTimeout(checkReceipt, 1000);
            }
          } catch (error) {
            reject(error);
          }
        };
        checkReceipt();
      });

      if (receipt) {
        const provider = getFallbackProvider();
        const contract = new ethers.Contract(celocasterAddress, celocasterABI, provider);
        const [, , claimed] = await contract.getUserVoteInfo(betId, address);
        setHasClaimed(claimed);
        if (updateSingleBet) {
          await updateSingleBet(betId);
        } else {
          onVoteSuccess?.();
        }
        setShowClaimModal(false);
        toast.success('Prize claimed successfully!');
      }
    } catch (e) {
      if (e instanceof Error) {
        if (e.message.includes('insufficient funds')) {
          toast.error('Insufficient CELO for gas fees');
        } else if (e.message.includes('user rejected') || e.message.includes('user denied')) {
          // Don't show any toast for user rejections
          return;
        } else {
          toast.error('Failed to claim prize. Please try again');
        }
      } else {
        toast.error('Failed to claim prize. Please try again');
      }
      setShowClaimModal(false);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <button
        className={`bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm font-medium disabled:opacity-50${userVote || isResolved || disableVoting ? ' opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => handleVote(true)}
        disabled={isVoting || isTransactionPending || !!userVote || isResolved || disableVoting}
      >
        {(isVoting && lastVoteType === 'yay') || (isTransactionPending && lastVoteType === 'yay') ? (
          <span className="mr-2">
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin align-middle"></span>
          </span>
        ) : null}
        <span className="inline-flex items-center">
          {userVote === 'yay' && <span className="mr-1">✓</span>}
          {`Yay (${yayCount})`}
        </span>
      </button>
      <button
        className={`bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium disabled:opacity-50${userVote || isResolved || disableVoting ? ' opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => handleVote(false)}
        disabled={isVoting || isTransactionPending || !!userVote || isResolved || disableVoting}
      >
        {(isVoting && lastVoteType === 'nay') || (isTransactionPending && lastVoteType === 'nay') ? (
          <span className="mr-2">
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin align-middle"></span>
          </span>
        ) : null}
        <span className="inline-flex items-center">
          {userVote === 'nay' && <span className="mr-1">✓</span>}
          {`Nay (${nayCount})`}
        </span>
      </button>
      {/* Pump/Dump Arrow Only Tag */}
      {predictionType && (
        <span className={`flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${predictionType === 'pump' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'} ml-2`}>
          {predictionType === 'pump' ? (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" /></svg>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l-7-7m7 7l7-7" /></svg>
          )}
        </span>
      )}
      {/* Claim Prize Button (small, under user's vote) */}
      {canClaim && !hasClaimed && (
        <button
          ref={claimBtnRef}
          className="text-xs text-green-700 underline ml-2 mt-1"
          onClick={() => setShowClaimModal(true)}
          disabled={isClaiming}
        >
          {isClaiming ? 'Claiming...' : 'Claim Prize'}
        </button>
      )}
      {hasClaimed && (
        <span className="text-xs text-green-600 ml-2 mt-1 font-semibold flex items-center">
          <span className="mr-1">✓</span> Claimed
        </span>
      )}
      {/* Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className={`rounded-lg shadow-lg p-6 min-w-[300px] ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}> 
            <h3 className="text-lg font-semibold mb-2 text-center">Claim Prize</h3>
            <p className="text-center mb-4">You will receive <span className="font-bold">{claimAmount.toFixed(4)} CELO</span></p>
            <div className="flex justify-center gap-4">
              <button
                className={`px-4 py-2 rounded-md font-medium flex items-center justify-center transition-colors duration-200 ${
                  isClaiming
                    ? darkMode
                      ? 'bg-green-900 text-green-200 opacity-70 cursor-not-allowed'
                      : 'bg-green-200 text-green-700 opacity-70 cursor-not-allowed'
                    : darkMode
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                onClick={handleClaim}
                disabled={isClaiming}
              >
                {isClaiming ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                    Claiming...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
              <button
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                  isClaiming
                    ? darkMode
                      ? 'bg-gray-700 text-gray-400 opacity-70 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-400 opacity-70 cursor-not-allowed'
                    : darkMode
                    ? 'bg-gray-600 hover:bg-gray-700 text-gray-200'
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                }`}
                onClick={() => setShowClaimModal(false)}
                disabled={isClaiming}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 