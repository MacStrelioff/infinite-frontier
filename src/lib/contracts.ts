/**
 * Contract configuration and ABI exports
 */

// Contract addresses by chain
export const CONTRACT_ADDRESSES = {
  // Base Mainnet
  8453: {
    infiniteFrontier: '0x0000000000000000000000000000000000000000' as `0x${string}`, // Deploy and update
  },
  // Base Sepolia (testnet)
  84532: {
    infiniteFrontier: '0x0000000000000000000000000000000000000000' as `0x${string}`, // Deploy and update
  },
  // Local hardhat
  31337: {
    infiniteFrontier: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as `0x${string}`, // Default hardhat deployment address
  },
} as const;

// Fee amounts in Wei
export const FEES = {
  generate: BigInt('30000000000000'), // 0.00003 ETH
  mint: BigInt('300000000000000'), // 0.0003 ETH
} as const;

// Infinite Frontier Contract ABI
export const INFINITE_FRONTIER_ABI = [
  // Read functions
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'generateFee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'mintFee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'currentGeneration',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCurrentTokenId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'getTokenData',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'prompt', type: 'string' },
          { internalType: 'string', name: 'imageBase64', type: 'string' },
          { internalType: 'string', name: 'generation', type: 'string' },
          { internalType: 'string', name: 'nftType', type: 'string' },
          { internalType: 'address', name: 'minter', type: 'address' },
          { internalType: 'string', name: 'aiModel', type: 'string' },
          { internalType: 'uint256', name: 'mintedAt', type: 'uint256' },
        ],
        internalType: 'struct InfiniteFrontier.TokenData',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Write functions
  {
    inputs: [{ internalType: 'string', name: 'prompt', type: 'string' }],
    name: 'payGenerateFee',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'prompt', type: 'string' },
      { internalType: 'string', name: 'imageBase64', type: 'string' },
      { internalType: 'string', name: 'aiModel', type: 'string' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'fee', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'prompt', type: 'string' },
    ],
    name: 'ImageGenerated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'minter', type: 'address' },
      { indexed: false, internalType: 'string', name: 'prompt', type: 'string' },
      { indexed: false, internalType: 'string', name: 'generation', type: 'string' },
    ],
    name: 'NFTMinted',
    type: 'event',
  },
  // Errors
  {
    inputs: [
      { internalType: 'uint256', name: 'sent', type: 'uint256' },
      { internalType: 'uint256', name: 'required', type: 'uint256' },
    ],
    name: 'InsufficientGenerateFee',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'sent', type: 'uint256' },
      { internalType: 'uint256', name: 'required', type: 'uint256' },
    ],
    name: 'InsufficientMintFee',
    type: 'error',
  },
  {
    inputs: [],
    name: 'EmptyPrompt',
    type: 'error',
  },
  {
    inputs: [],
    name: 'EmptyImage',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'TokenDoesNotExist',
    type: 'error',
  },
] as const;

export type ContractAddresses = typeof CONTRACT_ADDRESSES;
export type SupportedChainId = keyof ContractAddresses;
