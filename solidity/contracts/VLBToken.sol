pragma solidity ^0.4.0;


import "./lib/token/StandardToken.sol";
import "./lib/ownership/Ownable.sol";
import "./lib/math/SafeMath.sol";


contract VLBToken is StandardToken, Ownable {
    using SafeMath for uint256;

    string public constant name = "VLB Tokens";
    string public constant symbol = "VLB";
    uint8 public decimals = 18;

    uint256 public presaleTokens;
    uint256 public crowdsaleTokens;
    uint256 public teamTokens;
    uint256 public bountyTokens;

    address public teamTokensWallet;
    address public bountyTokensWallet;
    address public presaleTokensWallet;
    address public crowdsaleTokensWallet;

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
        totalSupply = 250 * 10 ** 24;

        // 20 millions for presale
        presaleTokens = 20 * 10 ** 24;

        // 200 millions for ICO itself
        crowdsaleTokens = 200 * 10 ** 24;

        // 20 millions for the team
        teamTokens = 20 * 10 ** 24;

        // 10 millions as a bounty reward
        bountyTokens = 10 * 10 ** 24;
    }

    // Can be called only once
    function issueTokens(address _teamTokensWallet,
                         address _bountyTokensWallet,
                         address _presaleTokensWallet,
                         address _crowdsaleTokensWallet) external onlyCrowdsaleContract {

        require(state == TokensState.Init);
        require(_teamTokensWallet != address(0) && teamTokensWallet == address(0));
        require(_bountyTokensWallet != address(0) && bountyTokensWallet == address(0));
        require(_presaleTokensWallet != address(0) && presaleTokensWallet == address(0));
        require(_crowdsaleTokensWallet != address(0) && crowdsaleTokensWallet == address(0));

        teamTokensWallet = _teamTokensWallet;
        bountyTokensWallet = _bountyTokensWallet;
        presaleTokensWallet = _presaleTokensWallet;
        crowdsaleTokensWallet = _crowdsaleTokensWallet;

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
        // Can be called by the owner or by the corwdsale contract
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
        var presaleTokensLefovers = balanceOf(presaleTokensWallet);
        if (presaleTokensLefovers > 0) {
            if (!transferFromPresale(teamTokensWallet, presaleTokensLefovers)) revert();
        }

        state = TokensState.PresaleEnded;
        PresaleEnded(presaleTokensLefovers);
    }
}
