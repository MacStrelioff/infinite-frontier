/**
 * Script to test Venice AI image generation with a real API call
 * 
 * Usage: 
 *   VENICE_AI_API_KEY=your_key npx ts-node scripts/test-venice-api.ts
 */

import { generateImage, DEFAULT_IMAGE_MODEL } from '../src/lib/venice';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const apiKey = process.env.VENICE_AI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Error: VENICE_AI_API_KEY environment variable is required');
    console.log('\nUsage:');
    console.log('  VENICE_AI_API_KEY=your_key npx ts-node scripts/test-venice-api.ts');
    console.log('\nGet your API key from: https://venice.ai');
    process.exit(1);
  }

  console.log('🎨 Generating image with Venice AI...');
  console.log(`   Model: ${DEFAULT_IMAGE_MODEL}`);
  console.log('   Prompt: "A cosmic dragon flying through nebula clouds"');
  console.log('   Size: 256x256 (optimized for onchain storage)\n');

  try {
    const result = await generateImage(
      {
        prompt: 'A cosmic dragon flying through nebula clouds',
        width: 256,
        height: 256,
        steps: 20,
      },
      apiKey
    );

    if (result.images && result.images.length > 0) {
      const imageBase64 = result.images[0].base64;
      
      // Save the image to a file
      const outputPath = path.join(__dirname, '../generated-image.png');
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      fs.writeFileSync(outputPath, imageBuffer);
      
      console.log('✅ Image generated successfully!');
      console.log(`   Model used: ${result.model}`);
      console.log(`   Seed: ${result.seed}`);
      console.log(`   Image size: ${imageBuffer.length} bytes`);
      console.log(`   Saved to: ${outputPath}`);
      console.log(`\n   Base64 preview (first 100 chars):`);
      console.log(`   ${imageBase64.substring(0, 100)}...`);
    } else {
      console.error('❌ No image returned from API');
    }
  } catch (error) {
    console.error('❌ Error generating image:', error);
  }
}

main();
