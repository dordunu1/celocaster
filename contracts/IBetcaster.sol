// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IBetcaster {
    // Events
    event BetCreated(string betId, address betContract, address creator, uint256 stakeAmount, string asset);
    event VoteCast(string betId, address voter, bool isYay, uint256 amount);
    event BetResolved(string betId, bool yayWon, uint256 totalPrize);
    event PrizeDistributed(string betId, address winner, uint256 amount);
    event AssetAdded(string symbol, address priceFeed);
    event AssetRemoved(string symbol);

    // Structs
    struct BetInfo {
        address creator;
        uint256 platformStake;    // Fixed 2 MON
        uint256 voteStake;        // Amount per vote
        uint256 expiryTime;
        bool isVerified;          // Whether it uses price verification
        string asset;             // Asset symbol (e.g., "BTC", "ETH", "SOL")
        uint256 startPrice;       // For verified bets only
        uint256 priceThreshold;   // For verified bets only
        bool isPump;              // For verified bets only - true for pump, false for dump
        bool isResolved;
        uint256 totalYayVotes;
        uint256 totalNayVotes;
        uint256 prizePool;
    }

    // Core functions
    function createBet(
        string memory betId,
        uint256 voteStake,
        uint256 duration,
        bool isVerified,
        string memory asset,      // Now using asset symbol instead of price feed address
        uint256 priceThreshold,
        bool isPump
    ) external payable;

    function castVote(string memory betId, bool isYay) external payable;
    function resolveBet(string memory betId) external;
    function claimPrize(string memory betId) external;
    
    // View functions
    function getBetInfo(string memory betId) external view returns (BetInfo memory);
    function getUserVote(string memory betId, address user) external view returns (bool isYay, uint256 amount);
    function getWinningVote(string memory betId) external view returns (bool yayWon);
    function getSupportedAssets() external view returns (string[] memory);
    function getPriceFeed(string memory asset) external view returns (address);
} 