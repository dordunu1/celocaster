// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IBetcaster.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Betcaster is IBetcaster, ReentrancyGuard, Ownable {
    // Constants
    uint256 public constant PLATFORM_STAKE = 2 ether; // 2 MON
    uint256 public constant MIN_VOTE_STAKE = 0.1 ether; // 0.1 MON
    uint256 public constant MIN_DURATION = 1 hours;
    uint256 public constant MAX_DURATION = 72 hours;
    
    // State variables
    mapping(string => BetInfo) private bets;
    mapping(string => mapping(address => Vote)) private votes;
    mapping(string => address[]) private yayVoters;
    mapping(string => address[]) private nayVoters;
    
    // Asset management
    mapping(string => address) private assetPriceFeeds;  // symbol => price feed address
    string[] private supportedAssets;
    
    struct Vote {
        bool isYay;
        uint256 amount;
        bool claimed;
    }
    
    constructor(string[] memory assets, address[] memory priceFeeds) {
        require(assets.length == priceFeeds.length, "Arrays length mismatch");
        for (uint i = 0; i < assets.length; i++) {
            _addAsset(assets[i], priceFeeds[i]);
        }
    }

    // Asset management functions
    function addAsset(string memory symbol, address priceFeed) external onlyOwner {
        _addAsset(symbol, priceFeed);
    }

    function _addAsset(string memory symbol, address priceFeed) internal {
        require(priceFeed != address(0), "Invalid price feed");
        require(assetPriceFeeds[symbol] == address(0), "Asset already exists");
        
        // Verify price feed works
        AggregatorV3Interface feed = AggregatorV3Interface(priceFeed);
        (, int256 price,,,) = feed.latestRoundData();
        require(price > 0, "Invalid price feed");

        assetPriceFeeds[symbol] = priceFeed;
        supportedAssets.push(symbol);
        emit AssetAdded(symbol, priceFeed);
    }

    function removeAsset(string memory symbol) external onlyOwner {
        require(assetPriceFeeds[symbol] != address(0), "Asset not found");
        delete assetPriceFeeds[symbol];
        
        // Remove from supported assets array
        for (uint i = 0; i < supportedAssets.length; i++) {
            if (keccak256(bytes(supportedAssets[i])) == keccak256(bytes(symbol))) {
                supportedAssets[i] = supportedAssets[supportedAssets.length - 1];
                supportedAssets.pop();
                break;
            }
        }
        
        emit AssetRemoved(symbol);
    }

    // View functions for assets
    function getSupportedAssets() external view override returns (string[] memory) {
        return supportedAssets;
    }

    function getPriceFeed(string memory asset) external view override returns (address) {
        return assetPriceFeeds[asset];
    }
    
    // Core functions
    function createBet(
        string memory betId,
        uint256 voteStake,
        uint256 duration,
        bool isVerified,
        string memory asset,
        uint256 priceThreshold,
        bool isPump
    ) external payable override nonReentrant {
        require(msg.value == PLATFORM_STAKE, "Must stake 2 MON");
        require(voteStake >= MIN_VOTE_STAKE, "Vote stake too low");
        require(duration >= MIN_DURATION && duration <= MAX_DURATION, "Invalid duration");
        require(bets[betId].creator == address(0), "Bet already exists");
        
        if (isVerified) {
            address priceFeed = assetPriceFeeds[asset];
            require(priceFeed != address(0), "Unsupported asset");
            require(priceThreshold > 0 && priceThreshold <= 20, "Invalid threshold");
            
            AggregatorV3Interface feed = AggregatorV3Interface(priceFeed);
            (, int256 price,,,) = feed.latestRoundData();
            require(price > 0, "Invalid price feed");
            
            bets[betId] = BetInfo({
                creator: msg.sender,
                platformStake: msg.value,
                voteStake: voteStake,
                expiryTime: block.timestamp + duration,
                isVerified: true,
                asset: asset,
                startPrice: uint256(price),
                priceThreshold: priceThreshold,
                isPump: isPump,
                isResolved: false,
                totalYayVotes: 0,
                totalNayVotes: 0,
                prizePool: 0
            });
        } else {
            bets[betId] = BetInfo({
                creator: msg.sender,
                platformStake: msg.value,
                voteStake: voteStake,
                expiryTime: block.timestamp + duration,
                isVerified: false,
                asset: "",
                startPrice: 0,
                priceThreshold: 0,
                isPump: false,
                isResolved: false,
                totalYayVotes: 0,
                totalNayVotes: 0,
                prizePool: 0
            });
        }
        
        emit BetCreated(betId, address(this), msg.sender, msg.value, asset);
    }
    
    function castVote(string memory betId, bool isYay) external payable override nonReentrant {
        BetInfo storage bet = bets[betId];
        require(bet.creator != address(0), "Bet doesn't exist");
        require(!bet.isResolved, "Bet already resolved");
        require(block.timestamp < bet.expiryTime, "Bet expired");
        require(msg.value == bet.voteStake, "Incorrect vote stake");
        require(votes[betId][msg.sender].amount == 0, "Already voted");
        
        votes[betId][msg.sender] = Vote({
            isYay: isYay,
            amount: msg.value,
            claimed: false
        });
        
        if (isYay) {
            bet.totalYayVotes++;
            yayVoters[betId].push(msg.sender);
        } else {
            bet.totalNayVotes++;
            nayVoters[betId].push(msg.sender);
        }
        
        bet.prizePool += msg.value;
        
        emit VoteCast(betId, msg.sender, isYay, msg.value);
    }
    
    function resolveBet(string memory betId) external override nonReentrant {
        BetInfo storage bet = bets[betId];
        require(bet.creator != address(0), "Bet doesn't exist");
        require(!bet.isResolved, "Already resolved");
        require(block.timestamp >= bet.expiryTime, "Not expired yet");
        
        bool yayWon;
        
        if (bet.isVerified) {
            address priceFeed = assetPriceFeeds[bet.asset];
            require(priceFeed != address(0), "Asset not found");
            
            AggregatorV3Interface feed = AggregatorV3Interface(priceFeed);
            (, int256 endPrice,,,) = feed.latestRoundData();
            require(endPrice > 0, "Invalid price feed");
            
            uint256 priceChange = calculatePriceChange(bet.startPrice, uint256(endPrice));
            bool thresholdMet = priceChange >= bet.priceThreshold;
            
            if (thresholdMet) {
                bool isPriceUp = uint256(endPrice) > bet.startPrice;
                yayWon = (bet.isPump && isPriceUp) || (!bet.isPump && !isPriceUp);
            } else {
                // If threshold not met, refund everyone
                refundAll(betId);
                return;
            }
        } else {
            // For non-verified bets, majority wins
            yayWon = bet.totalYayVotes > bet.totalNayVotes;
            
            // In case of tie, refund everyone
            if (bet.totalYayVotes == bet.totalNayVotes) {
                refundAll(betId);
                return;
            }
        }
        
        bet.isResolved = true;
        emit BetResolved(betId, yayWon, bet.prizePool);
    }
    
    function claimPrize(string memory betId) external override nonReentrant {
        BetInfo storage bet = bets[betId];
        require(bet.isResolved, "Bet not resolved");
        
        Vote storage userVote = votes[betId][msg.sender];
        require(userVote.amount > 0, "No vote found");
        require(!userVote.claimed, "Already claimed");
        
        bool yayWon = getWinningVote(betId);
        require(userVote.isYay == yayWon, "Did not win");
        
        userVote.claimed = true;
        uint256 prize = calculatePrize(betId, yayWon);
        
        (bool sent, ) = payable(msg.sender).call{value: prize}("");
        require(sent, "Failed to send prize");
        
        emit PrizeDistributed(betId, msg.sender, prize);
    }
    
    // Internal functions
    function calculatePriceChange(uint256 start, uint256 end) internal pure returns (uint256) {
        if (end > start) {
            return ((end - start) * 100) / start;
        } else {
            return ((start - end) * 100) / start;
        }
    }
    
    function calculatePrize(string memory betId, bool yayWon) internal view returns (uint256) {
        BetInfo storage bet = bets[betId];
        uint256 totalWinners = yayWon ? bet.totalYayVotes : bet.totalNayVotes;
        return bet.prizePool / totalWinners;
    }
    
    function refundAll(string memory betId) internal {
        BetInfo storage bet = bets[betId];
        
        // Refund Yay voters
        for (uint i = 0; i < yayVoters[betId].length; i++) {
            address voter = yayVoters[betId][i];
            if (!votes[betId][voter].claimed) {
                votes[betId][voter].claimed = true;
                (bool sent, ) = payable(voter).call{value: bet.voteStake}("");
                require(sent, "Failed to refund");
            }
        }
        
        // Refund Nay voters
        for (uint i = 0; i < nayVoters[betId].length; i++) {
            address voter = nayVoters[betId][i];
            if (!votes[betId][voter].claimed) {
                votes[betId][voter].claimed = true;
                (bool sent, ) = payable(voter).call{value: bet.voteStake}("");
                require(sent, "Failed to refund");
            }
        }
        
        bet.isResolved = true;
    }
    
    // View functions
    function getBetInfo(string memory betId) external view override returns (BetInfo memory) {
        return bets[betId];
    }
    
    function getUserVote(string memory betId, address user) external view override returns (bool isYay, uint256 amount) {
        Vote memory vote = votes[betId][user];
        return (vote.isYay, vote.amount);
    }
    
    function getWinningVote(string memory betId) public view override returns (bool yayWon) {
        BetInfo storage bet = bets[betId];
        require(bet.isResolved, "Bet not resolved");
        
        if (bet.isVerified) {
            address priceFeed = assetPriceFeeds[bet.asset];
            require(priceFeed != address(0), "Asset not found");
            
            AggregatorV3Interface feed = AggregatorV3Interface(priceFeed);
            (, int256 endPrice,,,) = feed.latestRoundData();
            uint256 priceChange = calculatePriceChange(bet.startPrice, uint256(endPrice));
            
            if (priceChange >= bet.priceThreshold) {
                bool isPriceUp = uint256(endPrice) > bet.startPrice;
                return (bet.isPump && isPriceUp) || (!bet.isPump && !isPriceUp);
            }
            return false; // If threshold not met, no winners
        }
        
        return bet.totalYayVotes > bet.totalNayVotes;
    }
} 