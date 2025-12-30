'use client';

import { useEffect, useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { formatEther, decodeEventLog } from 'viem';
import { INFINITE_FRONTIER_ABI, CONTRACT_ADDRESSES, type SupportedChainId } from '@/lib/contracts';

interface MintButtonProps {
  prompt: string;
  imageBase64: string;
  aiModel: string;
  mintFee: bigint;
  chainId: SupportedChainId;
  onSuccess: (tokenId: number) => void;
  onMinting: () => void;
}

export function MintButton({
  prompt,
  imageBase64,
  aiModel,
  mintFee,
  chainId,
  onSuccess,
  onMinting,
}: MintButtonProps) {
  const [isMinting, setIsMinting] = useState(false);
  const publicClient = usePublicClient();
  const contractAddress = CONTRACT_ADDRESSES[chainId]?.infiniteFrontier;

  const { writeContract, data: txHash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Handle mint transaction
  const handleMint = async () => {
    if (!contractAddress) {
      console.error('Contract address not configured');
      return;
    }

    setIsMinting(true);
    onMinting();

    writeContract({
      address: contractAddress,
      abi: INFINITE_FRONTIER_ABI,
      functionName: 'mint',
      args: [prompt, imageBase64, aiModel],
      value: mintFee,
    });
  };

  // Handle successful mint
  useEffect(() => {
    if (isConfirmed && receipt) {
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
            onSuccess(tokenId);
          }
        } catch (err) {
          console.error('Failed to decode mint event:', err);
          // Fallback: still indicate success
          onSuccess(0);
        }
      } else {
        // Fallback if we can't find the event
        onSuccess(0);
      }
      
      setIsMinting(false);
    }
  }, [isConfirmed, receipt, onSuccess]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Mint error:', error);
      setIsMinting(false);
    }
  }, [error]);

  const isLoading = isPending || isConfirming || isMinting;

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
            <span>{isConfirming ? 'Confirming...' : 'Minting...'}</span>
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
      
      {error && (
        <p className="text-red-400 text-sm mt-2">
          {error.message.includes('User rejected') 
            ? 'Transaction cancelled' 
            : 'Failed to mint. Please try again.'}
        </p>
      )}
    </div>
  );
}
