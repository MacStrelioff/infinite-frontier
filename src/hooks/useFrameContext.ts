'use client';

import { useState, useEffect, useCallback } from 'react';
import sdk, { type Context } from '@farcaster/frame-sdk';

type MiniAppContext = Context.MiniAppContext;

interface FrameContextState {
  /** Whether we're running inside a Farcaster frame (Base app/Warpcast) */
  isInFrame: boolean;
  /** Whether the frame context is still loading */
  isLoading: boolean;
  /** The user's connected wallet address (if in frame) */
  frameAddress: `0x${string}` | undefined;
  /** The user's Farcaster ID */
  fid: number | undefined;
  /** The user's Farcaster username */
  username: string | undefined;
  /** The full frame context */
  context: MiniAppContext | undefined;
  /** Send a transaction using the frame SDK */
  sendFrameTransaction: (params: {
    to: `0x${string}`;
    value?: bigint;
    data?: `0x${string}`;
    chainId?: number;
  }) => Promise<string>;
  /** Signal that the app is ready */
  ready: () => void;
}

/**
 * Hook to interact with the Farcaster Frame SDK
 * Provides seamless wallet connection when running inside Base app or Warpcast
 */
export function useFrameContext(): FrameContextState {
  const [isLoading, setIsLoading] = useState(true);
  const [context, setContext] = useState<MiniAppContext | undefined>(undefined);
  const [isInFrame, setIsInFrame] = useState(false);
  const [frameAddress, setFrameAddress] = useState<`0x${string}` | undefined>(undefined);

  useEffect(() => {
    const initFrame = async () => {
      try {
        // Check if we're in a mini app
        const inMiniApp = await sdk.isInMiniApp();
        
        if (inMiniApp) {
          // Get the frame context
          const frameContext = await sdk.context;
          setContext(frameContext);
          setIsInFrame(true);
          console.log('Running in Farcaster frame:', frameContext);
          
          // Try to get the wallet address from the provider
          try {
            const provider = sdk.wallet.ethProvider;
            const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
            if (accounts && accounts.length > 0) {
              setFrameAddress(accounts[0] as `0x${string}`);
            }
          } catch (walletError) {
            console.log('Could not get wallet address:', walletError);
          }
        } else {
          console.log('Not running in a Farcaster frame');
          setIsInFrame(false);
        }
      } catch (error) {
        console.log('Frame SDK not available:', error);
        setIsInFrame(false);
      } finally {
        setIsLoading(false);
      }
    };

    initFrame();
  }, []);

  const ready = useCallback(() => {
    if (isInFrame) {
      sdk.actions.ready();
    }
  }, [isInFrame]);

  const sendFrameTransaction = useCallback(async (params: {
    to: `0x${string}`;
    value?: bigint;
    data?: `0x${string}`;
    chainId?: number;
  }): Promise<string> => {
    if (!isInFrame) {
      throw new Error('Not in a Farcaster frame');
    }

    try {
      const provider = sdk.wallet.ethProvider;
      
      // Build the transaction request
      const txParams: {
        to: `0x${string}`;
        value?: `0x${string}`;
        data?: `0x${string}`;
      } = {
        to: params.to,
        data: params.data,
      };
      
      if (params.value) {
        txParams.value = `0x${params.value.toString(16)}` as `0x${string}`;
      }
      
      // Use eth_sendTransaction via the provider
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      }) as string;
      
      return txHash;
    } catch (error) {
      console.error('Frame transaction error:', error);
      throw error;
    }
  }, [isInFrame]);

  return {
    isInFrame,
    isLoading,
    frameAddress,
    fid: context?.user?.fid,
    username: context?.user?.username,
    context,
    sendFrameTransaction,
    ready,
  };
}

