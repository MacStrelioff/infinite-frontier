import { NextRequest, NextResponse } from 'next/server';
import { generateImage, compressImage, validatePrompt, VENICE_MIN_SIZE, ONCHAIN_IMAGE_SIZE, VeniceAPIError } from '@/lib/venice';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    // Validate prompt
    try {
      validatePrompt(prompt);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Invalid prompt' },
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.VENICE_AI_API_KEY;
    if (!apiKey) {
      console.error('VENICE_AI_API_KEY not configured');
      return NextResponse.json(
        { error: 'Image generation service not configured' },
        { status: 500 }
      );
    }

    // Generate image using Venice AI at minimum size (256x256)
    const result = await generateImage(
      {
        prompt,
        width: VENICE_MIN_SIZE,
        height: VENICE_MIN_SIZE,
        steps: 20,
        cfg_scale: 7,
      },
      apiKey
    );

    if (!result.images || result.images.length === 0) {
      return NextResponse.json(
        { error: 'No image generated' },
        { status: 500 }
      );
    }

    // Compress image to 128x128 JPEG for efficient onchain storage
    const compressed = await compressImage(result.images[0].base64, {
      width: ONCHAIN_IMAGE_SIZE,
      height: ONCHAIN_IMAGE_SIZE,
      format: 'jpeg',
      quality: 70,
    });

    return NextResponse.json({
      imageBase64: compressed.base64,
      prompt,
      model: result.model,
      seed: result.seed,
      compressed: {
        format: compressed.format,
        sizeBytes: compressed.sizeBytes,
      },
    });
  } catch (error) {
    console.error('Image generation error:', error);

    if (error instanceof VeniceAPIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
