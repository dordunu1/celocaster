import { useWriteContract, useWaitForTransactionReceipt, useChainId, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { useState, useEffect } from 'react';
import { useMiniAppContext } from '../hooks/use-miniapp-context';
import { betService } from '../lib/services/betService';
import BetcasterArtifact from '../artifacts/contracts/Betcaster.sol/Betcaster.json';

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
}

export default function BetVoting({ betId, voteStake, betcasterAddress, onVoteSuccess, userVote, yayCount = 0, nayCount = 0 }: BetVotingProps) {
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

      console.log('Monitoring transaction:', currentTxHash);

      if (isTransactionSuccess && lastVoteType) {
        console.log('Vote transaction successful:', currentTxHash);
        try {
          // Update Firebase after blockchain transaction is confirmed
          await betService.voteBet(betId, context?.user?.fid.toString() || '', lastVoteType);
          onVoteSuccess?.();
          console.log('Vote updated in Firebase');
        } catch (err) {
          console.error('Failed to update vote in Firebase:', err);
          alert('Vote confirmed on blockchain but failed to update in database. Please refresh.');
        } finally {
          setIsVoting(false);
          setLastVoteType(null);
          setCurrentTxHash(undefined);
        }
      } else if (transactionError) {
        console.error('Transaction error:', transactionError);
        setIsVoting(false);
        setLastVoteType(null);
        setCurrentTxHash(undefined);
        alert('Transaction failed: ' + (transactionError instanceof Error ? transactionError.message : 'Unknown error'));
      }
    };

    handleTransaction();
  }, [isTransactionSuccess, currentTxHash, lastVoteType, betId, context?.user?.fid, onVoteSuccess, transactionError]);

  const handleVote = async (isYay: boolean) => {
    if (!context?.user?.fid) {
      console.log('Vote failed: User not logged in');
      alert('Please log in to vote');
      return;
    }

    if (!chainId) {
      console.log('Vote failed: No chain ID');
      alert('Please connect to Monad network');
      return;
    }

    if (!address) {
      console.log('Vote failed: No wallet address');
      alert('Please connect your wallet');
      return;
    }

    // Validate vote stake amount
    if (voteStake < MIN_VOTE_STAKE) {
      console.log(`Vote failed: Stake too low. Required: ${MIN_VOTE_STAKE} MON, Provided: ${voteStake} MON`);
      alert(`Vote stake must be at least ${MIN_VOTE_STAKE} MON`);
      return;
    }

    setIsVoting(true);
    setLastVoteType(isYay ? 'yay' : 'nay');

    try {
      // Convert voteStake from MON to wei
      const voteStakeWei = parseEther(voteStake.toString());
      console.log('Starting vote transaction with details:', {
        voteStake,
        voteStakeWei: voteStakeWei.toString(),
        userAddress: address,
        contractAddress: betcasterAddress,
        chainId,
        betId,
        isYay
      });

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

      console.log('Sending vote transaction with params:', {
        ...params,
        value: params.value.toString()
      });

      // Send transaction and get hash
      const txResponse = await writeContractAsync(params);
      console.log('Transaction submitted successfully. Hash:', txResponse);
      setCurrentTxHash(txResponse);

    } catch (err) {
      console.error('Vote transaction failed with error:', err);
      setIsVoting(false);
      setLastVoteType(null);
      setCurrentTxHash(undefined);
      
      if (err instanceof Error) {
        console.log('Error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack
        });
        
        if (err.message.includes('insufficient funds')) {
          alert('Insufficient funds to place vote');
        } else if (err.message.includes('user rejected') || err.message.includes('user denied')) {
          alert('Transaction was cancelled');
        } else {
          alert('Failed to vote: ' + err.message);
        }
      } else {
        alert('Failed to vote: Unknown error');
      }
    }
  };

  return (
    <div className="flex gap-2">
      <button
        className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md disabled:opacity-50${userVote ? ' opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => handleVote(true)}
        disabled={isVoting || isTransactionPending || !!userVote}
      >
        {isVoting && lastVoteType === 'yay' ? 'Waiting for wallet...' : isTransactionPending && lastVoteType === 'yay' ? 'Confirming...' : `Yay (${yayCount})`}
      </button>
      <button
        className={`bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md disabled:opacity-50${userVote ? ' opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => handleVote(false)}
        disabled={isVoting || isTransactionPending || !!userVote}
      >
        {isVoting && lastVoteType === 'nay' ? 'Waiting for wallet...' : isTransactionPending && lastVoteType === 'nay' ? 'Confirming...' : `Nay (${nayCount})`}
      </button>
    </div>
  );
} 