/**
 * Venice AI API Integration
 * @see https://docs.venice.ai/api-reference/api-spec
 */

import sharp from 'sharp';

export interface VeniceImageGenerationRequest {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg_scale?: number;
  seed?: number;
  negative_prompt?: string;
}

export interface VeniceImageGenerationResponse {
  images: Array<{
    base64: string;
    url?: string;
  }>;
  model: string;
  seed: number;
}

export interface VeniceError {
  error: {
    message: string;
    type: string;
    code: string;
  };
}

export interface ImageCompressionOptions {
  /** Target width (default: 128) */
  width?: number;
  /** Target height (default: 128) */
  height?: number;
  /** Output format: 'png' | 'jpeg' | 'webp' (default: 'png') */
  format?: 'png' | 'jpeg' | 'webp';
  /** Quality for lossy formats (1-100, default: 80) */
  quality?: number;
}

// Default model for image generation
export const DEFAULT_IMAGE_MODEL = 'fluently-xl';

// Venice API minimum size (64x64 not supported on OpenAI-compatible endpoint)
export const VENICE_MIN_SIZE = 256;

// Target size for onchain storage (we resize down after generation)
export const ONCHAIN_IMAGE_SIZE = 128;

/**
 * Generate an image using Venice AI API
 * @param request The image generation request
 * @param apiKey The Venice AI API key
 * @returns The generated image response
 */
export async function generateImage(
  request: VeniceImageGenerationRequest,
  apiKey: string
): Promise<VeniceImageGenerationResponse> {
  const url = 'https://api.venice.ai/api/v1/images/generations';

  // Venice API is OpenAI-compatible, so we use OpenAI's format
  // Convert width/height to size string (e.g., "256x256")
  // Note: Venice minimum is 256x256 - use generateOnchainImage for automatic compression
  const size = request.width && request.height 
    ? `${request.width}x${request.height}`
    : `${VENICE_MIN_SIZE}x${VENICE_MIN_SIZE}`;

  const body: Record<string, any> = {
    model: request.model || DEFAULT_IMAGE_MODEL,
    prompt: request.prompt,
    size: size,
    n: 1, // Number of images to generate
    response_format: 'b64_json',
  };

  // Venice may support some extended parameters, but only include them if provided
  // and only if they're likely to be supported (OpenAI doesn't support these)
  // Note: These may cause 400 errors if Venice doesn't support them
  if (request.seed !== undefined && request.seed !== null) {
    body.seed = request.seed;
  }
  
  // Steps, cfg_scale, and negative_prompt are not part of OpenAI format
  // Venice might support them, but they may cause errors
  // Only include if explicitly provided
  if (request.steps !== undefined && request.steps !== null) {
    body.steps = request.steps;
  }
  if (request.cfg_scale !== undefined && request.cfg_scale !== null) {
    body.cfg_scale = request.cfg_scale;
  }
  if (request.negative_prompt !== undefined && request.negative_prompt !== null) {
    body.negative_prompt = request.negative_prompt;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorMessage = `API request failed with status ${response.status}`;
    let errorCode = 'UNKNOWN_ERROR';
    
    try {
      const errorData = await response.json() as any;
      // Handle OpenAI-style errors
      if (errorData.error) {
        errorMessage = errorData.error.message || errorMessage;
        errorCode = errorData.error.code || errorData.error.type || errorCode;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // If response is not JSON, try to get text
      try {
        const text = await response.text();
        errorMessage = text || errorMessage;
      } catch {
        // Keep default error message
      }
    }
    
    throw new VeniceAPIError(errorMessage, response.status, errorCode);
  }

  const data = await response.json();
  
  // OpenAI/Venice format: data is an array of objects with b64_json or url
  // Transform the response to our expected format
  const images = Array.isArray(data.data) 
    ? data.data.map((item: { b64_json?: string; url?: string }) => ({
        base64: item.b64_json || '',
        url: item.url,
      }))
    : [];

  return {
    images: images,
    model: body.model,
    seed: data.seed || request.seed || 0,
  };
}

/**
 * Custom error class for Venice API errors
 */
export class VeniceAPIError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = 'VeniceAPIError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Validate a prompt for image generation
 * @param prompt The prompt to validate
 * @returns True if valid, throws error if invalid
 */
export function validatePrompt(prompt: string): boolean {
  if (prompt === null || prompt === undefined || typeof prompt !== 'string') {
    throw new Error('Prompt is required and must be a string');
  }

  const trimmed = prompt.trim();
  
  if (trimmed.length === 0) {
    throw new Error('Prompt cannot be empty');
  }

  if (trimmed.length > 1000) {
    throw new Error('Prompt must be 1000 characters or less');
  }

  return true;
}

/**
 * Check if the Venice API is available
 * @param apiKey The Venice AI API key
 * @returns True if the API is available
 */
export async function checkVeniceApiHealth(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.venice.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get available models from Venice AI
 * @param apiKey The Venice AI API key
 * @returns List of available models
 */
export async function getAvailableModels(apiKey: string): Promise<string[]> {
  const response = await fetch('https://api.venice.ai/api/v1/models', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new VeniceAPIError(
      'Failed to fetch models',
      response.status,
      'MODELS_FETCH_ERROR'
    );
  }

  const data = await response.json();
  
  // Handle different possible response formats
  // OpenAI format: { data: [...] }
  // Venice might return: { data: [...] } or just [...]
  const models = Array.isArray(data) ? data : (data.data || []);
  
  // Filter for image models - check various possible fields
  return models
    .filter((model: any) => {
      // Check if model has image-related type or capabilities
      const type = model.type || model.object || '';
      const id = (model.id || model.name || '').toLowerCase();
      
      // Include if explicitly marked as image type, or if id suggests image model
      return type === 'image' || 
             type === 'image-generation' ||
             id.includes('image') ||
             id.includes('dall') ||
             id.includes('fluently') ||
             id.includes('sd-');
    })
    .map((model: any) => model.id || model.name || '')
    .filter((id: string) => id.length > 0);
}

/**
 * Compress and resize a base64-encoded image
 * 
 * Venice AI minimum size is 256x256. This function allows you to:
 * 1. Resize to smaller dimensions (e.g., 128x128) for gas optimization
 * 2. Convert to more efficient formats (JPEG/WebP instead of PNG)
 * 3. Adjust quality for lossy formats
 * 
 * @param base64Image The base64-encoded input image (PNG from Venice)
 * @param options Compression options
 * @returns Base64-encoded compressed image
 * 
 * @example
 * // Resize to 128x128 PNG (default)
 * const small = await compressImage(base64Image);
 * 
 * @example
 * // Convert to 128x128 JPEG at 60% quality (much smaller)
 * const tiny = await compressImage(base64Image, { format: 'jpeg', quality: 60 });
 * 
 * @example
 * // Convert to 32x32 WebP (smallest)
 * const smallest = await compressImage(base64Image, { width: 32, height: 32, format: 'webp', quality: 50 });
 */
export async function compressImage(
  base64Image: string,
  options: ImageCompressionOptions = {}
): Promise<{ base64: string; format: string; sizeBytes: number }> {
  const {
    width = ONCHAIN_IMAGE_SIZE,
    height = ONCHAIN_IMAGE_SIZE,
    format = 'png',
    quality = 80,
  } = options;

  const inputBuffer = Buffer.from(base64Image, 'base64');
  
  let pipeline = sharp(inputBuffer).resize(width, height);

  let outputBuffer: Buffer;
  
  switch (format) {
    case 'jpeg':
      outputBuffer = await pipeline.jpeg({ quality }).toBuffer();
      break;
    case 'webp':
      outputBuffer = await pipeline.webp({ quality }).toBuffer();
      break;
    case 'png':
    default:
      outputBuffer = await pipeline.png({ compressionLevel: 9 }).toBuffer();
      break;
  }

  return {
    base64: outputBuffer.toString('base64'),
    format,
    sizeBytes: outputBuffer.length,
  };
}

/**
 * Generate an image optimized for onchain storage
 * 
 * This is a convenience wrapper that:
 * 1. Generates a 256x256 image from Venice (minimum supported)
 * 2. Resizes it to 128x128 (or custom size)
 * 3. Optionally converts to JPEG/WebP for smaller file size
 * 
 * @param request Image generation request
 * @param apiKey Venice API key
 * @param compression Compression options (default: 128x128 PNG)
 * @returns Compressed image response
 * 
 * @example
 * // Generate 128x128 PNG (default)
 * const result = await generateOnchainImage({ prompt: 'A dragon' }, apiKey);
 * 
 * @example
 * // Generate 128x128 JPEG for smaller gas costs
 * const result = await generateOnchainImage(
 *   { prompt: 'A dragon' },
 *   apiKey,
 *   { format: 'jpeg', quality: 70 }
 * );
 */
export async function generateOnchainImage(
  request: VeniceImageGenerationRequest,
  apiKey: string,
  compression: ImageCompressionOptions = {}
): Promise<VeniceImageGenerationResponse & { compressed: { base64: string; format: string; sizeBytes: number } }> {
  // Generate at Venice minimum size (256x256)
  const result = await generateImage(
    { ...request, width: VENICE_MIN_SIZE, height: VENICE_MIN_SIZE },
    apiKey
  );

  // Compress the first image
  const compressed = await compressImage(result.images[0].base64, compression);

  // Replace the original with compressed version
  return {
    ...result,
    images: [{ base64: compressed.base64, url: result.images[0].url }],
    compressed,
  };
}
