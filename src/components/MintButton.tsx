'use client';

import { useEffect, useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { formatEther, decodeEventLog, encodeFunctionData } from 'viem';
import { INFINITE_FRONTIER_ABI, CONTRACT_ADDRESSES, type SupportedChainId } from '@/lib/contracts';

interface MintButtonProps {
  prompt: string;
  imageBase64: string;
  aiModel: string;
  mintFee: bigint;
  chainId: SupportedChainId;
  onSuccess: (tokenId: number, txHash?: string) => void;
  onMinting: () => void;
  /** Whether running in a Farcaster frame (Base app/Warpcast) */
  isInFrame?: boolean;
  /** Function to send transaction via Frame SDK */
  sendFrameTransaction?: (params: {
    to: `0x${string}`;
    value?: bigint;
    data?: `0x${string}`;
    chainId?: number;
  }) => Promise<string>;
}

export function MintButton({
  prompt,
  imageBase64,
  aiModel,
  mintFee,
  chainId,
  onSuccess,
  onMinting,
  isInFrame = false,
  sendFrameTransaction,
}: MintButtonProps) {
  const [isMinting, setIsMinting] = useState(false);
  const [frameError, setFrameError] = useState<string | null>(null);
  const publicClient = usePublicClient();
  const contractAddress = CONTRACT_ADDRESSES[chainId]?.infiniteFrontier;

  // Wagmi hooks for regular browser transactions
  const { writeContract, data: txHash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Handle mint transaction - Frame SDK or Wagmi
  const handleMint = async () => {
    if (!contractAddress) {
      console.error('Contract address not configured');
      return;
    }

    setIsMinting(true);
    setFrameError(null);
    onMinting();

    // Use Frame SDK if in frame, otherwise use Wagmi
    if (isInFrame && sendFrameTransaction) {
      try {
        // Encode the mint function call
        const data = encodeFunctionData({
          abi: INFINITE_FRONTIER_ABI,
          functionName: 'mint',
          args: [prompt, imageBase64, aiModel],
        });

        console.log('Sending frame transaction...');
        const frameTxHash = await sendFrameTransaction({
          to: contractAddress,
          value: mintFee,
          data: data as `0x${string}`,
          chainId: chainId,
        });

        console.log('Frame transaction sent:', frameTxHash);
        
        // Wait for confirmation using public client
        if (publicClient) {
          const txReceipt = await publicClient.waitForTransactionReceipt({
            hash: frameTxHash as `0x${string}`,
          });

          // Try to decode the token ID from the logs
          const mintEvent = txReceipt.logs.find((log) => {
            try {
              const decoded = decodeEventLog({
                abi: INFINITE_FRONTIER_ABI,
                data: log.data,
                topics: log.topics,
              });
              return decoded.eventName === 'NFTMinted';
            } catch {
              return false;
            }
          });

          if (mintEvent) {
            const decoded = decodeEventLog({
              abi: INFINITE_FRONTIER_ABI,
              data: mintEvent.data,
              topics: mintEvent.topics,
            });
            if (decoded.eventName === 'NFTMinted' && decoded.args) {
              const tokenId = Number((decoded.args as { tokenId: bigint }).tokenId);
              onSuccess(tokenId, frameTxHash);
              setIsMinting(false);
              return;
            }
          }
          
          // Fallback if we can't decode
          onSuccess(0, frameTxHash);
        } else {
          // No public client, just return success with hash
          onSuccess(0, frameTxHash);
        }
        
        setIsMinting(false);
      } catch (err) {
        console.error('Frame mint error:', err);
        setFrameError(err instanceof Error ? err.message : 'Transaction failed');
        setIsMinting(false);
      }
    } else {
      // Regular Wagmi transaction
      writeContract({
        address: contractAddress,
        abi: INFINITE_FRONTIER_ABI,
        functionName: 'mint',
        args: [prompt, imageBase64, aiModel],
        value: mintFee,
      });
    }
  };

  // Handle successful mint (Wagmi only - frame handled in handleMint)
  useEffect(() => {
    if (isConfirmed && receipt && !isInFrame) {
      // Find the NFTMinted event in the logs
      const mintEvent = receipt.logs.find((log) => {
        try {
          const decoded = decodeEventLog({
            abi: INFINITE_FRONTIER_ABI,
            data: log.data,
            topics: log.topics,
          });
          return decoded.eventName === 'NFTMinted';
        } catch {
          return false;
        }
      });

      if (mintEvent) {
        try {
          const decoded = decodeEventLog({
            abi: INFINITE_FRONTIER_ABI,
            data: mintEvent.data,
            topics: mintEvent.topics,
          });
          
          if (decoded.eventName === 'NFTMinted' && decoded.args) {
            const tokenId = Number((decoded.args as { tokenId: bigint }).tokenId);
            onSuccess(tokenId, txHash);
          }
        } catch (err) {
          console.error('Failed to decode mint event:', err);
          // Fallback: still indicate success
          onSuccess(0, txHash);
        }
      } else {
        // Fallback if we can't find the event
        onSuccess(0, txHash);
      }
      
      setIsMinting(false);
    }
  }, [isConfirmed, receipt, onSuccess, isInFrame, txHash]);

  // Handle errors (Wagmi)
  useEffect(() => {
    if (error && !isInFrame) {
      console.error('Mint error:', error);
      setIsMinting(false);
    }
  }, [error, isInFrame]);

  const isLoading = isPending || isConfirming || isMinting;
  const displayError = isInFrame ? frameError : error?.message;

  return (
    <div className="flex-1">
      <button
        onClick={handleMint}
        disabled={isLoading || !contractAddress}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="spinner" />
            <span>{isConfirming || (isInFrame && isMinting) ? 'Confirming...' : 'Minting...'}</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Mint NFT ({formatEther(mintFee)} ETH)</span>
          </>
        )}
      </button>
      
      {displayError && (
        <p className="text-red-400 text-sm mt-2">
          {displayError.includes('User rejected') || displayError.includes('rejected')
            ? 'Transaction cancelled' 
            : 'Failed to mint. Please try again.'}
        </p>
      )}
    </div>
  );
}
