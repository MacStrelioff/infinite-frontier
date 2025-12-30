'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  getHighestBid, 
  getNFTDetails, 
  formatBidPrice, 
  getOpenSeaUrl,
  type OpenSeaOrder,
  type OpenSeaNFT,
  type ChainId,
  CHAIN_IDS,
} from '@/lib/opensea';

interface UseHighestBidResult {
  highestBid: OpenSeaOrder | null;
  formattedPrice: string | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch the highest bid for an NFT from OpenSea
 */
export function useHighestBid(
  contractAddress: string,
  tokenId: string,
  chain: ChainId = CHAIN_IDS.base
): UseHighestBidResult {
  const [highestBid, setHighestBid] = useState<OpenSeaOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBid = useCallback(async () => {
    if (!contractAddress || !tokenId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use API route to avoid exposing API key
      const response = await fetch(
        `/api/opensea/bid?contract=${contractAddress}&tokenId=${tokenId}&chain=${chain}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch bid');
      }

      const data = await response.json();
      setHighestBid(data.bid);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, tokenId, chain]);

  useEffect(() => {
    fetchBid();
  }, [fetchBid]);

  return {
    highestBid,
    formattedPrice: highestBid ? formatBidPrice(highestBid) : null,
    isLoading,
    error,
    refetch: fetchBid,
  };
}

interface UseNFTDetailsResult {
  nft: OpenSeaNFT | null;
  openSeaUrl: string;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch NFT details from OpenSea
 */
export function useNFTDetails(
  contractAddress: string,
  tokenId: string,
  chain: ChainId = CHAIN_IDS.base
): UseNFTDetailsResult {
  const [nft, setNft] = useState<OpenSeaNFT | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!contractAddress || !tokenId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/opensea/nft?contract=${contractAddress}&tokenId=${tokenId}&chain=${chain}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch NFT details');
      }

      const data = await response.json();
      setNft(data.nft);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, tokenId, chain]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return {
    nft,
    openSeaUrl: getOpenSeaUrl(contractAddress, tokenId, chain),
    isLoading,
    error,
    refetch: fetchDetails,
  };
}
