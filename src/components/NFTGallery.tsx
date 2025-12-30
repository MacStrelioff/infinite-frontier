'use client';

import { useUserBalance, useTokenData } from '@/hooks/useInfiniteFrontier';
import { useHighestBid } from '@/hooks/useOpenSea';
import { CONTRACT_ADDRESSES, type SupportedChainId } from '@/lib/contracts';
import { getOpenSeaUrl, CHAIN_IDS } from '@/lib/opensea';

interface NFTGalleryProps {
  address: `0x${string}`;
  chainId: SupportedChainId;
}

export function NFTGallery({ address, chainId }: NFTGalleryProps) {
  const { balance, isLoading } = useUserBalance(address, chainId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner" />
      </div>
    );
  }

  if (balance === 0) {
    return (
      <div className="text-center py-12 text-white/50">
        <p>You haven&apos;t minted any NFTs yet.</p>
        <p className="text-sm mt-2">Generate an image above to get started!</p>
      </div>
    );
  }

  // For V0, we'll show a simplified gallery
  // In production, you'd query the actual token IDs owned by the user
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: balance }).map((_, index) => (
        <NFTCard key={index} tokenId={index + 1} chainId={chainId} />
      ))}
    </div>
  );
}

interface NFTCardProps {
  tokenId: number;
  chainId: SupportedChainId;
}

function NFTCard({ tokenId, chainId }: NFTCardProps) {
  const { tokenData, isLoading: isLoadingToken } = useTokenData(tokenId, chainId);
  const contractAddress = CONTRACT_ADDRESSES[chainId]?.infiniteFrontier;
  const openSeaChain = chainId === 84532 ? CHAIN_IDS.baseSepolia : CHAIN_IDS.base;
  
  const { formattedPrice, isLoading: isLoadingBid } = useHighestBid(
    contractAddress ?? '',
    tokenId.toString(),
    openSeaChain
  );

  if (isLoadingToken) {
    return (
      <div className="card animate-pulse">
        <div className="aspect-square bg-white/10 rounded-lg" />
        <div className="mt-3 h-4 bg-white/10 rounded w-3/4" />
      </div>
    );
  }

  if (!tokenData) {
    return null;
  }

  const openSeaUrl = getOpenSeaUrl(contractAddress ?? '', tokenId.toString(), openSeaChain);

  return (
    <a
      href={openSeaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="card group hover:border-indigo-500/50 transition-all glow-hover"
    >
      <div className="aspect-square rounded-lg overflow-hidden bg-white/5">
        <img
          src={`data:image/png;base64,${tokenData.imageBase64}`}
          alt={`Infinite Frontier #${tokenId}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="mt-3">
        <h4 className="font-semibold text-sm">#{tokenId}</h4>
        <p className="text-xs text-white/50 truncate mt-1" title={tokenData.prompt}>
          {tokenData.prompt}
        </p>
        {formattedPrice && (
          <p className="text-xs text-indigo-400 mt-2">
            Highest bid: {formattedPrice}
          </p>
        )}
      </div>
    </a>
  );
}
