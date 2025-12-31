# Setup Guide

This guide will help you set up the Infinite Frontier project locally, run tests, and configure all necessary environment variables.

## Prerequisites

- Node.js 18+ and npm
- Git
- A wallet with some ETH on Base (for testing)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Then edit .env with your actual values (see below)
   ```

## Environment Variables

### Required Variables

#### `VENICE_AI_API_KEY`
**Purpose:** API key for Venice AI image generation service

**How to get:**
1. Go to https://venice.ai
2. Sign up for an account
3. Navigate to your dashboard/API settings
4. Generate or copy your API key
5. Add it to your `.env` file:
   ```
   VENICE_AI_API_KEY=your_venice_api_key_here
   ```

**Status:** ✅ You mentioned you already have this one!

---

#### `OPENSEA_API_KEY`
**Purpose:** API key for OpenSea API to fetch bids and NFT data

**How to get:**
1. Go to https://opensea.io and log in
2. Navigate to **Settings** → **Developer** (in the left sidebar)
3. Verify your email address if you haven't already
4. Click **"Get access"** or **"Request API access"**
5. Fill out the form with:
   - Organization name
   - Intended use case (e.g., "NFT marketplace integration for Infinite Frontier")
   - Description of your project
6. Submit the form and wait for approval (usually quick)
7. Once approved, go back to **Settings** → **Developer**
8. Click **"Create key"**
9. Name your key (e.g., "Infinite Frontier Dev")
10. Copy the generated API key
11. Add it to your `.env` file:
    ```
    OPENSEA_API_KEY=your_opensea_api_key_here
    ```

**Note:** OpenSea API keys are free but require approval. Some endpoints work without a key but with rate limits.

**Documentation:** https://docs.opensea.io/reference/api-keys

---

#### `NEXT_PUBLIC_CONTRACT_ADDRESS`
**Purpose:** The deployed Infinite Frontier NFT contract address on Base

**How to get:**
1. Deploy your contract to Base (see contract deployment section below)
2. Copy the deployed contract address
3. Add it to your `.env` file:
   ```
   NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddressHere
   ```

**For local development:** You can use a placeholder address or deploy to Base Sepolia testnet first.

---

### Optional Variables (with defaults)

#### `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`
**Purpose:** WalletConnect project ID for mobile wallet QR code connections

**How to get:**
1. Go to https://cloud.walletconnect.com
2. Sign up for a free account
3. Create a new project
4. Copy the Project ID
5. Add it to your `.env` file:
   ```
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here
   ```

**Note:** This is **optional**. Browser extension wallets (MetaMask, Coinbase Wallet, etc.) work without this. Only needed if you want mobile wallet QR code connections.

**Default:** Empty string (browser wallets only)

---

#### `BASE_RPC_URL`
**Purpose:** RPC endpoint for Base mainnet

**How to get:**
1. **Option 1 (Free):** Use the public endpoint (default)
   - Default: `https://mainnet.base.org`
2. **Option 2 (Recommended for production):** Get a free RPC from:
   - **Alchemy:** https://www.alchemy.com/base
     - Sign up, create a Base app, copy the HTTP URL
   - **Infura:** https://www.infura.io
     - Sign up, create a Base project, copy the endpoint URL
   - **QuickNode:** https://www.quicknode.com
     - Sign up, create a Base endpoint

**Add to `.env`:**
```
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your-api-key
```

**Default:** `https://mainnet.base.org`

---

#### `BASE_SEPOLIA_RPC_URL`
**Purpose:** RPC endpoint for Base Sepolia testnet

**How to get:**
- Same as above, but create a Base Sepolia endpoint
- Or use default: `https://sepolia.base.org`

**Add to `.env`:**
```
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/your-api-key
```

**Default:** `https://sepolia.base.org`

---

#### `PRIVATE_KEY`
**Purpose:** Private key for deploying contracts and making transactions

**How to get:**
1. **⚠️ SECURITY WARNING:** Never commit this to git or share it publicly!
2. Export from MetaMask or another wallet:
   - MetaMask: Settings → Security & Privacy → Show Private Key
   - Or use a dedicated deployment wallet
3. Add to your `.env` file:
   ```
   PRIVATE_KEY=0xYourPrivateKeyHere
   ```

**Note:** Only needed for contract deployment. Use a wallet with testnet ETH for development.

**Security:** Make sure `.env` is in `.gitignore` (it should be already)

---

#### `BASESCAN_API_KEY`
**Purpose:** API key for verifying contracts on Basescan (Base's block explorer)

**How to get:**
1. Go to https://basescan.org
2. Sign up for an account (free)
3. Go to your account settings
4. Navigate to **API Keys** section
5. Create a new API key
6. Copy the key
7. Add to your `.env` file:
   ```
   BASESCAN_API_KEY=your_basescan_api_key_here
   ```

**Note:** Optional - only needed for contract verification after deployment.

**Default:** Empty string

---

#### `REPORT_GAS`
**Purpose:** Enable gas reporting in tests

**How to get:**
- Just set to any value to enable:
  ```
  REPORT_GAS=true
  ```

**Default:** Not set (gas reporting disabled)

---

## Running Tests

### Run All Tests
```bash
npm test
```

This runs both contract tests and API tests.

### Run Contract Tests Only
```bash
npm run test:contracts
```

Tests the Solidity smart contract using Hardhat.

### Run API Tests Only
```bash
npm run test:api
```

Tests the Venice AI and OpenSea API integrations using Vitest.

### Watch Mode (API Tests)
```bash
npm run test:api:watch
```

Runs API tests in watch mode for development.

---

## Running the App Locally

### Development Mode

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   - Navigate to http://localhost:3000
   - The app should load with wallet connection support

3. **Connect your wallet:**
   - Click the connect wallet button
   - Select your wallet (MetaMask, Coinbase Wallet, etc.)
   - Make sure you're connected to Base or Base Sepolia network

### Production Build

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Start the production server:**
   ```bash
   npm start
   ```

---

## Contract Deployment

### Compile Contracts
```bash
npm run compile
```

### Deploy to Base Sepolia (Testnet)

1. Make sure you have:
   - `PRIVATE_KEY` set in `.env`
   - `BASE_SEPOLIA_RPC_URL` set (or use default)
   - Some Sepolia ETH in your wallet

2. Create a deployment script or use Hardhat:
   ```bash
   npx hardhat run scripts/deploy.ts --network baseSepolia
   ```

3. Copy the deployed contract address to `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env`

### Deploy to Base Mainnet

1. Make sure you have:
   - `PRIVATE_KEY` set in `.env`
   - `BASE_RPC_URL` set (or use default)
   - `BASESCAN_API_KEY` set (for verification)
   - ETH on Base mainnet in your wallet

2. Deploy:
   ```bash
   npx hardhat run scripts/deploy.ts --network base
   ```

3. Verify the contract (optional):
   ```bash
   npx hardhat verify --network base <CONTRACT_ADDRESS>
   ```

---

## Troubleshooting

### Tests Fail
- Make sure dependencies are installed: `npm install`
- Check that all required environment variables are set
- For API tests, ensure you have valid API keys

### App Won't Start
- Check that all `NEXT_PUBLIC_*` environment variables are set
- Make sure port 3000 is not in use
- Check the console for error messages

### Wallet Connection Issues
- Make sure you're on the correct network (Base or Base Sepolia)
- Check that `NEXT_PUBLIC_CONTRACT_ADDRESS` is set correctly
- Try refreshing the page

### API Errors
- Verify your API keys are correct
- Check API rate limits (especially OpenSea)
- Look at the server console for detailed error messages

---

## Quick Start Checklist

- [ ] Install dependencies: `npm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Get Venice AI API key and add to `.env`
- [ ] Get OpenSea API key and add to `.env`
- [ ] (Optional) Get WalletConnect Project ID and add to `.env`
- [ ] (Optional) Set up RPC URLs if using custom endpoints
- [ ] Deploy contract and set `NEXT_PUBLIC_CONTRACT_ADDRESS`
- [ ] Run tests: `npm test`
- [ ] Start dev server: `npm run dev`
- [ ] Open http://localhost:3000

---

## Additional Resources

- [Venice AI Documentation](https://docs.venice.ai/api-reference/api-spec)
- [OpenSea API Documentation](https://docs.opensea.io/reference/api-overview)
- [Base Documentation](https://docs.base.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)

