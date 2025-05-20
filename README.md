# CeloCaster 🎯

CeloCaster is a decentralized prediction market platform built on the Celo blockchain, integrated with Farcaster as a Mini App. Create and participate in transparent, on-chain prediction markets for crypto price movements and community-driven outcomes.

## 🌟 Features

### Two Types of Prediction Markets
- **Price-Verified Markets**: Create bets on crypto asset price movements with automated verification via Chainlink price feeds
- **Community-Voted Markets**: Create open-ended prediction markets where outcomes are determined by community consensus

### Smart Contract Architecture
- Secure escrow system for managing stakes and rewards
- Automated price verification for crypto predictions
- Fair reward distribution system
- Non-custodial design - all funds managed by smart contracts

### Key Parameters
- Platform Stake: 3 CELO (required to create a bet)
- Minimum Vote Stake: 0.1 CELO
- Bet Duration: 5 minutes to 30 days
- Price Threshold: Up to 20% movement for verified bets

## 🔧 Technical Stack

- **Frontend**: Next.js, TypeScript, TailwindCSS
- **Blockchain**: Celo Network
- **Smart Contracts**: Solidity
- **Oracle**: Chainlink Price Feeds
- **Social Integration**: Farcaster Mini App

## 🎮 How It Works

### Creating a Bet
1. Stake 3 CELO as platform fee
2. Choose between price-verified or community-voted bet
3. Set voting stake amount (min 0.1 CELO)
4. Set duration and other parameters
5. For price bets: Select asset and price movement threshold

### Participating in Bets
1. Browse active prediction markets
2. Stake CELO tokens to vote (Yay/Nay)
3. Amount staked = vote stake set by creator
4. Winners share the total pool of losing stakes

### Resolving Bets
- **Price-Verified**: Automatically resolved based on Chainlink price feeds
- **Community-Voted**: Majority vote wins
- In case of ties, all participants are refunded

## 🔗 Links

- [Mini App](https://warpcast.com/miniapps/wmU6dgTaCyPA/celocaster)
- [Documentation](https://celocaster.gitbook.io/celocaster)

## 🛠️ Development

### Prerequisites
- Node.js
- Yarn/npm
- Celo wallet

### Local Setup
```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env.local

# Start development server
yarn dev
```

## 📜 Smart Contract

The core smart contract (`Celocaster.sol`) handles:
- Bet creation and management
- Stake handling
- Vote recording
- Automated price verification
- Prize distribution
- Asset management for price feeds

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License

## 🙏 Acknowledgments

Built with ❤️ for the Celo and Farcaster communities.
