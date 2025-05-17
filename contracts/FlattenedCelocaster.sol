// Sources flattened with hardhat v2.24.0 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/utils/Context.sol@v4.9.6

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.4) (utils/Context.sol)

pragma solidity ^0.8.0;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/access/Ownable.sol@v4.9.6

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (access/Ownable.sol)

pragma solidity ^0.8.0;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _transferOwnership(_msgSender());
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File @chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol@v0.8.0

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.0;

interface AggregatorV3Interface {
  function decimals() external view returns (uint8);

  function description() external view returns (string memory);

  function version() external view returns (uint256);

  function getRoundData(
    uint80 _roundId
  ) external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);

  function latestRoundData()
    external
    view
    returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}


// File @openzeppelin/contracts/security/ReentrancyGuard.sol@v4.9.6

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (security/ReentrancyGuard.sol)

pragma solidity ^0.8.0;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be _NOT_ENTERED
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

        // Any calls to nonReentrant after this point will fail
        _status = _ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == _ENTERED;
    }
}


// File contracts/ICelocaster.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.19;

interface ICelocaster {
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
        uint256 platformStake;    // Fixed 2 CELO
        uint256 voteStake;        // Amount per vote (in CELO)
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
        bool yayWon;
        uint256 endPrice;      // Price at resolution
        bool thresholdMet;     // Whether threshold was met at resolution
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

    function setPlatformStake(uint256 newStake) external;
    function transferOwnership(address newOwner) external;

    // View functions
    function getBetInfo(string memory betId) external view returns (BetInfo memory);
    function getUserVote(string memory betId, address user) external view returns (bool isYay, uint256 amount);
    function getWinningVote(string memory betId) external view returns (bool yayWon);
    function getSupportedAssets() external view returns (string[] memory);
    function getPriceFeed(string memory asset) external view returns (address);
}


// File contracts/Celocaster.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.19;
contract Celocaster is ICelocaster, ReentrancyGuard, Ownable {
    // Constants
    uint256 public platformStake = 3 ether; // 3 CELO platform stake
    uint256 public constant MIN_VOTE_STAKE = 0.1 ether; // 0.1 CELO
    uint256 public constant MIN_DURATION = 5 minutes;
    uint256 public constant MAX_DURATION = 30 days;

    // State variables
    mapping(string => ICelocaster.BetInfo) private bets;
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

    function setPlatformStake(uint256 newStake) external onlyOwner {
        require(newStake > 0, "Platform stake must be greater than 0");
        platformStake = newStake;
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
        require(msg.value == platformStake, "Must stake 3 CELO");
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

            bets[betId] = ICelocaster.BetInfo({
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
                prizePool: 0,
                yayWon: false,
                endPrice: 0,
                thresholdMet: false
            });
        } else {
            bets[betId] = ICelocaster.BetInfo({
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
                prizePool: 0,
                yayWon: false,
                endPrice: 0,
                thresholdMet: false
            });
        }

        emit BetCreated(betId, address(this), msg.sender, msg.value, asset);
    }

    function castVote(string memory betId, bool isYay) external payable override nonReentrant {
        ICelocaster.BetInfo storage bet = bets[betId];
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
        }
        else {
            bet.totalNayVotes++;
            nayVoters[betId].push(msg.sender);
        }

        bet.prizePool += msg.value;

        emit VoteCast(betId, msg.sender, isYay, msg.value);
    }

    function resolveBet(string memory betId) external override nonReentrant {
        ICelocaster.BetInfo storage bet = bets[betId];
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
            bet.endPrice = uint256(endPrice);
            bet.thresholdMet = thresholdMet;

            if (thresholdMet) {
                bool isPriceUp = uint256(endPrice) > bet.startPrice;
                yayWon = (bet.isPump && isPriceUp) || (!bet.isPump && !isPriceUp);
            } else {
                // If threshold not met, Nay wins
                yayWon = false;
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

        bet.yayWon = yayWon;
        bet.isResolved = true;
        emit BetResolved(betId, yayWon, bet.prizePool);
    }

    function claimPrize(string memory betId) external override nonReentrant {
        ICelocaster.BetInfo storage bet = bets[betId];
        require(bet.isResolved, "Bet not resolved");

        Vote storage userVote = votes[betId][msg.sender];
        require(userVote.amount > 0, "No vote found");
        require(!userVote.claimed, "Already claimed");

        require(userVote.isYay == bet.yayWon, "Did not win");

        userVote.claimed = true;
        uint256 prize = calculatePrize(betId, bet.yayWon);

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
        ICelocaster.BetInfo storage bet = bets[betId];
        uint256 totalWinners = yayWon ? bet.totalYayVotes : bet.totalNayVotes;
        return bet.prizePool / totalWinners;
    }

    function refundAll(string memory betId) internal {
        ICelocaster.BetInfo storage bet = bets[betId];

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
    function getBetInfo(string memory betId) external view override returns (ICelocaster.BetInfo memory) 
{
        return bets[betId];
    }

    function getUserVote(string memory betId, address user) external view override returns (bool isYay, uint256 amount) {
        Vote memory vote = votes[betId][user];
        return (vote.isYay, vote.amount);
    }

    function getWinningVote(string memory betId) public view override returns (bool yayWon) {
        ICelocaster.BetInfo storage bet = bets[betId];
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
             // If threshold not met, Nay wins
            return false;

        } else {
            // For non-verified bets, majority wins
            return bet.totalYayVotes > bet.totalNayVotes;
        }
    }

     function hasUserClaimed(string memory betId, address user) external view returns (bool) {
        return votes[betId][user].claimed;
    }

    function getVoteDetails(string memory betId, address user) external view returns (bool isYay, uint256 amount, bool claimed) {
        Vote memory vote = votes[betId][user];
        return (vote.isYay, vote.amount, vote.claimed);
    }

    // Override transferOwnership to resolve ambiguity with ICelocaster
    function transferOwnership(address newOwner) public override(Ownable, ICelocaster) onlyOwner {
        super.transferOwnership(newOwner);
    }
} 