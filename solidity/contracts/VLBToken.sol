pragma solidity ^0.4.0;

import "./lib/token/StandardToken.sol";
import "./lib/ownership/Ownable.sol";
import "./lib/math/SafeMath.sol";

contract VLBToken is StandardToken, Ownable {
    using SafeMath for uint256;

    string public constant name = "VLB Tokens";
    string public constant symbol = "VLB";
    uint8 public decimals = 18;

    // 20 millions for presale
    uint256 public constant presaleTokens = 20 * 10 ** 24;

    // 200 millions for ICO itself
    uint256 public crowdsaleTokens = 200 * 10 ** 24;

    // 20 millions for the team
    uint256 public teamTokens = 20 * 10 ** 24;

    // 10 millions as a bounty reward
    uint256 public bountyTokens = 10 * 10 ** 24;

    // TODO: Fake addresses, replace to real
    address public constant teamTokensWallet = 0xb49fbbd01D8fF9a2bF46B7E4cB31CF8b8CFB96A9;
    address public constant bountyTokensWallet = 0xfA81DD8Ed3610F2c872bD0a2b7dEd913dDDC1A47;
    address public constant presaleTokensWallet = 0x995d3876d03CeC2Ae2Dc79dC29E066C9C0A1fBF8;
    address public constant crowdsaleTokensWallet = 0x4A4A67ddbFbC5A6bbFFe07613fa0599b76f1CC21;


    address public crowdsaleContractAddress;

    enum TokensState {Init, Presale, PresaleEnded, Crowdsale, CrowdsaleEnded}
    TokensState private state;

    modifier onlyCrowdsaleContract() {
        require(msg.sender == crowdsaleContractAddress);
        _;
    }

    event PresaleStarted();
    event PresaleEnded(uint256 presaleTokensLeftovers);
    event CrowdsaleStarted();
    event CrowdsaleTokensBurnt(uint256 crowdsaleTokensLeftovers);
    event CrowdsaleEnded();

    function VLBToken() {
        state = TokensState.Init;

        // 250 millions tokens overall
        totalSupply = presaleTokens.add(crowdsaleTokens).add(bountyTokens).add(teamTokens);
    }

    // Can be called only once
    function issueTokens() external onlyCrowdsaleContract {
        require(state == TokensState.Init);

        // Issue team tokens
        balances[teamTokensWallet] = balances[teamTokensWallet].add(teamTokens);

        // Issue bounty tokens
        balances[bountyTokensWallet] = balances[bountyTokensWallet].add(bountyTokens);

        // Issue presale tokens
        balances[presaleTokensWallet] = balances[presaleTokensWallet].add(presaleTokens);

        // Issue crowdsale tokens
        balances[crowdsaleTokensWallet] = balances[crowdsaleTokensWallet].add(crowdsaleTokens);

        state = TokensState.Presale;

        PresaleStarted();
    }

    function setCrowdsaleAddress(address _crowdsaleAddress) external onlyOwner {
        require(_crowdsaleAddress != address(0));
        crowdsaleContractAddress = _crowdsaleAddress;
    }

    function transferFromBountyWallet(address _to, uint256 _value) onlyOwner public returns (bool) {
        require(_to != address(0));
        require(balanceOf(bountyTokensWallet) >= _value);

        balances[bountyTokensWallet] = balances[bountyTokensWallet].sub(_value);
        balances[_to] = balances[_to].add(_value);

        Transfer(bountyTokensWallet, _to, _value);
        return true;
    }

    function transferFromPresale(address _to, uint256 _value) public returns (bool) {
        // Can be called by the owner or by the crowdsale contract
        require(msg.sender == crowdsaleContractAddress || msg.sender == owner);
        require(state == TokensState.Presale);
        require(_to != address(0));
        require(balanceOf(presaleTokensWallet) >= _value);

        balances[presaleTokensWallet] = balances[presaleTokensWallet].sub(_value);
        balances[_to] = balances[_to].add(_value);

        Transfer(presaleTokensWallet, _to, _value);
        return true;
    }

    // Method needed only on presale step and used for refill presale tokens
    // in case everything from presale tokens amount will be sold out
    function refillPresaleWallet(uint256 _value) onlyOwner public returns (bool) {
        require(state == TokensState.Presale);
        require(balanceOf(crowdsaleTokensWallet) >= _value);
        balances[crowdsaleTokensWallet] = balances[crowdsaleTokensWallet].sub(_value);
        balances[presaleTokensWallet] = balances[presaleTokensWallet].add(_value);

        Transfer(crowdsaleTokensWallet, presaleTokensWallet, _value);
        return true;
    }

    function transferFromCrowdsale(address _to, uint256 _value) onlyCrowdsaleContract external returns (bool) {
        require(state == TokensState.Crowdsale);
        require(_to != address(0));
        require(balanceOf(crowdsaleTokensWallet) >= _value);

        balances[crowdsaleTokensWallet] = balances[crowdsaleTokensWallet].sub(_value);
        balances[_to] = balances[_to].add(_value);

        Transfer(crowdsaleTokensWallet, _to, _value);
        return true;
    }

    function startCrowdsale() external onlyCrowdsaleContract {
        require(state == TokensState.PresaleEnded);
        state = TokensState.Crowdsale;
        CrowdsaleStarted();
    }

    function endCrowdsale() external onlyCrowdsaleContract {
        require(state == TokensState.Crowdsale);
        var crowdsaleLeftovers = balanceOf(crowdsaleTokensWallet);
        if (crowdsaleLeftovers > 0) {
            totalSupply = totalSupply.sub(crowdsaleLeftovers);
            balances[crowdsaleTokensWallet] = 0;
            CrowdsaleTokensBurnt(crowdsaleLeftovers);
        }

        state = TokensState.CrowdsaleEnded;
        CrowdsaleEnded();
    }

    function endPresale() external onlyCrowdsaleContract {
        require(state == TokensState.Presale);
        var presaleTokensLeftovers = balanceOf(presaleTokensWallet);
        if (presaleTokensLeftovers > 0) {
            if (!transferFromPresale(teamTokensWallet, presaleTokensLeftovers)) revert();
        }

        state = TokensState.PresaleEnded;
        PresaleEnded(presaleTokensLeftovers);
    }
}
