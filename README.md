# Infinite Frontier

A miniapp where players can use AI to generate unique images, then choose to mint them as onchain NFTs.

## Core Concept

- **Generate**: Users pay generate an AI image, and pay a small fee to cover the cost of AI credits.
- **Mint**: Users can mint the image as an NFT for a minting fee.

## Features
 
### V0 (MVP)
- [ ] User-input text prompt for image generation
- [ ] AI image generation using Venice AI API (https://docs.venice.ai/api-reference/api-spec)
- [ ] Generate fee: 0.00003 ETH (covers compute costs)
- [ ] User can choose to mint or generate another image after generation
- [ ] Mint fee: 0.0003 ETH
- [ ] Onchain NFT storage with metadata
- [ ] OpenSea marketplace integration (automatic detection + manual optimization)
- [ ] Display highest bid from OpenSea using API

### V1 (Enhanced Generation)
- [ ] User stats tracking (# mints, # days with mint, etc.)
- [ ] Random image generation mode
- [ ] AI-generated prompts (text AI creates prompt, then image AI creates image)
- [ ] Improved image quality optimization for onchain storage

### V2 (Game Mechanics)
- [ ] NFT categories (player, player types, in-game items, rewards)
- [ ] Character attributes system
- [ ] Equipment mechanics
- [ ] Attribute boosts
- [ ] Item interaction mechanics
- [ ] Community feedback system for new items and mechanics

### V3 (Advanced Features)
- [ ] Burn-to-mint: Users can burn existing NFTs to mint new ones (in lieu of USDC fee)
- [ ] Enhanced marketplace integration
- [ ] Advanced analytics and stats
- [ ] Collection management tools

## NFT Attributes

Each NFT stores the following onchain metadata:
- **Generation**: App version (V0, V1, etc.)
- **Type**: Defaults to "OG", expandable later
- **Text Prompt**: The prompt used to generate the image
- **Minter's Address**: Address that minted the NFT
- **AI Model & Version**: Model identifier and version used

## Technical Stack

- **Miniapp Framework**: [Base miniapp](https://docs.base.org/mini-apps/quickstart/create-new-miniapp)
- **Image Generation**: [Venice AI API](https://docs.venice.ai/api-reference/api-spec)
- **Blockchain**: Base L2
- **NFT Standard**: ERC-721
- **Marketplace**: OpenSea integration
- **Storage**: Onchain (optimized for low gas costs)

## Development Roadmap

### Scaffold: Project Setup

#### Step 1: Initialize Base Miniapp Project
```bash
# Create a new miniapp project using Base's scaffolding tool
npx create-onchain@latest --mini

# Navigate to the project directory
cd infinite-frontier  # or whatever name you choose

# Install dependencies
npm install
```

#### Step 2: Configure Farcaster Manifest
Create a `farcaster.json` file in `public/.well-known/` directory:

```json
{
  "frame": {
    "version": "1",
    "name": "Infinite Frontier",
    "subtitle": "AI-Powered NFT Generation",
    "description": "Generate unique AI images and mint them as onchain NFTs on Base",
    "iconUrl": "https://yourapp.com/icon.png",
    "homeUrl": "https://yourapp.com",
    "splashImageUrl": "https://yourapp.com/splash.png",
    "splashBackgroundColor": "#000000",
    "heroImageUrl": "https://yourapp.com/hero.png",
    "tagline": "Infinite possibilities, one frontier at a time",
    "screenshotUrls": [
      "https://yourapp.com/screenshot1.png"
    ],
    "primaryCategory": "games",
    "tags": ["nft", "ai", "generation", "onchain"],
    "webhookUrl": "https://yourapp.com/api/webhook"
  }
}
```

**Important**: Replace all placeholder URLs with your actual deployed URLs.

#### Step 3: Run Development Server
```bash
# Start the development server
npm run dev
```

Your miniapp should now be running locally. Test it in your browser.

#### Step 4: Build and Deploy
```bash
# Build the production version
npm run build

# Deploy to hosting platform (Vercel, Netlify, etc.)
# Example with Vercel:
vercel deploy
```

**Deployment Checklist**:
- [ ] Ensure `farcaster.json` is accessible at `https://yourapp.com/.well-known/farcaster.json`
- [ ] Verify all asset URLs (icons, images) are publicly accessible
- [ ] Test the miniapp in Base App or Farcaster
- [ ] Confirm wallet connection works properly

#### Step 5: Verify Integration
- Open your deployed miniapp in a browser
- Test wallet connection functionality
- Verify the manifest is properly served
- Test in Base App/Farcaster environment

**Resources**:
- [Base Miniapp Documentation](https://docs.base.org/mini-apps/quickstart/create-new-miniapp)
- [Farcaster Frame Specification](https://docs.farcaster.xyz/reference/frames/spec)

### Phase 0: MVP
1. Set up project structure (completed in Scaffold)
2. Integrate Venice AI API for image generation
3. Implement smart contract for NFT minting
4. Build basic UI for generation and minting
5. Add OpenSea integration (see detailed steps below)
6. Implement fee collection system
7. Add user stats tracking

#### OpenSea Integration Steps

**What's Automatic:**
- OpenSea automatically detects ERC-721 contracts deployed on Base L2
- NFTs will appear on OpenSea once minted (if metadata standards are followed)
- Basic listing and trading functionality works out of the box

**What Requires Setup:**

1. **Implement ERC-721 Metadata Standard**
   - Ensure your smart contract implements `tokenURI(uint256 tokenId)` that returns a URI pointing to JSON metadata
   - For **onchain storage**, the metadata and image are embedded directly in the contract using Base64-encoded data URIs
   - Metadata JSON should follow the [ERC-721 Metadata JSON Schema](https://eips.ethereum.org/EIPS/eip-721)

   **Onchain Metadata Structure:**
   ```json
   {
     "name": "Infinite Frontier #1",
     "description": "AI-generated NFT",
     "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
     "attributes": [
       {
         "trait_type": "Generation",
         "value": "V0"
       },
       {
         "trait_type": "Type",
         "value": "OG"
       },
       {
         "trait_type": "Prompt",
         "value": "user's prompt text"
       },
       {
         "trait_type": "Minter",
         "value": "0x1234...5678"
       },
       {
         "trait_type": "AI Model",
         "value": "venice-ai-v1"
       }
     ]
   }
   ```

   **Solidity Implementation Example:**
   ```solidity
   import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
   import "@openzeppelin/contracts/utils/Base64.sol";
   import "@openzeppelin/contracts/utils/Strings.sol";
   
   contract InfiniteFrontier is ERC721 {
       using Strings for uint256;
       
       // Store token metadata onchain
       mapping(uint256 => TokenData) public tokenData;
       
       struct TokenData {
           string prompt;
           string imageBase64;  // Base64-encoded compressed image
           string generation;
           string nftType;
           address minter;
           string aiModel;
       }
       
       function tokenURI(uint256 tokenId) 
           public 
           view 
           override 
           returns (string memory) 
       {
           TokenData memory data = tokenData[tokenId];
           
           // Build JSON metadata string
           string memory json = string(
               abi.encodePacked(
                   '{"name": "Infinite Frontier #', tokenId.toString(), '",',
                   '"description": "AI-generated NFT from Infinite Frontier",',
                   '"image": "data:image/png;base64,', data.imageBase64, '",',
                   '"attributes": [',
                   '{"trait_type": "Generation", "value": "', data.generation, '"},',
                   '{"trait_type": "Type", "value": "', data.nftType, '"},',
                   '{"trait_type": "Prompt", "value": "', data.prompt, '"},',
                   '{"trait_type": "Minter", "value": "', _addressToString(data.minter), '"},',
                   '{"trait_type": "AI Model", "value": "', data.aiModel, '"}',
                   ']}'
               )
           );
           
           // Base64 encode the JSON and return as data URI
           return string(
               abi.encodePacked(
                   "data:application/json;base64,",
                   Base64.encode(bytes(json))
               )
           );
       }
       
       function mint(
           address to,
           string memory prompt,
           string memory imageBase64,
           string memory generation,
           string memory aiModel
       ) public payable {
           uint256 tokenId = totalSupply() + 1;
           _safeMint(to, tokenId);
           
           tokenData[tokenId] = TokenData({
               prompt: prompt,
               imageBase64: imageBase64,
               generation: generation,
               nftType: "OG",
               minter: to,
               aiModel: aiModel
           });
       }
       
       function _addressToString(address addr) 
           internal 
           pure 
           returns (string memory) 
       {
           return Strings.toHexString(uint256(uint160(addr)), 20);
       }
   }
   ```

   **Image Processing Before Storage:**
   - Compress/optimize AI-generated images before storing (reduce to ~32x32 or 64x64 pixels, optimize PNG/JPEG)
   - Convert to Base64 in your backend before calling `mint()`
   - Consider using WebP format for better compression
   - Example Node.js preprocessing:
     ```javascript
     const sharp = require('sharp');
     const fs = require('fs');
     
     async function prepareImageForOnchain(imagePath) {
       // Resize and compress image
       const buffer = await sharp(imagePath)
         .resize(64, 64)  // Small size to save gas
         .png({ quality: 80, compressionLevel: 9 })
         .toBuffer();
       
       // Convert to base64
       const base64 = buffer.toString('base64');
       return base64;
     }
     ```

   **Gas Optimization Tips:**
   - Store images at low resolution (32x32 to 128x128 pixels max)
   - Use maximum compression
   - Consider storing only a hash/seed onchain and generating SVG deterministically
   - Use `string` storage efficiently (SSTORE2 pattern for large strings)
   - Batch metadata updates if possible

2. **Set Up Collection Metadata** (Optional but Recommended)
   - Deploy contract with proper collection name and symbol
   - Set contract-level metadata (name, description, image) if supported
   - Configure royalty recipient and percentage (e.g., 5-10% for secondary sales)

3. **OpenSea API Integration** (For Displaying Highest Bid)
   ```bash
   # Install OpenSea SDK
   npm install opensea-js
   ```
   
   - **Get OpenSea API Key**:
     1. Log in to OpenSea account
     2. Go to Settings → Developer
     3. Verify email address
     4. Request API access (fill out form)
     5. Create API key once approved
   
   - **Set Up Environment Variables**:
     ```
     OPENSEA_API_KEY=your_api_key_here
     ALCHEMY_API_KEY=your_alchemy_api_key  # For Base L2 RPC
     ```
   
   - **Fetch Highest Bid**:
     ```typescript
     import { OpenSeaSDK, Network } from 'opensea-js';
     
     const sdk = new OpenSeaSDK(provider, {
       networkName: Network.Base,
       apiKey: process.env.OPENSEA_API_KEY
     });
     
     // Get collection
     const collection = await sdk.api.getCollection(collectionSlug);
     
     // Get asset with orders
     const asset = await sdk.api.getAsset({
       tokenAddress: contractAddress,
       tokenId: tokenId.toString()
     });
     
     // Get highest bid
     const highestBid = asset.orders?.find(order => 
       order.side === 1 // 1 = bid, 0 = listing
     );
     ```

4. **Verify Collection on OpenSea** (Optional)
   - Apply for verification through OpenSea's verification process
   - Provides trust badge and better visibility
   - Usually requires some community traction first

5. **Configure Collection Settings on OpenSea**
   - Add collection logo, banner, and description
   - Set up social links
   - Configure payment tokens (ETH, USDC, etc.)

**Resources:**
- [OpenSea API Documentation](https://docs.opensea.io/reference/api-overview)
- [OpenSea SDK Documentation](https://docs.opensea.io/docs/buy-and-sell-setup)
- [ERC-721 Metadata Standard](https://eips.ethereum.org/EIPS/eip-721)
- [Base L2 on OpenSea](https://opensea.io/collection/base)

### Phase 1: Enhanced Features
1. Random generation mode
2. AI prompt generation
3. Image optimization pipeline

### Phase 2: Game Mechanics
1. Design attribute system
2. Implement categories
3. Build interaction mechanics
4. Create community feedback system

### Phase 3: Advanced Features
1. Burn-to-mint functionality
2. Enhanced marketplace features
3. Advanced analytics

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/MacStrelioff/infinite-frontier.git
   cd infinite-frontier
   ```

2. **Follow the Scaffold steps** in the Development Roadmap section above to set up the Base miniapp project structure.

3. **Install dependencies** (if not already done during scaffold):
   ```bash
   npm install
   ```

4. **Set up environment variables**:
   - Create a `.env` file with your API keys:
     ```
     VENICE_AI_API_KEY=your_api_key_here
     ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

For detailed setup instructions, see the **Scaffold** section in the Development Roadmap.

## License

*To be determined*

## Contributing

*Contributing guidelines will be added as the project develops*

