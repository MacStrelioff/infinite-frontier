# Infinite Frontier

A miniapp where users generate AI images and can mint them as fully onchain NFTs on Base.

## Core Concept

- **Generate**: Users input a text prompt → AI generates an image (small fee covers compute)
- **Mint**: Users can mint the image as an onchain NFT (mint fee)
- **Trade**: NFTs appear automatically on OpenSea for trading

## Current Status

### ✅ Completed

| Component | Status | Details |
|-----------|--------|---------|
| Smart Contract | ✅ Done | ERC-721 with onchain metadata & image storage |
| Venice AI Integration | ✅ Done | Image generation with 128x128 JPEG compression |
| Website/UI | ✅ Done | Next.js app with wallet connect, generation, minting |
| API Routes | ✅ Done | `/api/generate` with image compression |
| OpenSea Integration | ✅ Done | SDK integration for bids/listings |
| Test Suite | ✅ Done | 83 tests passing (see below) |

### ⬜ Remaining Steps to Launch

| Step | Task | Time Est. |
|------|------|-----------|
| 1 | Get API keys (Venice, WalletConnect, Basescan) | 30 min |
| 2 | Deploy contract to Base Sepolia (testnet) | 15 min |
| 3 | Test locally with testnet contract | 30 min |
| 4 | Deploy website to Vercel | 15 min |
| 5 | Generate Farcaster manifest via Base.dev | 15 min |
| 6 | Deploy contract to Base mainnet | 15 min |
| **Total** | | **~2 hours** |

---

## Test Results

All tests pass, confirming the core functionality works:

```
Contract Tests:     31 passing ✅
API Unit Tests:     49 passing ✅  
Integration Tests:   3 passing ✅
─────────────────────────────────
Total:              83 passing
```

### What the Tests Confirm

| Test Suite | What It Validates |
|------------|-------------------|
| **Contract Tests** | Minting, fees, ownership, tokenURI, withdrawals |
| **Venice API Tests** | Image generation, error handling, rate limits |
| **OpenSea API Tests** | Fetching bids, listings, collection data |
| **Integration Tests** | Full flow: Generate image → Compress → Mint onchain |

### Integration Test Results (Real AI Images)

```
🎨 Generate 256x256 image with Venice AI    ✅
🗜️  Compress to 128x128 JPEG (97% reduction) ✅
🪙 Mint compressed image onchain            ✅
   Gas used: ~2.5M (well under 30M limit)
   Cost on Base L2: ~$0.02
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Git
- A wallet (MetaMask, Coinbase Wallet, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/MacStrelioff/infinite-frontier.git
cd infinite-frontier

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Run Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:contracts      # Smart contract tests
npm run test:api            # API unit tests (mocked)
npm run test:integration    # End-to-end with real Venice API
```

### Run Locally

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

---

## Environment Variables

### Required API Keys (You Must Obtain)

#### 1. `VENICE_AI_API_KEY` ⚠️ Required

**Purpose:** AI image generation

**How to get:**
1. Go to [venice.ai](https://venice.ai)
2. Sign up for an account
3. Navigate to API settings in your dashboard
4. Generate/copy your API key

```env
VENICE_AI_API_KEY=your_key_here
```

---

#### 2. `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` ⚠️ Required for mobile wallets

**Purpose:** Mobile wallet QR code connections

**How to get:**
1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Sign up (free)
3. Create a new project
4. Copy the Project ID

```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

**Note:** Browser extension wallets work without this, but mobile users need it.

---

#### 3. `PRIVATE_KEY` ⚠️ Required for deployment

**Purpose:** Deploying contracts and transactions

**How to get:**
1. Export from your wallet (MetaMask: Settings → Security → Show Private Key)
2. Use a dedicated deployment wallet
3. **⚠️ NEVER commit this to git!**

```env
PRIVATE_KEY=0xYourPrivateKeyHere
```

---

#### 4. `BASESCAN_API_KEY` (Optional but recommended)

**Purpose:** Contract verification on Basescan

**How to get:**
1. Go to [basescan.org](https://basescan.org)
2. Sign up (free)
3. Go to API Keys in account settings
4. Create a new API key

```env
BASESCAN_API_KEY=your_key_here
```

---

#### 5. `OPENSEA_API_KEY` (Optional)

**Purpose:** Fetching bids/listings from OpenSea

**How to get:**
1. Log in to [opensea.io](https://opensea.io)
2. Go to Settings → Developer
3. Verify email, request API access
4. Create API key once approved

```env
OPENSEA_API_KEY=your_key_here
```

**Note:** Basic functionality works without this; only needed for bid display.

---

### Auto-Configured Variables

These are set after you deploy:

```env
# Set after deploying contract
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContract

# Default RPC endpoints (can customize)
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

---

## Deployment Guide

### Step 1: Deploy Contract to Base Sepolia (Testnet)

First, get testnet ETH:
- [Alchemy Faucet](https://www.alchemy.com/faucets/base-sepolia)
- [Coinbase Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)

Then deploy:

```bash
# Make sure .env has PRIVATE_KEY set
npx hardhat run scripts/deploy.ts --network baseSepolia
```

Copy the deployed address to `.env`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddress
```

### Step 2: Test Locally

```bash
npm run dev
# Open http://localhost:3000
# Connect wallet (switch to Base Sepolia)
# Test generate + mint flow
```

### Step 3: Deploy Website to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# - VENICE_AI_API_KEY
# - NEXT_PUBLIC_CONTRACT_ADDRESS  
# - NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
```

Your app will be live at: `https://your-app.vercel.app`

### Step 4: Generate Farcaster Manifest (via Base.dev)

The manifest requires a cryptographic signature. Use Base.dev to generate it:

1. **Go to [base.dev](https://base.dev)**

2. **Sign in** with your Coinbase/Base account

3. **Navigate to Preview → Account Association**

4. **Enter your domain:**
   ```
   your-app.vercel.app
   ```

5. **Click to verify and sign** - this generates the `accountAssociation` signature

6. **Copy the generated manifest**

7. **Create the manifest file:**
   ```bash
   mkdir -p public/.well-known
   ```

8. **Save to `public/.well-known/farcaster.json`:**
   ```json
   {
     "accountAssociation": {
       "header": "eyJ...",
       "payload": "eyJ...",
       "signature": "0x..."
     },
     "frame": {
       "version": "1",
       "name": "Infinite Frontier",
       "iconUrl": "https://your-app.vercel.app/icon.png",
       "homeUrl": "https://your-app.vercel.app",
       "imageUrl": "https://your-app.vercel.app/og-image.png",
       "buttonTitle": "Create AI Art",
       "splashImageUrl": "https://your-app.vercel.app/splash.png",
       "splashBackgroundColor": "#0a0a0f"
     }
   }
   ```

9. **Redeploy to Vercel:**
   ```bash
   vercel --prod
   ```

10. **Verify:** Visit `https://your-app.vercel.app/.well-known/farcaster.json`

### Step 5: Deploy Contract to Base Mainnet

Once tested on testnet:

```bash
# Make sure you have ETH on Base mainnet
npx hardhat run scripts/deploy.ts --network base

# Verify contract (optional but recommended)
npx hardhat verify --network base <CONTRACT_ADDRESS>
```

Update `.env` and Vercel with the mainnet contract address.

---

## Technical Details

### Image Pipeline

```
Venice AI (256x256 PNG, ~100KB)
    ↓ sharp resize + compress
128x128 JPEG (~2.5KB, 97% reduction)
    ↓ base64 encode
Stored fully onchain in NFT contract
```

### Gas Costs (Base L2)

| Image Size | Gas Used | Cost |
|------------|----------|------|
| 64x64 JPEG | ~1.2M | ~$0.003 |
| 128x128 JPEG | ~2.5M | ~$0.02 |
| 256x256 PNG | ~30M+ | ❌ Exceeds Base Gas Limit |

Current setting: **128x128 JPEG** (good quality, affordable gas)

### Smart Contract

The `InfiniteFrontier.sol` contract stores:
- Full image data (base64 JPEG)
- Prompt text
- Minter address
- AI model used
- Generation version
- Mint timestamp

All metadata is returned via `tokenURI()` as a data URI - fully onchain, no IPFS needed.

---

## Project Structure

```
infinite-frontier/
├── src/
│   ├── app/                 # Next.js pages & API routes
│   │   ├── page.tsx         # Main UI
│   │   └── api/
│   │       └── generate/    # Venice AI + compression
│   ├── components/          # React components
│   ├── contracts/           # Solidity contracts
│   ├── hooks/               # React hooks
│   └── lib/                 # Utilities (venice.ts, opensea.ts)
├── tests/
│   ├── contracts/           # Hardhat tests
│   ├── api/                 # Vitest API tests
│   └── integration/         # E2E tests
├── scripts/                 # Deployment scripts
└── public/                  # Static assets
```

---

## Features by Version

### V0 (MVP) - Current
- [x] User-input text prompts
- [x] AI image generation (Venice AI)
- [x] 128x128 JPEG compression for onchain storage
- [x] NFT minting with full onchain metadata
- [x] OpenSea integration
- [x] Generate/mint fee system
- [ ] Deploy to mainnet

### V1 (Enhanced)
- [ ] User stats tracking
- [ ] Random image generation mode
- [ ] AI-generated prompts

### V2 (Game Mechanics)
- [ ] NFT categories
- [ ] Character attributes
- [ ] Equipment mechanics

### V3 (Advanced)
- [ ] Burn-to-mint
- [ ] Enhanced marketplace
- [ ] Analytics

---

## Troubleshooting

### Tests Fail
- Run `npm install` to ensure dependencies are installed
- Check that `VENICE_AI_API_KEY` is set for integration tests
- Contract tests work without any API keys

### App Won't Start
- Verify all `NEXT_PUBLIC_*` variables are set
- Check port 3000 is available
- Run `npm run build` to check for errors

### Wallet Connection Issues
- Ensure you're on the correct network (Base or Base Sepolia)
- Check `NEXT_PUBLIC_CONTRACT_ADDRESS` is set
- Try refreshing or reconnecting wallet

### Minting Fails
- Check wallet has enough ETH for gas + mint fee
- Verify contract is deployed to the network you're connected to
- Check browser console for detailed errors

---

## Resources

- [Venice AI API Docs](https://docs.venice.ai/api-reference/api-spec)
- [Base Miniapp Docs](https://docs.base.org/mini-apps/quickstart/create-new-miniapp)
- [OpenSea API Docs](https://docs.opensea.io/reference/api-overview)
- [Farcaster Frame Spec](https://docs.farcaster.xyz/reference/frames/spec)
- [Hardhat Docs](https://hardhat.org/docs)

---

## License

MIT

## Contributing

Contributions welcome! Please open an issue first to discuss changes.
