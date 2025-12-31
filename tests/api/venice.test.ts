import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateImage,
  validatePrompt,
  VeniceAPIError,
  checkVeniceApiHealth,
  getAvailableModels,
  DEFAULT_IMAGE_MODEL,
  ONCHAIN_IMAGE_SIZE,
  VENICE_MIN_SIZE,
} from '../../src/lib/venice';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Venice AI API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validatePrompt', () => {
    it('should accept valid prompt', () => {
      expect(validatePrompt('A beautiful dragon')).toBe(true);
    });

    it('should accept prompt with max length', () => {
      const longPrompt = 'a'.repeat(1000);
      expect(validatePrompt(longPrompt)).toBe(true);
    });

    it('should reject empty string', () => {
      expect(() => validatePrompt('')).toThrow('Prompt cannot be empty');
    });

    it('should reject whitespace-only string', () => {
      expect(() => validatePrompt('   ')).toThrow('Prompt cannot be empty');
    });

    it('should reject null or undefined', () => {
      expect(() => validatePrompt(null as any)).toThrow('Prompt is required and must be a string');
      expect(() => validatePrompt(undefined as any)).toThrow('Prompt is required and must be a string');
    });

    it('should reject non-string types', () => {
      expect(() => validatePrompt(123 as any)).toThrow('Prompt is required and must be a string');
      expect(() => validatePrompt({} as any)).toThrow('Prompt is required and must be a string');
    });

    it('should reject prompt exceeding 1000 characters', () => {
      const tooLongPrompt = 'a'.repeat(1001);
      expect(() => validatePrompt(tooLongPrompt)).toThrow('Prompt must be 1000 characters or less');
    });
  });

  describe('generateImage', () => {
    const mockApiKey = 'test-api-key';
    const mockPrompt = 'A cosmic dragon';

    it('should generate image successfully', async () => {
      const mockResponse = {
        data: [
          { b64_json: 'base64ImageData' }
        ],
        seed: 12345,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await generateImage({ prompt: mockPrompt }, mockApiKey);

      expect(result.images).toHaveLength(1);
      expect(result.images[0].base64).toBe('base64ImageData');
      expect(result.model).toBe(DEFAULT_IMAGE_MODEL);
      expect(result.seed).toBe(12345);
    });

    it('should use default parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [{ b64_json: 'test' }] }),
      });

      await generateImage({ prompt: mockPrompt }, mockApiKey);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.venice.ai/api/v1/images/generations',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockApiKey}`,
          },
          body: expect.stringContaining(`"size":"${VENICE_MIN_SIZE}x${VENICE_MIN_SIZE}"`),
        })
      );
    });

    it('should use custom parameters when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [{ b64_json: 'test' }] }),
      });

      await generateImage({
        prompt: mockPrompt,
        width: 512,
        height: 512,
        steps: 30,
        cfg_scale: 8,
        model: 'custom-model',
      }, mockApiKey);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"size":"512x512"'),
        })
      );
    });

    it('should handle API error response', async () => {
      const errorResponse = {
        error: {
          message: 'Invalid API key',
          type: 'authentication_error',
          code: 'invalid_api_key',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(generateImage({ prompt: mockPrompt }, mockApiKey))
        .rejects
        .toThrow(VeniceAPIError);
    });

    it('should handle empty response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      const result = await generateImage({ prompt: mockPrompt }, mockApiKey);
      expect(result.images).toHaveLength(0);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(generateImage({ prompt: mockPrompt }, mockApiKey))
        .rejects
        .toThrow('Network error');
    });

    it('should not include negative prompt by default (OpenAI format)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [{ b64_json: 'test' }] }),
      });

      await generateImage({ prompt: mockPrompt }, mockApiKey);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      // OpenAI-compatible format doesn't include negative_prompt by default
      expect(callBody.negative_prompt).toBeUndefined();
    });

    it('should include custom negative prompt when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [{ b64_json: 'test' }] }),
      });

      await generateImage({
        prompt: mockPrompt,
        negative_prompt: 'custom negative',
      }, mockApiKey);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.negative_prompt).toBe('custom negative');
    });
  });

  describe('checkVeniceApiHealth', () => {
    const mockApiKey = 'test-api-key';

    it('should return true when API is healthy', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const result = await checkVeniceApiHealth(mockApiKey);
      expect(result).toBe(true);
    });

    it('should return false when API returns error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });

      const result = await checkVeniceApiHealth(mockApiKey);
      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await checkVeniceApiHealth(mockApiKey);
      expect(result).toBe(false);
    });

    it('should call correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await checkVeniceApiHealth(mockApiKey);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.venice.ai/api/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
          },
        })
      );
    });
  });

  describe('getAvailableModels', () => {
    const mockApiKey = 'test-api-key';

    it('should return image models', async () => {
      const mockModels = {
        data: [
          { id: 'fluently-xl', type: 'image' },
          { id: 'sd-xl', type: 'image' },
          { id: 'gpt-4', type: 'text' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModels),
      });

      const result = await getAvailableModels(mockApiKey);

      expect(result).toEqual(['fluently-xl', 'sd-xl']);
      expect(result).not.toContain('gpt-4');
    });

    it('should throw VeniceAPIError on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(getAvailableModels(mockApiKey))
        .rejects
        .toThrow(VeniceAPIError);
    });

    it('should return empty array when no models available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      const result = await getAvailableModels(mockApiKey);
      expect(result).toEqual([]);
    });
  });

  describe('VeniceAPIError', () => {
    it('should have correct properties', () => {
      const error = new VeniceAPIError('Test error', 400, 'TEST_ERROR');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('VeniceAPIError');
    });

    it('should be instance of Error', () => {
      const error = new VeniceAPIError('Test', 400, 'TEST');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('Constants', () => {
    it('should have correct default model', () => {
      expect(DEFAULT_IMAGE_MODEL).toBe('fluently-xl');
    });

    it('should have correct onchain image size', () => {
      // ONCHAIN_IMAGE_SIZE is the target size for compressed images (128x128)
      expect(ONCHAIN_IMAGE_SIZE).toBe(128);
      // VENICE_MIN_SIZE is the minimum the Venice API accepts (256x256)
      expect(VENICE_MIN_SIZE).toBe(256);
    });
  });
});
