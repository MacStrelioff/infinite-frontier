/**
 * Script to generate a test image using Venice AI and save it
 * 
 * Usage: 
 *   npx ts-node scripts/generate-test-image.ts
 */

import { config } from 'dotenv';
import { generateImage, DEFAULT_IMAGE_MODEL } from '../src/lib/venice.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config();

async function main() {
  const apiKey = process.env.VENICE_AI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Error: VENICE_AI_API_KEY environment variable is required');
    console.log('\nMake sure you have VENICE_AI_API_KEY set in your .env file');
    process.exit(1);
  }

  const prompt = 'A cosmic dragon flying through nebula clouds, highly detailed, fantasy art';
  
  console.log('🎨 Generating image with Venice AI...');
  console.log(`   Model: ${DEFAULT_IMAGE_MODEL}`);
  console.log(`   Prompt: "${prompt}"`);
  console.log('   Size: 256x256 (minimum size supported by Venice AI)\n');

  try {
    const result = await generateImage(
      {
        prompt,
        width: 256,
        height: 256,
      },
      apiKey
    );

    if (result.images && result.images.length > 0) {
      const imageBase64 = result.images[0].base64;
      
      // Save the image to a file
      const outputDir = path.join(__dirname, '..');
      const outputPath = path.join(outputDir, 'test-generated-image.png');
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      fs.writeFileSync(outputPath, imageBuffer);
      
      console.log('✅ Image generated successfully!');
      console.log(`   Model used: ${result.model}`);
      console.log(`   Seed: ${result.seed}`);
      console.log(`   Image size: ${imageBuffer.length} bytes`);
      console.log(`   Saved to: ${outputPath}`);
      console.log(`\n   You can view the image at: ${outputPath}`);
      console.log(`   Or open it with: open ${outputPath}`);
    } else {
      console.error('❌ No image returned from API');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error generating image:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  }
}

main();

