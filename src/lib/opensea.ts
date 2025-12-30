/**
 * OpenSea API Integration
 * @see https://docs.opensea.io/reference/api-overview
 */

export interface OpenSeaOrder {
  order_hash: string;
  price: {
    current: {
      value: string;
      decimals: number;
      currency: string;
    };
  };
  maker: {
    address: string;
  };
  created_date: string;
  expiration_date: string;
}

export interface OpenSeaNFT {
  identifier: string;
  collection: string;
  contract: string;
  token_standard: string;
  name: string;
  description: string;
  image_url: string;
  metadata_url: string;
  owners: Array<{ address: string; quantity: number }>;
}

export interface OpenSeaCollectionStats {
  total: {
    volume: number;
    sales: number;
    average_price: number;
    num_owners: number;
    market_cap: number;
    floor_price: number;
    floor_price_symbol: string;
  };
}

// OpenSea API base URLs
const OPENSEA_API_BASE = 'https://api.opensea.io/api/v2';
const OPENSEA_API_BASE_TESTNET = 'https://testnets-api.opensea.io/api/v2';

// Chain identifiers for OpenSea
export const CHAIN_IDS = {
  base: 'base',
  baseSepolia: 'base_sepolia',
} as const;

export type ChainId = typeof CHAIN_IDS[keyof typeof CHAIN_IDS];

/**
 * Get the OpenSea API base URL based on chain
 */
function getApiBase(chain: ChainId): string {
  return chain === CHAIN_IDS.baseSepolia ? OPENSEA_API_BASE_TESTNET : OPENSEA_API_BASE;
}

/**
 * Fetch the highest bid for an NFT
 * @param contractAddress The NFT contract address
 * @param tokenId The token ID
 * @param chain The chain identifier
 * @param apiKey The OpenSea API key (optional for some endpoints)
 */
export async function getHighestBid(
  contractAddress: string,
  tokenId: string,
  chain: ChainId = CHAIN_IDS.base,
  apiKey?: string
): Promise<OpenSeaOrder | null> {
  const baseUrl = getApiBase(chain);
  const url = `${baseUrl}/orders/${chain}/seaport/offers?asset_contract_address=${contractAddress}&token_ids=${tokenId}&order_by=eth_price&order_direction=desc&limit=1`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (apiKey) {
    headers['X-API-KEY'] = apiKey;
  }

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No bids found
      }
      throw new OpenSeaAPIError(
        `Failed to fetch bids: ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    const orders = data.orders || [];

    if (orders.length === 0) {
      return null;
    }

    return orders[0];
  } catch (error) {
    if (error instanceof OpenSeaAPIError) {
      throw error;
    }
    throw new OpenSeaAPIError(
      `Network error fetching bids: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0
    );
  }
}

/**
 * Get NFT details from OpenSea
 * @param contractAddress The NFT contract address
 * @param tokenId The token ID
 * @param chain The chain identifier
 * @param apiKey The OpenSea API key
 */
export async function getNFTDetails(
  contractAddress: string,
  tokenId: string,
  chain: ChainId = CHAIN_IDS.base,
  apiKey?: string
): Promise<OpenSeaNFT | null> {
  const baseUrl = getApiBase(chain);
  const url = `${baseUrl}/chain/${chain}/contract/${contractAddress}/nfts/${tokenId}`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (apiKey) {
    headers['X-API-KEY'] = apiKey;
  }

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new OpenSeaAPIError(
        `Failed to fetch NFT details: ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    return data.nft;
  } catch (error) {
    if (error instanceof OpenSeaAPIError) {
      throw error;
    }
    throw new OpenSeaAPIError(
      `Network error fetching NFT: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0
    );
  }
}

/**
 * Get collection stats from OpenSea
 * @param collectionSlug The collection slug
 * @param apiKey The OpenSea API key
 */
export async function getCollectionStats(
  collectionSlug: string,
  apiKey?: string
): Promise<OpenSeaCollectionStats | null> {
  const url = `${OPENSEA_API_BASE}/collections/${collectionSlug}/stats`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (apiKey) {
    headers['X-API-KEY'] = apiKey;
  }

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new OpenSeaAPIError(
        `Failed to fetch collection stats: ${response.statusText}`,
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof OpenSeaAPIError) {
      throw error;
    }
    throw new OpenSeaAPIError(
      `Network error fetching stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0
    );
  }
}

/**
 * Format bid price to human readable format
 * @param order The OpenSea order
 * @returns Formatted price string
 */
export function formatBidPrice(order: OpenSeaOrder): string {
  const value = BigInt(order.price.current.value);
  const decimals = order.price.current.decimals;
  const divisor = BigInt(10 ** decimals);
  
  const wholePart = value / divisor;
  const fractionalPart = value % divisor;
  
  // Format with up to 6 decimal places
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0').slice(0, 6);
  
  return `${wholePart}.${fractionalStr} ${order.price.current.currency}`;
}

/**
 * Build OpenSea URL for an NFT
 * @param contractAddress The contract address
 * @param tokenId The token ID
 * @param chain The chain identifier
 */
export function getOpenSeaUrl(
  contractAddress: string,
  tokenId: string,
  chain: ChainId = CHAIN_IDS.base
): string {
  const baseUrl = chain === CHAIN_IDS.baseSepolia 
    ? 'https://testnets.opensea.io' 
    : 'https://opensea.io';
  
  return `${baseUrl}/assets/${chain}/${contractAddress}/${tokenId}`;
}

/**
 * Custom error class for OpenSea API errors
 */
export class OpenSeaAPIError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'OpenSeaAPIError';
    this.statusCode = statusCode;
  }
}
