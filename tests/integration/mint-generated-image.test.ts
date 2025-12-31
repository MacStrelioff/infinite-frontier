/**
 * End-to-end integration test: Generate image with Venice AI and mint as NFT
 * 
 * This test demonstrates:
 * 1. Venice AI image generation works correctly
 * 2. NFT minting with images works on-chain
 * 
 * IMPORTANT: Venice AI minimum size is 256x256, which produces images ~60KB+
 * Storing such large images fully on-chain is impractical due to gas costs.
 * For production, store images on IPFS and only the CID on-chain.
 * 
 * Requirements:
 * - VENICE_AI_API_KEY must be set in .env
 * 
 * Run with: npm run test:integration
 */

import { expect } from 'chai';
import hre from 'hardhat';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Output directory for generated images (same folder as this test)
const __filename = fileURLToPath(import.meta.url);
const OUTPUT_DIR = path.dirname(__filename);

// Inline Venice AI API call to avoid ESM/CommonJS issues
async function generateImageWithVenice(prompt: string, apiKey: string, width = 256, height = 256) {
  const url = 'https://api.venice.ai/api/v1/images/generations';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'fluently-xl',
      prompt: prompt,
      size: `${width}x${height}`,
      n: 1,
      response_format: 'b64_json',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Venice API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.data || data.data.length === 0 || !data.data[0].b64_json) {
    throw new Error('No image data in response');
  }

  return {
    images: [{ base64: data.data[0].b64_json }],
    model: 'fluently-xl',
    seed: data.seed || 0,
  };
}

// Tiny 1x1 red pixel PNG for testing contract functionality without gas issues
const TINY_TEST_IMAGE = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

const ethers = hre.ethers;
const MINT_FEE = ethers.parseEther('0.0003');

describe('End-to-End: Generate Image and Mint NFT', function () {
  let contract: any;
  let owner: any;
  let user: any;
  const API_KEY = process.env.VENICE_AI_API_KEY;

  // Skip all tests if API key is not set
  if (!API_KEY) {
    console.warn('⚠️  VENICE_AI_API_KEY not set. Skipping end-to-end tests.');
    return;
  }

  before(async function () {
    // Deploy contract
    const [deployer, testUser] = await ethers.getSigners();
    owner = deployer;
    user = testUser;

    const InfiniteFrontierFactory = await ethers.getContractFactory('InfiniteFrontier');
    contract = await InfiniteFrontierFactory.deploy();
    await contract.waitForDeployment();

    console.log('✅ Contract deployed at:', await contract.getAddress());
  });

  it('Should generate an image with Venice AI and compress it for onchain storage', async function () {
    this.timeout(60000); // 1 minute timeout for API call

    const prompt = 'A cosmic dragon flying through space';

    console.log('\n🎨 Step 1: Generating image with Venice AI...');
    console.log(`   Prompt: "${prompt}"`);

    const imageResult = await generateImageWithVenice(prompt, API_KEY!);

    expect(imageResult.images).to.have.length.greaterThan(0);
    expect(imageResult.images[0].base64).to.have.length.greaterThan(0);

    const originalBase64 = imageResult.images[0].base64;
    const originalSizeKB = Math.round(originalBase64.length * 0.75 / 1024);
    console.log(`   ✅ Original image: ${originalBase64.length} base64 chars (~${originalSizeKB}KB)`);
    console.log(`   Model: ${imageResult.model}`);
    
    // Verify it's a valid PNG
    const imageBuffer = Buffer.from(originalBase64, 'base64');
    const pngMagic = imageBuffer.slice(0, 8).toString('hex');
    expect(pngMagic).to.equal('89504e470d0a1a0a'); // PNG magic bytes
    console.log(`   ✅ Valid PNG image verified!`);

    // Step 2: Compress the image for onchain storage
    console.log('\n🗜️  Step 2: Compressing image for onchain storage...');
    
    // Import sharp for compression (dynamically to avoid ESM issues)
    const sharp = (await import('sharp')).default;
    
    // Compress to 128x128 JPEG for onchain storage
    const compressedBuffer = await sharp(imageBuffer)
      .resize(128, 128)
      .jpeg({ quality: 70 })
      .toBuffer();
    
    const compressedBase64 = compressedBuffer.toString('base64');
    const compressedSizeKB = Math.round(compressedBuffer.length / 1024 * 10) / 10;
    
    console.log(`   ✅ Compressed: ${compressedBase64.length} base64 chars (~${compressedSizeKB}KB)`);
    console.log(`   📉 Reduction: ${Math.round((1 - compressedBase64.length / originalBase64.length) * 100)}%`);
    console.log(`   📐 Dimensions: 256x256 → 128x128`);
    console.log(`   🎨 Format: PNG → JPEG`);
    
    // Calculate estimated gas for both
    const originalGas = Math.round(originalBase64.length * 100);
    const compressedGas = Math.round(compressedBase64.length * 100);
    console.log(`\n   ⛽ Gas estimates:`);
    console.log(`      Original (256x256 PNG): ~${(originalGas / 1_000_000).toFixed(1)}M gas`);
    console.log(`      Compressed (128x128 JPEG): ~${(compressedGas / 1_000_000).toFixed(2)}M gas`);
    
    // Verify compressed image is valid JPEG
    const jpegMagic = compressedBuffer.slice(0, 2).toString('hex');
    expect(jpegMagic).to.equal('ffd8'); // JPEG magic bytes
    console.log(`   ✅ Valid JPEG image verified!`);

    // Save the generated image to the test folder
    const originalPath = path.join(OUTPUT_DIR, 'test-generated-image-original.png');
    const compressedPath = path.join(OUTPUT_DIR, 'test-generated-image.png');
    
    fs.writeFileSync(originalPath, imageBuffer);
    fs.writeFileSync(compressedPath, compressedBuffer);
    
    console.log(`\n   💾 Saved images:`);
    console.log(`      Original: ${originalPath}`);
    console.log(`      Compressed: ${compressedPath}`);
  });

  it('Should generate, compress, and mint AI image as NFT on-chain', async function () {
    this.timeout(90000); // 90 seconds for full flow

    const prompt = 'A magical crystal floating in space';

    console.log('\n🎨 Full E2E: Generate → Compress → Mint');
    console.log(`   Prompt: "${prompt}"`);

    // Step 1: Generate image
    console.log('\n   Step 1: Generating 256x256 image...');
    const imageResult = await generateImageWithVenice(prompt, API_KEY!);
    const originalBase64 = imageResult.images[0].base64;
    console.log(`   ✅ Generated: ${originalBase64.length} base64 chars`);

    // Step 2: Compress for onchain storage
    console.log('   Step 2: Compressing to 128x128 JPEG...');
    const sharp = (await import('sharp')).default;
    const compressedBuffer = await sharp(Buffer.from(originalBase64, 'base64'))
      .resize(128, 128)
      .jpeg({ quality: 70 })
      .toBuffer();
    const compressedBase64 = compressedBuffer.toString('base64');
    console.log(`   ✅ Compressed: ${compressedBase64.length} base64 chars (${Math.round((1 - compressedBase64.length / originalBase64.length) * 100)}% reduction)`);

    // Step 3: Mint the compressed image onchain
    console.log('   Step 3: Minting NFT on-chain...');
    
    const totalSupplyBefore = await contract.totalSupply();
    expect(totalSupplyBefore).to.equal(0);

    const mintTx = await contract.connect(user).mint(
      prompt,
      compressedBase64,
      imageResult.model,
      { value: MINT_FEE }
    );

    const receipt = await mintTx.wait();
    console.log(`   ✅ Minted! Gas used: ${receipt.gasUsed.toString()}`);

    // Verify the NFT
    const totalSupplyAfter = await contract.totalSupply();
    expect(totalSupplyAfter).to.equal(1);

    const tokenId = 1;
    const ownerOf = await contract.ownerOf(tokenId);
    expect(ownerOf).to.equal(user.address);

    // Verify token data
    const tokenData = await contract.getTokenData(tokenId);
    expect(tokenData.prompt).to.equal(prompt);
    expect(tokenData.imageBase64).to.equal(compressedBase64);
    expect(tokenData.aiModel).to.equal(imageResult.model);
    console.log(`   ✅ Token #${tokenId} data verified!`);

    // Verify tokenURI contains the image
    const tokenURI = await contract.tokenURI(tokenId);
    expect(tokenURI).to.match(/^data:application\/json;base64,/);
    
    const base64Data = tokenURI.replace('data:application/json;base64,', '');
    const jsonString = Buffer.from(base64Data, 'base64').toString();
    const metadata = JSON.parse(jsonString);
    
    expect(metadata.image).to.include(compressedBase64);
    console.log(`   ✅ TokenURI contains compressed image!`);

    console.log('\n🎉 SUCCESS! AI-generated image minted fully on-chain!');
    console.log(`   📊 Stats:`);
    console.log(`      - Original: ${Math.round(originalBase64.length * 0.75 / 1024)}KB`);
    console.log(`      - Compressed: ${Math.round(compressedBuffer.length / 1024 * 10) / 10}KB`);
    console.log(`      - Gas used: ${receipt.gasUsed.toString()}`);
  });

  it('Should mint multiple NFTs successfully', async function () {
    this.timeout(30000);

    const prompts = [
      'Second test NFT',
      'Third test NFT',
    ];

    const totalSupplyBefore = Number(await contract.totalSupply());
    let expectedTokenId = totalSupplyBefore + 1;

    for (const prompt of prompts) {
      console.log(`\n🪙 Minting: "${prompt}"`);

      await contract.connect(user).mint(
        prompt,
        TINY_TEST_IMAGE,
        'test-model',
        { value: MINT_FEE }
      );

      const tokenData = await contract.getTokenData(expectedTokenId);
      expect(tokenData.prompt).to.equal(prompt);
      console.log(`   ✅ Token #${expectedTokenId} minted`);

      expectedTokenId++;
    }

    const totalSupplyAfter = await contract.totalSupply();
    expect(totalSupplyAfter).to.equal(BigInt(totalSupplyBefore + prompts.length));
    console.log(`\n✅ Successfully minted ${prompts.length} additional NFTs!`);
  });
});

