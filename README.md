# Infinite Frontier

An AI-powered NFT miniapp where users generate unique images and choose to mint them as onchain NFTs. Each generation is a frontier of infinite possibilities.

## Overview

Infinite Frontier is a decentralized application that combines AI image generation with NFT minting mechanics. Users can generate AI-created images and decide whether to mint them as NFTs, creating a dynamic collection where supply is controlled by increasing mint prices and community decisions.

## Core Concept

- **Generate**: Users pay a small fee ($0.10) to generate an AI image
- **Mint**: Users can mint the generated image as an NFT for a fee ($1, increasing over time)
- **Dynamic Pricing**: Mint price increases over time, creating scarcity and value appreciation for existing items
- **Deep Liquidity**: Maintain bids close to mint price that automatically adjust upward as mint price increases

## Features

### Phase 0 (MVP)
- [ ] User-input text prompt for image generation
- [ ] AI image generation using Venice AI API
- [ ] Generate fee: $0.10 (covers compute costs)
- [ ] Mint fee: $1 (starts at $1, increases over time)
- [ ] Onchain NFT storage with metadata
- [ ] User can choose to mint or generate another image after generation
- [ ] Integration with OpenSea marketplace
- [ ] Display highest bid from OpenSea
- [ ] User stats tracking (# mints, # days with mint, etc.)

### Phase 1 (Enhanced Generation)
- [ ] Random image generation mode
- [ ] AI-generated prompts (text AI creates prompt, then image AI creates image)
- [ ] Improved image quality optimization for onchain storage

### Phase 2 (Game Mechanics)
- [ ] NFT categories (player, player types, in-game items, rewards)
- [ ] Character attributes system
- [ ] Equipment mechanics
- [ ] Attribute boosts
- [ ] Item interaction mechanics
- [ ] Community feedback system for new items and mechanics

### Phase 3 (Advanced Features)
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

- **Image Generation**: [Venice AI API](https://docs.venice.ai/api-reference/api-spec)
- **Blockchain**: Ethereum (or L2 for gas efficiency)
- **NFT Standard**: ERC-721
- **Marketplace**: OpenSea integration
- **Storage**: Onchain (optimized for low gas costs)

## Architecture Considerations

- **Image Quality**: Images stored onchain should be optimized/compressed to minimize gas costs
- **Pricing Mechanism**: Implement time-based mint price increases
- **Bid Management**: Automated bid placement system that tracks mint price
- **Revenue Model**: Use proceeds to invest, buy back NFTs, and manage tax strategies

## Development Roadmap

### Phase 0: MVP
1. Set up project structure
2. Integrate Venice AI API for image generation
3. Implement smart contract for NFT minting
4. Build basic UI for generation and minting
5. Add OpenSea integration
6. Implement fee collection system
7. Add user stats tracking

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

*Coming soon - setup instructions will be added as development progresses*

## License

*To be determined*

## Contributing

*Contributing guidelines will be added as the project develops*

