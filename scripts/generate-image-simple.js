/**
 * Simple script to generate an image using Venice AI
 * Usage: node scripts/generate-image-simple.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function generateImage() {
  const apiKey = process.env.VENICE_AI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Error: VENICE_AI_API_KEY not set in .env file');
    process.exit(1);
  }

  const prompt = 'A cosmic dragon flying through nebula clouds, highly detailed, fantasy art';
  const url = 'https://api.venice.ai/api/v1/images/generations';

  console.log('🎨 Generating image with Venice AI...');
  console.log(`   Prompt: "${prompt}"`);
  console.log('   Size: 256x256 (minimum size supported by Venice AI)\n');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'fluently-xl',
        prompt: prompt,
        size: '256x256',
        n: 1,
        response_format: 'b64_json',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.data && data.data.length > 0 && data.data[0].b64_json) {
      const imageBase64 = data.data[0].b64_json;
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      
      const outputPath = path.join(__dirname, '..', 'test-generated-image.png');
      fs.writeFileSync(outputPath, imageBuffer);
      
      console.log('✅ Image generated successfully!');
      console.log(`   Model: ${data.model || 'fluently-xl'}`);
      console.log(`   Image size: ${imageBuffer.length} bytes`);
      console.log(`   Saved to: ${outputPath}`);
      console.log(`\n   Open the image with:`);
      console.log(`   open ${outputPath}`);
    } else {
      throw new Error('No image data in response');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

generateImage();

