'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { INFINITE_FRONTIER_ABI, CONTRACT_ADDRESSES, FEES, type SupportedChainId } from '@/lib/contracts';

/**
 * Hook to interact with the InfiniteFrontier contract
 */
export function useInfiniteFrontier(chainId: SupportedChainId = 8453) {
  const contractAddress = CONTRACT_ADDRESSES[chainId]?.infiniteFrontier;

  // Read total supply
  const { data: totalSupply, refetch: refetchSupply } = useReadContract({
    address: contractAddress,
    abi: INFINITE_FRONTIER_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: !!contractAddress,
    },
  });

  // Read generate fee
  const { data: generateFee } = useReadContract({
    address: contractAddress,
    abi: INFINITE_FRONTIER_ABI,
    functionName: 'generateFee',
    query: {
      enabled: !!contractAddress,
    },
  });

  // Read mint fee
  const { data: mintFee } = useReadContract({
    address: contractAddress,
    abi: INFINITE_FRONTIER_ABI,
    functionName: 'mintFee',
    query: {
      enabled: !!contractAddress,
    },
  });

  // Read current generation
  const { data: currentGeneration } = useReadContract({
    address: contractAddress,
    abi: INFINITE_FRONTIER_ABI,
    functionName: 'currentGeneration',
    query: {
      enabled: !!contractAddress,
    },
  });

  // Write contract hook
  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  /**
   * Pay the generate fee for image generation
   */
  const payGenerateFee = async (prompt: string) => {
    if (!contractAddress) throw new Error('Contract address not configured');
    
    writeContract({
      address: contractAddress,
      abi: INFINITE_FRONTIER_ABI,
      functionName: 'payGenerateFee',
      args: [prompt],
      value: generateFee ?? FEES.generate,
    });
  };

  /**
   * Mint an NFT with the generated image
   */
  const mint = async (prompt: string, imageBase64: string, aiModel: string) => {
    if (!contractAddress) throw new Error('Contract address not configured');

    writeContract({
      address: contractAddress,
      abi: INFINITE_FRONTIER_ABI,
      functionName: 'mint',
      args: [prompt, imageBase64, aiModel],
      value: mintFee ?? FEES.mint,
    });
  };

  return {
    // Contract data
    contractAddress,
    totalSupply: totalSupply ? Number(totalSupply) : 0,
    generateFee: generateFee ?? FEES.generate,
    mintFee: mintFee ?? FEES.mint,
    currentGeneration: currentGeneration ?? 'V0',
    
    // Actions
    payGenerateFee,
    mint,
    refetchSupply,
    
    // Transaction state
    txHash,
    isPending,
    isConfirming,
    isConfirmed,
    error: writeError,
  };
}

/**
 * Hook to read token data
 */
export function useTokenData(tokenId: number, chainId: SupportedChainId = 8453) {
  const contractAddress = CONTRACT_ADDRESSES[chainId]?.infiniteFrontier;

  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress,
    abi: INFINITE_FRONTIER_ABI,
    functionName: 'getTokenData',
    args: [BigInt(tokenId)],
    query: {
      enabled: !!contractAddress && tokenId > 0,
    },
  });

  return {
    tokenData: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to read token URI
 */
export function useTokenURI(tokenId: number, chainId: SupportedChainId = 8453) {
  const contractAddress = CONTRACT_ADDRESSES[chainId]?.infiniteFrontier;

  const { data, isLoading, error } = useReadContract({
    address: contractAddress,
    abi: INFINITE_FRONTIER_ABI,
    functionName: 'tokenURI',
    args: [BigInt(tokenId)],
    query: {
      enabled: !!contractAddress && tokenId > 0,
    },
  });

  return {
    tokenURI: data,
    isLoading,
    error,
  };
}

/**
 * Hook to get user's NFT balance
 */
export function useUserBalance(address: `0x${string}` | undefined, chainId: SupportedChainId = 8453) {
  const contractAddress = CONTRACT_ADDRESSES[chainId]?.infiniteFrontier;

  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress,
    abi: INFINITE_FRONTIER_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!contractAddress && !!address,
    },
  });

  return {
    balance: data ? Number(data) : 0,
    isLoading,
    error,
    refetch,
  };
}
