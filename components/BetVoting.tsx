import { useWriteContract, useWaitForTransactionReceipt, useChainId, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { useState, useEffect, useRef } from 'react';
import { useMiniAppContext } from '../hooks/use-miniapp-context';
import { betService } from '../lib/services/betService';
import BetcasterArtifact from '../artifacts/contracts/Betcaster.sol/Betcaster.json';
import { ethers } from 'ethers';
import { writeContract } from 'wagmi/actions';

// Add FallbackProvider setup for multiple RPCs
const MONAD_RPC_URLS = [
  process.env.NEXT_PUBLIC_MONAD_RPC_1,
  process.env.NEXT_PUBLIC_MONAD_RPC_2,
  process.env.NEXT_PUBLIC_MONAD_RPC_3,
  process.env.NEXT_PUBLIC_MONAD_RPC_4,
  process.env.NEXT_PUBLIC_MONAD_RPC_5,
  process.env.NEXT_PUBLIC_MONAD_RPC_6,
  process.env.NEXT_PUBLIC_MONAD_RPC_7,
].filter(Boolean);

function getFallbackProvider() {
  if (MONAD_RPC_URLS.length === 1) {
    return new ethers.providers.JsonRpcProvider(MONAD_RPC_URLS[0]);
  }
  const providers = MONAD_RPC_URLS.map(url => new ethers.providers.JsonRpcProvider(url));
  return new ethers.providers.FallbackProvider(providers);
}

// Import ABI for the castVote function
const betcasterABI = BetcasterArtifact.abi;

// Contract constants
const MIN_VOTE_STAKE = 0.1; // 0.1 MON

interface BetVotingProps {
  betId: string;
  voteStake: number; // This is the vote stake amount set by the bet creator
  betcasterAddress: `0x${string}`;
  onVoteSuccess?: () => void;
  userVote?: 'yay' | 'nay';
  yayCount?: number;
  nayCount?: number;
  isResolved?: boolean;
}

// Helper: fetch claimable prize (estimate, not on-chain call)
function getClaimAmount(voteStake: number, yayCount: number, nayCount: number, yayWon: boolean, userVote: 'yay' | 'nay') {
  const totalWinners = yayWon ? yayCount : nayCount;
  if (!totalWinners) return 0;
  return ((yayCount + nayCount) * voteStake) / totalWinners;
}

export default function BetVoting({ betId, voteStake, betcasterAddress, onVoteSuccess, userVote, yayCount = 0, nayCount = 0, isResolved = false }: BetVotingProps) {
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
          await betService.voteBet(betId, context?.user?.fid.toString() || '', lastVoteType);
          onVoteSuccess?.();
        } catch (err) {
          alert('Vote confirmed on blockchain but failed to update in database. Please refresh.');
        } finally {
          setIsVoting(false);
          setLastVoteType(null);
          setCurrentTxHash(undefined);
        }
      } else if (transactionError) {
        setIsVoting(false);
        setLastVoteType(null);
        setCurrentTxHash(undefined);
        alert('Transaction failed: ' + (transactionError instanceof Error ? transactionError.message : 'Unknown error'));
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
    transactionError,
    setIsVoting,
    setLastVoteType,
    setCurrentTxHash,
    betService
  ]);

  const handleVote = async (isYay: boolean) => {
    if (!context?.user?.fid) {
      alert('Please connect your Farcaster account to vote');
      return;
    }

    if (!chainId) {
      alert('Please connect your wallet');
      return;
    }

    if (!address) {
      alert('Please connect your wallet');
      return;
    }

    // Validate vote stake amount
    if (voteStake < MIN_VOTE_STAKE) {
      alert(`Minimum stake required is ${MIN_VOTE_STAKE} MON`);
      return;
    }

    setIsVoting(true);
    setLastVoteType(isYay ? 'yay' : 'nay');

    try {
      // Convert voteStake from MON to wei
      const voteStakeWei = parseEther(voteStake.toString());

      // Prepare transaction parameters with proper configuration
      const params = {
        address: betcasterAddress,
        abi: betcasterABI,
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
          alert('Insufficient MON balance');
        } else if (err.message.includes('user rejected') || err.message.includes('user denied')) {
          // Don't show any alert for user rejections
          return;
        } else {
          alert('Failed to place vote. Please try again');
        }
      } else {
        alert('Failed to place vote. Please try again');
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
        const contract = new ethers.Contract(betcasterAddress, betcasterABI, provider);
        const result = await contract.getBetInfo(betId);
        setYayWon(result.yayWon);
      } catch (e) {
        setYayWon(null);
      }
    }
    fetchYayWon();
  }, [isResolved, betId, betcasterAddress]);

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
        const contract = new ethers.Contract(betcasterAddress, betcasterABI, provider);
        const [, , claimed] = await contract.getUserVoteInfo(betId, address);
        setHasClaimed(claimed);
      } catch (e) {
        setHasClaimed(false);
      }
    }
    checkClaimed();
  }, [address, betId, betcasterAddress]);

  // Claim handler
  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      const txResponse = await writeContractAsync({
        address: betcasterAddress,
        abi: betcasterABI,
        functionName: 'claimPrize',
        args: [betId],
        chainId,
        account: address,
      });
      
      setTimeout(async () => {
        await new Promise(res => setTimeout(res, 2000));
        const provider = getFallbackProvider();
        const contract = new ethers.Contract(betcasterAddress, betcasterABI, provider);
        const [, , claimed] = await contract.getUserVoteInfo(betId, address);
        setHasClaimed(claimed);
        onVoteSuccess?.();
        setShowClaimModal(false);
        alert('Prize claimed successfully!');
      }, 3000);
    } catch (e) {
      if (e instanceof Error) {
        if (e.message.includes('insufficient funds')) {
          alert('Insufficient MON for gas fees');
        } else if (e.message.includes('user rejected') || e.message.includes('user denied')) {
          // Don't show any alert for user rejections
          return;
        } else {
          alert('Failed to claim prize. Please try again');
        }
      } else {
        alert('Failed to claim prize. Please try again');
      }
      setShowClaimModal(false);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md disabled:opacity-50${userVote || isResolved ? ' opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => handleVote(true)}
        disabled={isVoting || isTransactionPending || !!userVote || isResolved}
      >
        {userVote === 'yay' && <span className="mr-1">✓</span>}
        {isVoting && lastVoteType === 'yay' ? 'Waiting for wallet...' : isTransactionPending && lastVoteType === 'yay' ? 'Confirming...' : `Yay (${yayCount})`}
      </button>
      <button
        className={`bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md disabled:opacity-50${userVote || isResolved ? ' opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => handleVote(false)}
        disabled={isVoting || isTransactionPending || !!userVote || isResolved}
      >
        {userVote === 'nay' && <span className="mr-1">✓</span>}
        {isVoting && lastVoteType === 'nay' ? 'Waiting for wallet...' : isTransactionPending && lastVoteType === 'nay' ? 'Confirming...' : `Nay (${nayCount})`}
      </button>
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 min-w-[300px]">
            <h3 className="text-lg font-semibold mb-2 text-center">Claim Prize</h3>
            <p className="text-center mb-4">You will receive <span className="font-bold">{claimAmount.toFixed(4)} MON</span></p>
            <div className="flex justify-center gap-4">
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
                onClick={handleClaim}
                disabled={isClaiming}
              >
                {isClaiming ? 'Claiming...' : 'Confirm'}
              </button>
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium"
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