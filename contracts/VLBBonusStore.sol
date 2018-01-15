pragma solidity ^0.4.18;


import "./lib/SafeMath.sol";
import "./lib/Ownable.sol";

contract VLBBonusStore is Ownable {
    mapping(address => uint8) public rates;

    function collectRate(address investor) onlyOwner public returns (uint8) {
        require(investor != address(0));
        uint8 rate = rates[investor];
        if (rate != 0) {
            delete rates[investor];
        }
        return rate;
    }

    function addRate(address investor, uint8 rate) onlyOwner public {
        require(investor != address(0));
        rates[investor] = rate;
    }
}