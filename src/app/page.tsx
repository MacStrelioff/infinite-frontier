'use client';

import { useState, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { formatEther } from 'viem';
import { ImageGenerator } from '@/components/ImageGenerator';
import { GeneratedImage } from '@/components/GeneratedImage';
import { MintButton } from '@/components/MintButton';
import { NFTGallery } from '@/components/NFTGallery';
import { useInfiniteFrontier } from '@/hooks/useInfiniteFrontier';
import type { SupportedChainId } from '@/lib/contracts';

type AppState = 'idle' | 'generating' | 'generated' | 'minting' | 'minted';

interface GeneratedImageData {
  imageBase64: string;
  prompt: string;
  model: string;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId() as SupportedChainId;
  const [appState, setAppState] = useState<AppState>('idle');
  const [generatedImage, setGeneratedImage] = useState<GeneratedImageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null);

  const { 
    totalSupply, 
    generateFee, 
    mintFee, 
    currentGeneration,
    refetchSupply,
  } = useInfiniteFrontier(chainId);

  const handleGenerate = useCallback(async (prompt: string) => {
    setError(null);
    setAppState('generating');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate image');
      }

      const data = await response.json();
      setGeneratedImage({
        imageBase64: data.imageBase64,
        prompt: data.prompt,
        model: data.model,
      });
      setAppState('generated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
      setAppState('idle');
    }
  }, []);

  const handleMintSuccess = useCallback((tokenId: number) => {
    setMintedTokenId(tokenId);
    setAppState('minted');
    refetchSupply();
  }, [refetchSupply]);

  const handleReset = useCallback(() => {
    setGeneratedImage(null);
    setMintedTokenId(null);
    setError(null);
    setAppState('idle');
  }, []);

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-50 bg-frontier-dark/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-xl">∞</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Infinite Frontier</h1>
              <p className="text-xs text-white/50">{currentGeneration} • {totalSupply} minted</p>
            </div>
          </div>
          <ConnectKitButton />
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Create Unique AI Art
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Transform your imagination into onchain NFTs. Generate stunning AI images and mint them directly on Base.
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          {!isConnected ? (
            <div className="card text-center py-12">
              <h3 className="text-xl font-semibold mb-4">Connect Your Wallet</h3>
              <p className="text-white/60 mb-6">
                Connect your wallet to start generating and minting AI NFTs.
              </p>
              <ConnectKitButton />
            </div>
          ) : appState === 'idle' || appState === 'generating' ? (
            <div className="space-y-6">
              <ImageGenerator 
                onGenerate={handleGenerate}
                isGenerating={appState === 'generating'}
                generateFee={generateFee}
              />
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                  {error}
                </div>
              )}
            </div>
          ) : appState === 'generated' || appState === 'minting' ? (
            <div className="space-y-6 animate-fade-in">
              <GeneratedImage 
                imageBase64={generatedImage!.imageBase64}
                prompt={generatedImage!.prompt}
              />
              <div className="flex gap-4">
                <button
                  onClick={handleReset}
                  className="btn-secondary flex-1"
                  disabled={appState === 'minting'}
                >
                  Generate Another
                </button>
                <MintButton
                  prompt={generatedImage!.prompt}
                  imageBase64={generatedImage!.imageBase64}
                  aiModel={generatedImage!.model}
                  mintFee={mintFee}
                  chainId={chainId}
                  onSuccess={handleMintSuccess}
                  onMinting={() => setAppState('minting')}
                />
              </div>
            </div>
          ) : appState === 'minted' ? (
            <div className="card text-center py-12 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">NFT Minted!</h3>
              <p className="text-white/60 mb-6">
                Your NFT #{mintedTokenId} has been minted successfully.
              </p>
              <div className="flex gap-4 justify-center">
                <button onClick={handleReset} className="btn-primary">
                  Create Another
                </button>
                <a
                  href={`https://opensea.io/assets/base/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}/${mintedTokenId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  View on OpenSea
                </a>
              </div>
            </div>
          ) : null}
        </div>

        {/* Fee Info */}
        <div className="max-w-2xl mx-auto mt-8">
          <div className="grid grid-cols-2 gap-4 text-center text-sm">
            <div className="card py-4">
              <p className="text-white/50 mb-1">Generate Fee</p>
              <p className="font-semibold">{formatEther(generateFee)} ETH</p>
            </div>
            <div className="card py-4">
              <p className="text-white/50 mb-1">Mint Fee</p>
              <p className="font-semibold">{formatEther(mintFee)} ETH</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      {isConnected && address && (
        <section className="container mx-auto px-4 py-12 border-t border-white/10">
          <h3 className="text-2xl font-bold mb-6">Your Collection</h3>
          <NFTGallery address={address} chainId={chainId} />
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12">
        <div className="container mx-auto px-4 py-8 text-center text-white/40 text-sm">
          <p>Built on Base • Powered by Venice AI</p>
        </div>
      </footer>
    </main>
  );
}
