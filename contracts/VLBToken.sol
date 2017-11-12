pragma solidity ^0.4.15;

import "./lib/token/StandardToken.sol";
import "./lib/ownership/Ownable.sol";
import "./lib/math/SafeMath.sol";

/**
 * @title VLBTokens
 * @dev VLB Token contract based on Zeppelin StandardToken contract
 */
contract VLBToken is StandardToken, Ownable {
    using SafeMath for uint256;

    /**
     * @dev ERC20 descriptor variables
     */
    string public constant name = "VLB Tokens";
    string public constant symbol = "VLB";
    uint8 public decimals = 18;

    /**
     * @dev 220 millions is the initial Tokensale supply
     */
    uint256 public constant publicTokens = 220 * 10 ** 24;

    /**
     * @dev 20 millions for the team
     */
    uint256 public constant teamTokens = 20 * 10 ** 24;

    /**
     * @dev 10 millions as a bounty reward
     */
    uint256 public constant bountyTokens = 10 * 10 ** 24;

    /**
     * @dev 2.5 millions as an initial wings.ai reward
     */
    uint256 public constant wingsTokens = 25 * 10 ** 23;

    // TODO: TestRPC addresses, replace to real
    address public constant teamTokensWallet = 0xb49fbbd01D8fF9a2bF46B7E4cB31CF8b8CFB96A9;
    address public constant bountyTokensWallet = 0xfA81DD8Ed3610F2c872bD0a2b7dEd913dDDC1A47;
    address public constant crowdsaleTokensWallet = 0x4A4A67ddbFbC5A6bbFFe07613fa0599b76f1CC21;

    /**
     * @dev Address of Crowdsale contract which will be compared
     *       against in the appropriate modifier check
     */
    address public crowdsaleContractAddress;

    /**
     * @dev Modifier that allow only the Crowdsale contract to be sender
     */
    modifier onlyCrowdsaleContract() {
        require(msg.sender == crowdsaleContractAddress);
        _;
    }

    /**
     * @dev event for the burnt tokens after crowdsale logging
     * @param tokens amount of tokens available for crowdsale
     */
    event TokensBurnt(uint256 tokens);

    /**
     * @dev event for the tokens contract move to the active state logging
     * @param supply amount of tokens left after all the unsold was burned
     */
    event Live(uint256 supply);

    /**
     * @dev event for bounty tone transfer logging
     * @param from the address of bounty tokens wallet
     * @param to the address of beneficiary tokens wallet
     * @param value amount of tokens
     */
    event BountyTransfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Contract constructor
     */
    function VLBToken() {
        // Issue team tokens
        balances[teamTokensWallet] = balanceOf(teamTokensWallet).add(teamTokens);

        // Issue bounty tokens
        balances[bountyTokensWallet] = balanceOf(bountyTokensWallet).add(bountyTokens);

        // Issue crowdsale tokens minus initial wings reward.
        // see endTokensale for more details about final wings.ai reward
        balances[crowdsaleTokensWallet] = balanceOf(crowdsaleTokensWallet).add(publicTokens.sub(wingsTokens));

        // 250 millions tokens overall
        totalSupply = publicTokens.add(bountyTokens).add(teamTokens);
    }

    /**
     * @dev back link VLBToken contract with VLBCrowdsale one
     * @param _crowdsaleAddress non zero address of VLBCrowdsale contract
     */
    function setCrowdsaleAddress(address _crowdsaleAddress) onlyOwner external {
        require(_crowdsaleAddress != address(0));
        crowdsaleContractAddress = _crowdsaleAddress;
    }

    /**
     * @dev called only by linked VLBCrowdsale contract to end crowdsale.
     *      all the unsold tokens will be burned and totalSupply updated
     *      but wings.ai reward will be secured in advance
     * @param _wingsWallet address of wings.ai wallet for token reward collection
     */
    function endTokensale(address _wingsWallet) onlyCrowdsaleContract external {
        require(_wingsWallet != address(0));
        uint256 crowdsaleLeftovers = balanceOf(crowdsaleTokensWallet);
        uint256 wingsReward = wingsTokens;
        if (crowdsaleLeftovers > 0) {
            totalSupply = totalSupply.sub(crowdsaleLeftovers);
            wingsReward = totalSupply.div(100);

            balances[crowdsaleTokensWallet] = 0;
            TokensBurnt(crowdsaleLeftovers);
        }
        balances[_wingsWallet] = balanceOf(_wingsWallet).add(wingsReward);

        Live(totalSupply);
    }

    /**
     * @dev manually transfer tokens from tokensale bounty wallet to hunter who earned it
     * @param _to bounty hunter wallet
     * @param _value amount of tokens
     */
    function transferFromBountyWallet(address _to, uint256 _value) onlyOwner external returns (bool) {
        require(_to != address(0));
        require(balanceOf(bountyTokensWallet) >= _value);

        balances[bountyTokensWallet] = balanceOf(bountyTokensWallet).sub(_value);
        balances[_to] = balanceOf(_to).add(_value);

        BountyTransfer(bountyTokensWallet, _to, _value);
        return true;
    }

    /**
     * @dev transfer tokens from tokensale wallet to buyer wallet.
     *       Called only from linked VLBCrowdsale contract
     * @param _to buyer wallet
     * @param _value amount of tokens
     */
    function transferFromCrowdsale(address _to, uint256 _value) onlyCrowdsaleContract external returns (bool) {
        require(_to != address(0));
        require(balanceOf(crowdsaleTokensWallet) >= _value);

        balances[crowdsaleTokensWallet] = balanceOf(crowdsaleTokensWallet).sub(_value);
        balances[_to] = balanceOf(_to).add(_value);

        Transfer(crowdsaleTokensWallet, _to, _value);
        return true;
    }
}
