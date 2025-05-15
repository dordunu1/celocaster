import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useBalance } from 'wagmi';
import { monadTestnet } from 'wagmi/chains';
import toast from 'react-hot-toast';

export type WalletState = 'disconnected' | 'wrong_chain' | 'connected';

export function useWallet() {
  const { isConnected, address, chainId } = useAccount();
  const { connect, connectors, error: connectError } = useConnect();
  const { switchChain, error: switchError } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const { data: balanceData } = useBalance({
    address: address,
  });

  const [walletState, setWalletState] = useState<WalletState>('disconnected');
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showReconnectModal, setShowReconnectModal] = useState(false);

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

  // Handle wallet connection
  const handleWalletConnect = async () => {
    setIsWalletLoading(true);
    try {
      if (connectors && connectors.length > 0 && connectors[0]?.id === 'farcasterFrame') {
        await connect({ connector: connectors[0] });
      } else {
        toast.error('No valid wallet connector found. Please reload the app.');
      }
    } catch (err) {
      console.error('Wallet connection failed:', err);
      toast.error('Failed to connect wallet. Please try again.');
    } finally {
      setIsWalletLoading(false);
    }
  };

  // Handle chain switch
  const handleChainSwitch = async () => {
    setIsWalletLoading(true);
    try {
      await switchChain({ chainId: monadTestnet.id });
    } catch (err) {
      console.error('Chain switch failed:', err);
      toast.error('Failed to switch chain. Please try manually in your wallet.');
    } finally {
      setIsWalletLoading(false);
    }
  };

  // Handle wallet error
  const handleWalletError = (err: unknown) => {
    if (
      typeof err === 'object' &&
      err !== null &&
      'message' in err &&
      typeof (err as any).message === 'string'
    ) {
      const message = (err as any).message as string;
      if (
        message.includes('getChainId is not a function') ||
        message.includes('session') ||
        message.includes('connector')
      ) {
        disconnect();
        setShowReconnectModal(true);
        return true;
      }
    }
    return false;
  };

  return {
    isConnected,
    address,
    chainId,
    walletState,
    isWalletLoading,
    showWalletModal,
    showReconnectModal,
    balanceData,
    connectError,
    switchError,
    setShowWalletModal,
    setShowReconnectModal,
    handleWalletConnect,
    handleChainSwitch,
    handleWalletError,
    disconnect
  };
} 