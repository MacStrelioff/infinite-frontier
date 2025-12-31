# Infinite Frontier

A Farcaster miniapp where users generate AI images and mint them as fully onchain NFTs on Base.

## Quick Links

| Resource | Link |
|----------|------|
| 🌐 **Live App** | [infinite-frontier.vercel.app](https://infinite-frontier.vercel.app) |
| 📱 **Farcaster Manifest** | [farcaster.json](https://infinite-frontier.vercel.app/.well-known/farcaster.json) |
| 📄 **Contract (Base Mainnet)** | [0xbe253c50AD7491E072AbC5Caf9b0dA13755dbD04](https://basescan.org/address/0xbe253c50AD7491E072AbC5Caf9b0dA13755dbD04) |
| 🖼️ **OpenSea Collection** | [View on OpenSea](https://opensea.io/collection/infinite-frontier) |
| 🧪 **Testnet Contract** | [0x2d3d42AC1f579F156816405460b7fEf6da925B1d](https://sepolia.basescan.org/address/0x2d3d42AC1f579F156816405460b7fEf6da925B1d) |

---

## Core Concept

- **Generate**: Users input a text prompt → AI generates an image (small fee covers compute)
- **Mint**: Users can mint the image as an onchain NFT (mint fee)
- **Trade**: NFTs appear automatically on OpenSea for trading

---

## Status

### ✅ Completed

| Component | Status | Details |
|-----------|--------|---------|
| Smart Contract | ✅ Deployed | ERC-721 with onchain metadata & image storage |
| Venice AI Integration | ✅ Done | Image generation with 128x128 JPEG compression |
| Website/UI | ✅ Live | Next.js app deployed to Vercel |
| Farcaster Manifest | ✅ Signed | Works in Base app & Warpcast |
| Wallet Connection | ✅ Done | Auto-connects in frames, ConnectKit for browsers |
| OpenSea Integration | ✅ Done | Auto-detection + SDK for bids/listings |
| Test Suite | ✅ Passing | 83 tests (contracts, API, integration) |

### 🚀 Next Steps (Enhancements)

| Priority | Task | Description |
|----------|------|-------------|
| 🎨 | Branding | Replace placeholder images (icon, splash, hero) |
| 💰 | Enable fees | Turn on generate/mint fees in contract |
| 📈 | Price curve | Increase mint price over time |
| 🔗 | Deep bids | Set up OpenSea bids near mint price |
| 📊 | User stats | Track mints per user, streaks, etc. |
| 🎲 | Random mode | AI-generated prompts (V1) |

---

## How It Works

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
| 128x128 JPEG | ~2.5M | ~$0.02 |

All metadata stored onchain - no IPFS needed!

---

## Local Development

### Prerequisites

- Node.js 18+
- Git

### Installation

```bash
git clone https://github.com/MacStrelioff/infinite-frontier.git
cd infinite-frontier
npm install
cp .env.example .env
```

### Run Locally

```bash
npm run dev
# Open http://localhost:3000
```

### Run Tests

```bash
npm test                    # All tests
npm run test:contracts      # Smart contract tests
npm run test:api            # API unit tests
npm run test:integration    # E2E with real Venice API
```

---

## Environment Variables

### Required

```env
# AI image generation (get from venice.ai)
VENICE_AI_API_KEY=your_key

# Deployed contract address
NEXT_PUBLIC_CONTRACT_ADDRESS=0xbe253c50AD7491E072AbC5Caf9b0dA13755dbD04

# Mobile wallet connections (get from cloud.walletconnect.com)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

### For Deployment

```env
# Contract deployment (export from your wallet)
PRIVATE_KEY=0xYourPrivateKey

# Contract verification (get from basescan.org)
BASESCAN_API_KEY=your_key
```

### Optional

```env
# OpenSea bid display (get from opensea.io developer settings)
OPENSEA_API_KEY=your_key
```

---

## Deployment

### Deploy Contract

```bash
# Testnet
npx hardhat run scripts/deploy.ts --network baseSepolia

# Mainnet
npx hardhat run scripts/deploy.ts --network base

# Verify
npx hardhat verify --network base <CONTRACT_ADDRESS>
```

### Deploy Website

```bash
vercel
# Set environment variables in Vercel dashboard
```

### Generate Farcaster Manifest

1. Deploy website to Vercel first
2. Go to [base.dev](https://base.dev)
3. Enter your domain and sign to verify ownership
4. Copy the signed manifest to `public/.well-known/farcaster.json`
5. Redeploy to Vercel

---

## Project Structure

```
infinite-frontier/
├── src/
│   ├── app/                 # Next.js pages & API routes
│   ├── components/          # React components
│   ├── contracts/           # Solidity contracts
│   ├── hooks/               # React hooks (useFrameContext)
│   └── lib/                 # Utilities (venice.ts, opensea.ts)
├── tests/                   # Test suites
├── scripts/                 # Deployment scripts
└── public/                  # Static assets + manifest
```

---

## Features Roadmap

### V0 (MVP) ✅ Complete
- [x] User-input text prompts
- [x] AI image generation (Venice AI)
- [x] 128x128 JPEG compression for onchain storage
- [x] NFT minting with full onchain metadata
- [x] Farcaster miniapp integration
- [x] OpenSea auto-detection

### V1 (Enhanced)
- [ ] Generate/mint fee system enabled
- [ ] User stats tracking
- [ ] Random image generation mode
- [ ] AI-generated prompts

### V2 (Game Mechanics)
- [ ] NFT categories (characters, items, etc.)
- [ ] Character attributes
- [ ] Equipment mechanics

### V3 (Advanced)
- [ ] Burn-to-mint option
- [ ] Enhanced marketplace features
- [ ] Analytics dashboard

---

## Resources

- [Venice AI API Docs](https://docs.venice.ai/api-reference/api-spec)
- [Base Miniapp Docs](https://docs.base.org/mini-apps/quickstart/create-new-miniapp)
- [Farcaster Frame Spec](https://docs.farcaster.xyz/reference/frames/spec)
- [OpenSea API Docs](https://docs.opensea.io/reference/api-overview)

---

## License

MIT
