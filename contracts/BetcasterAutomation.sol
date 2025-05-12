// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "./IBetcaster.sol";

contract BetcasterAutomation is AutomationCompatibleInterface {
    IBetcaster public immutable betcaster;
    
    // Keep track of bets that need resolution
    mapping(string => bool) public pendingResolution;
    string[] public activeBets;
    
    constructor(address _betcaster) {
        betcaster = IBetcaster(_betcaster);
    }
    
    // Called by Chainlink Automation nodes
    function checkUpkeep(bytes calldata /* checkData */) external view override returns (bool upkeepNeeded, bytes memory performData) {
        for (uint i = 0; i < activeBets.length; i++) {
            string memory betId = activeBets[i];
            if (pendingResolution[betId]) {
                IBetcaster.BetInfo memory bet = betcaster.getBetInfo(betId);
                if (block.timestamp >= bet.expiryTime && !bet.isResolved) {
                    return (true, abi.encode(betId));
                }
            }
        }
        return (false, "");
    }
    
    function performUpkeep(bytes calldata performData) external override {
        string memory betId = abi.decode(performData, (string));
        if (pendingResolution[betId]) {
            betcaster.resolveBet(betId);
            pendingResolution[betId] = false;
            removeActiveBet(betId);
        }
    }
    
    // Called when a new bet is created
    function registerBet(string memory betId) external {
        require(msg.sender == address(betcaster), "Only Betcaster");
        pendingResolution[betId] = true;
        activeBets.push(betId);
    }
    
    // Internal function to remove resolved bet from active list
    function removeActiveBet(string memory betId) internal {
        for (uint i = 0; i < activeBets.length; i++) {
            if (keccak256(bytes(activeBets[i])) == keccak256(bytes(betId))) {
                activeBets[i] = activeBets[activeBets.length - 1];
                activeBets.pop();
                break;
            }
        }
    }
} 