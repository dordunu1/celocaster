'use client';

import React from 'react';
import { useMiniAppContext } from "../../hooks/use-miniapp-context";
import { parseEther } from "viem";
import { monadTestnet } from "viem/chains";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSendTransaction,
  useSwitchChain,
} from "wagmi";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";

// Add wallet error handler hook
function useWalletErrorHandler() {
  const { disconnect } = useDisconnect();
  return (err: unknown) => {
    if (
      typeof err === 'object' &&
      err !== null &&
      'message' in err &&
      typeof (err as any).message === 'string' &&
      (
        (err as any).message.includes('getChainId is not a function') ||
        (err as any).message.includes('session') ||
        (err as any).message.includes('connector')
      )
    ) {
      disconnect();
      alert('Your wallet session expired or is broken. Please reconnect your wallet.');
      return true;
    }
    return false;
  };
}

export function WalletActions() {
  const { isEthProviderAvailable } = useMiniAppContext();
  const { isConnected, address, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: hash, sendTransaction } = useSendTransaction();
  const { switchChain } = useSwitchChain();
  const { connect, connectors } = useConnect();
  const handleWalletError = useWalletErrorHandler();

  async function sendTransactionHandler() {
    try {
      await sendTransaction({
      to: "0x7f748f154B6D180D35fA12460C7E4C631e28A9d7",
      value: parseEther("1"),
    });
    } catch (err) {
      handleWalletError(err);
    }
  }

  return (
    <div className="space-y-4 border border-[#333] rounded-md p-4">
      <h2 className="text-xl font-bold text-left">sdk.wallet.ethProvider</h2>
      <div className="flex flex-row space-x-4 justify-start items-start">
        {isConnected ? (
          <div className="flex flex-col space-y-4 justify-start">
            <p className="text-sm text-left">
              Connected to wallet:{" "}
              <span className="bg-white font-mono text-black rounded-md p-[4px]">
                {address}
              </span>
            </p>
            <p className="text-sm text-left">
              Chain Id:{" "}
              <span className="bg-white font-mono text-black rounded-md p-[4px]">
                {chainId}
              </span>
            </p>
            {chainId === monadTestnet.id ? (
              <div className="flex flex-col space-y-2 border border-[#333] p-4 rounded-md">
                <h2 className="text-lg font-semibold text-left">
                  Send Transaction Example
                </h2>
                <button
                  className="bg-white text-black rounded-md p-2 text-sm"
                  onClick={sendTransactionHandler}
                >
                  Send Transaction
                </button>
                {hash && (
                  <button
                    className="bg-white text-black rounded-md p-2 text-sm"
                    onClick={() =>
                      window.open(
                        `https://testnet.monadexplorer.com/tx/${hash}`,
                        "_blank"
                      )
                    }
                  >
                    View Transaction
                  </button>
                )}
              </div>
            ) : (
              <button
                className="bg-white text-black rounded-md p-2 text-sm"
                onClick={() => switchChain({ chainId: monadTestnet.id })}
              >
                Switch to Monad Testnet
              </button>
            )}

            <button
              className="bg-white text-black rounded-md p-2 text-sm"
              onClick={() => disconnect()}
            >
              Disconnect Wallet
            </button>
            {/* Reconnect Wallet Button */}
            <button
              className="bg-yellow-200 text-black rounded-md p-2 text-sm"
              onClick={() => disconnect()}
            >
              Reconnect Wallet
            </button>
          </div>
        ) : (
          isEthProviderAvailable ?
          (
            <button
              className="bg-white text-black w-full rounded-md p-2 text-sm"
              onClick={() => {
                try {
                  if (connectors && connectors.length > 0 && connectors[0]?.id === 'farcasterFrame') {
                    connect({ connector: connectors[0] });
                  } else {
                    alert('No valid wallet connector found. Please reload the app.');
                  }
                } catch (err) {
                  handleWalletError(err);
                }
              }}
            >
              Connect Wallet
            </button>
          ) :
          (
            <p className="text-sm text-left">
              Wallet connection only via Warpcast
            </p>
          )
        )}
      </div>
    </div>
  );
}
