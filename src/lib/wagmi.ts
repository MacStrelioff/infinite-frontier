import { createConfig, http } from 'wagmi';
import { base, baseSepolia, hardhat } from 'wagmi/chains';
import { getDefaultConfig } from 'connectkit';

// WalletConnect project ID - get from https://cloud.walletconnect.com
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

export const config = createConfig(
  getDefaultConfig({
    // Required configuration
    chains: [base, baseSepolia, hardhat],
    transports: {
      [base.id]: http(),
      [baseSepolia.id]: http(),
      [hardhat.id]: http('http://127.0.0.1:8545'),
    },

    // Required API keys
    walletConnectProjectId,

    // App info
    appName: 'Infinite Frontier',
    appDescription: 'AI-Powered NFT Generation on Base',
    appUrl: 'https://infinite-frontier.xyz',
    appIcon: 'https://infinite-frontier.xyz/icon.png',
  })
);

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
