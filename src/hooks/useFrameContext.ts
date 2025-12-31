'use client';

import { useState, useEffect, useCallback } from 'react';
import sdk, { type Context } from '@farcaster/frame-sdk';

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
  context: Context.FrameContext | undefined;
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
  const [context, setContext] = useState<Context.FrameContext | undefined>(undefined);
  const [isInFrame, setIsInFrame] = useState(false);

  useEffect(() => {
    const initFrame = async () => {
      try {
        // Try to get the frame context
        const frameContext = await sdk.context;
        
        if (frameContext) {
          setContext(frameContext);
          setIsInFrame(true);
          console.log('Running in Farcaster frame:', frameContext);
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
      const result = await sdk.wallet.ethSendTransaction({
        to: params.to,
        value: params.value?.toString(16) ? `0x${params.value.toString(16)}` : undefined,
        data: params.data,
        chainId: params.chainId ? `eip155:${params.chainId}` : undefined,
      });

      if ('transactionHash' in result) {
        return result.transactionHash;
      }
      
      throw new Error('Transaction failed');
    } catch (error) {
      console.error('Frame transaction error:', error);
      throw error;
    }
  }, [isInFrame]);

  return {
    isInFrame,
    isLoading,
    frameAddress: context?.user?.connectedAddresses?.[0] as `0x${string}` | undefined,
    fid: context?.user?.fid,
    username: context?.user?.username,
    context,
    sendFrameTransaction,
    ready,
  };
}

