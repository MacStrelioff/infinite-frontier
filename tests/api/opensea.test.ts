import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getHighestBid,
  getNFTDetails,
  getCollectionStats,
  formatBidPrice,
  getOpenSeaUrl,
  OpenSeaAPIError,
  CHAIN_IDS,
  type OpenSeaOrder,
} from '../../src/lib/opensea';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('OpenSea API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getHighestBid', () => {
    const contractAddress = '0x1234567890123456789012345678901234567890';
    const tokenId = '1';

    it('should fetch highest bid successfully', async () => {
      const mockOrder: OpenSeaOrder = {
        order_hash: '0xabc123',
        price: {
          current: {
            value: '1000000000000000000',
            decimals: 18,
            currency: 'ETH',
          },
        },
        maker: {
          address: '0xbidder',
        },
        created_date: '2024-01-01T00:00:00Z',
        expiration_date: '2024-12-31T23:59:59Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ orders: [mockOrder] }),
      });

      const result = await getHighestBid(contractAddress, tokenId);

      expect(result).toEqual(mockOrder);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`asset_contract_address=${contractAddress}`),
        expect.any(Object)
      );
    });

    it('should return null when no bids found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ orders: [] }),
      });

      const result = await getHighestBid(contractAddress, tokenId);
      expect(result).toBeNull();
    });

    it('should return null for 404 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await getHighestBid(contractAddress, tokenId);
      expect(result).toBeNull();
    });

    it('should throw OpenSeaAPIError on other errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(getHighestBid(contractAddress, tokenId))
        .rejects
        .toThrow(OpenSeaAPIError);
    });

    it('should use correct chain for base', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ orders: [] }),
      });

      await getHighestBid(contractAddress, tokenId, CHAIN_IDS.base);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api.opensea.io'),
        expect.any(Object)
      );
    });

    it('should use correct chain for base sepolia', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ orders: [] }),
      });

      await getHighestBid(contractAddress, tokenId, CHAIN_IDS.baseSepolia);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('testnets-api.opensea.io'),
        expect.any(Object)
      );
    });

    it('should include API key when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ orders: [] }),
      });

      await getHighestBid(contractAddress, tokenId, CHAIN_IDS.base, 'test-api-key');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-KEY': 'test-api-key',
          }),
        })
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(getHighestBid(contractAddress, tokenId))
        .rejects
        .toThrow(OpenSeaAPIError);
    });
  });

  describe('getNFTDetails', () => {
    const contractAddress = '0x1234567890123456789012345678901234567890';
    const tokenId = '1';

    it('should fetch NFT details successfully', async () => {
      const mockNFT = {
        identifier: '1',
        collection: 'infinite-frontier',
        contract: contractAddress,
        token_standard: 'erc721',
        name: 'Infinite Frontier #1',
        description: 'Test NFT',
        image_url: 'https://example.com/image.png',
        metadata_url: 'https://example.com/metadata.json',
        owners: [{ address: '0xowner', quantity: 1 }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ nft: mockNFT }),
      });

      const result = await getNFTDetails(contractAddress, tokenId);

      expect(result).toEqual(mockNFT);
    });

    it('should return null for 404 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await getNFTDetails(contractAddress, tokenId);
      expect(result).toBeNull();
    });

    it('should throw OpenSeaAPIError on other errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(getNFTDetails(contractAddress, tokenId))
        .rejects
        .toThrow(OpenSeaAPIError);
    });
  });

  describe('getCollectionStats', () => {
    const collectionSlug = 'infinite-frontier';

    it('should fetch collection stats successfully', async () => {
      const mockStats = {
        total: {
          volume: 100,
          sales: 50,
          average_price: 2,
          num_owners: 30,
          market_cap: 500,
          floor_price: 0.1,
          floor_price_symbol: 'ETH',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
      });

      const result = await getCollectionStats(collectionSlug);

      expect(result).toEqual(mockStats);
    });

    it('should return null for 404 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await getCollectionStats(collectionSlug);
      expect(result).toBeNull();
    });
  });

  describe('formatBidPrice', () => {
    it('should format whole ETH amount correctly', () => {
      const order: OpenSeaOrder = {
        order_hash: '0x123',
        price: {
          current: {
            value: '1000000000000000000',
            decimals: 18,
            currency: 'ETH',
          },
        },
        maker: { address: '0x123' },
        created_date: '',
        expiration_date: '',
      };

      expect(formatBidPrice(order)).toBe('1.000000 ETH');
    });

    it('should format fractional ETH amount correctly', () => {
      const order: OpenSeaOrder = {
        order_hash: '0x123',
        price: {
          current: {
            value: '500000000000000000',
            decimals: 18,
            currency: 'ETH',
          },
        },
        maker: { address: '0x123' },
        created_date: '',
        expiration_date: '',
      };

      expect(formatBidPrice(order)).toBe('0.500000 ETH');
    });

    it('should format small amounts correctly', () => {
      const order: OpenSeaOrder = {
        order_hash: '0x123',
        price: {
          current: {
            value: '300000000000000',
            decimals: 18,
            currency: 'ETH',
          },
        },
        maker: { address: '0x123' },
        created_date: '',
        expiration_date: '',
      };

      expect(formatBidPrice(order)).toBe('0.000300 ETH');
    });

    it('should handle WETH currency', () => {
      const order: OpenSeaOrder = {
        order_hash: '0x123',
        price: {
          current: {
            value: '1000000000000000000',
            decimals: 18,
            currency: 'WETH',
          },
        },
        maker: { address: '0x123' },
        created_date: '',
        expiration_date: '',
      };

      expect(formatBidPrice(order)).toBe('1.000000 WETH');
    });
  });

  describe('getOpenSeaUrl', () => {
    const contractAddress = '0x1234567890123456789012345678901234567890';
    const tokenId = '1';

    it('should generate correct URL for base mainnet', () => {
      const url = getOpenSeaUrl(contractAddress, tokenId, CHAIN_IDS.base);
      expect(url).toBe(`https://opensea.io/assets/base/${contractAddress}/${tokenId}`);
    });

    it('should generate correct URL for base sepolia', () => {
      const url = getOpenSeaUrl(contractAddress, tokenId, CHAIN_IDS.baseSepolia);
      expect(url).toBe(`https://testnets.opensea.io/assets/base_sepolia/${contractAddress}/${tokenId}`);
    });

    it('should default to base mainnet', () => {
      const url = getOpenSeaUrl(contractAddress, tokenId);
      expect(url).toContain('opensea.io');
      expect(url).toContain('/base/');
    });
  });

  describe('OpenSeaAPIError', () => {
    it('should have correct properties', () => {
      const error = new OpenSeaAPIError('Test error', 400);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('OpenSeaAPIError');
    });

    it('should be instance of Error', () => {
      const error = new OpenSeaAPIError('Test', 400);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('CHAIN_IDS', () => {
    it('should have correct chain identifiers', () => {
      expect(CHAIN_IDS.base).toBe('base');
      expect(CHAIN_IDS.baseSepolia).toBe('base_sepolia');
    });
  });
});
