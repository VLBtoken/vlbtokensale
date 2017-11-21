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
     * @dev 2.5 millions as an initial wings.ai reward reserv
     */
    uint256 public constant wingsTokensReserv = 25 * 10 ** 23;
    
    /**
     * @dev wings.ai reward calculated on tokensale finalization
     */
    uint256 public wingsTokensReward = 0;

    // TODO: TestRPC addresses, replace to real
    address public constant teamTokensWallet = 0xb49fbbd01D8fF9a2bF46B7E4cB31CF8b8CFB96A9;
    address public constant bountyTokensWallet = 0xfA81DD8Ed3610F2c872bD0a2b7dEd913dDDC1A47;
    address public constant crowdsaleTokensWallet = 0x4A4A67ddbFbC5A6bbFFe07613fa0599b76f1CC21;
    
    /**
     * @dev wings.ai wallet for reward collecting
     */
    address public constant wingsWallet = 0x57f856B7314A73478FC01fbc76B92D4F2c2579bf;


    /**
     * @dev Address of Crowdsale contract which will be compared
     *       against in the appropriate modifier check
     */
    address public crowdsaleContractAddress;

    /**
     * @dev variable that holds flag of ended tokensake 
     */
    bool isFinished = false;

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
        Transfer(address(0), teamTokensWallet, teamTokens);

        // Issue bounty tokens
        balances[bountyTokensWallet] = balanceOf(bountyTokensWallet).add(bountyTokens);
        Transfer(address(0), bountyTokensWallet, bountyTokens);

        // Issue crowdsale tokens minus initial wings reward.
        // see endTokensale for more details about final wings.ai reward
        uint256 crowdsaleTokens = publicTokens.sub(wingsTokensReserv);
        balances[crowdsaleTokensWallet] = balanceOf(crowdsaleTokensWallet).add(crowdsaleTokens);
        Transfer(address(0), crowdsaleTokensWallet, crowdsaleTokens);

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

        // Allow crowdsale contract 
        uint256 balance = balanceOf(crowdsaleTokensWallet);
        allowed[crowdsaleTokensWallet][crowdsaleContractAddress] = balance;
        Approval(crowdsaleTokensWallet, crowdsaleContractAddress, balance);
    }

    /**
     * @dev called only by linked VLBCrowdsale contract to end crowdsale.
     *      all the unsold tokens will be burned and totalSupply updated
     *      but wings.ai reward will be secured in advance
     */
    function endTokensale() onlyCrowdsaleContract external {
        require(!isFinished);
        uint256 crowdsaleLeftovers = balanceOf(crowdsaleTokensWallet);
        
        if (crowdsaleLeftovers > 0) {
            totalSupply = totalSupply.sub(crowdsaleLeftovers).sub(wingsTokensReserv);
            wingsTokensReward = totalSupply.div(100);
            totalSupply = totalSupply.add(wingsTokensReward);

            balances[crowdsaleTokensWallet] = 0;
            Transfer(crowdsaleTokensWallet, address(0), crowdsaleLeftovers);
            TokensBurnt(crowdsaleLeftovers);
        } else {
            wingsTokensReward = wingsTokensReserv;
        }
        
        balances[wingsWallet] = balanceOf(wingsWallet).add(wingsTokensReward);
        Transfer(crowdsaleTokensWallet, wingsWallet, wingsTokensReward);

        isFinished = true;

        Live(totalSupply);
    }
}
