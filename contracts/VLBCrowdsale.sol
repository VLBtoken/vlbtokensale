pragma solidity ^0.4.15;


import "./lib/math/SafeMath.sol";
import "./lib/ownership/Ownable.sol";
import "./lib/lifecycle/Pausable.sol";
import "./VLBToken.sol";
import "./VLBRefundVault.sol";

/**
 * @title VLBCrowdsale
 * @dev VLB crowdsale contract borrows Zeppelin Finalized, Capped and Refundable crowdsales implementations
 */
contract VLBCrowdsale is Ownable, Pausable {
    using SafeMath for uint;

    /**
     * @dev token contract
     */
    VLBToken public token;

    /**
     * @dev refund vault used to hold funds while crowdsale is running
     */
    VLBRefundVault public vault;

    /**
     * @dev tokensale(presale) start time: Nov 22, 2017, 12:00:00 UTC (1511352000)
     */
    uint startTime = 1511352000;

    /**
     * @dev tokensale end time: Dec 17, 2017 12:00:00 UTC (1513512000), or the date when
     *       300’000 ether have been collected, whichever occurs first. see hasEnded()
     *       for more details
     */
    uint endTime = 1513512000;

    /**
     * @dev minimum purchase amount for presale
     */
    uint256 public constant minPresaleAmount = 100 * 10**18; // 100 ether

    /**
     * @dev minimum and maximum amount of funds to be raised in weis
     */
    uint256 public constant goal = 25 * 10**21;  // 25 Kether
    uint256 public constant cap  = 300 * 10**21; // 300 Kether

    /**
     * @dev amount of raised money in wei
     */
    uint256 public weiRaised;

    /**
     * @dev tokensale finalization flag
     */
    bool public isFinalized = false;

    /**
     * @dev event for token purchase logging
     * @param purchaser who paid for the tokens
     * @param beneficiary who got the tokens
     * @param value weis paid for purchase
     * @param amount amount of tokens purchased
     */
    event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

    /**
     * @dev event for tokensale final logging
     */
    event Finalized();

    /**
     * @dev Crowdsale in the constructor takes addresses of
     *      the just deployed VLBToken and VLBRefundVault contracts
     * @param _tokenAddress address of the VLBToken deployed contract
     * @param _vaultAddress address of the VLBRefundVault deployed contract
     */
    function VLBCrowdsale(address _tokenAddress, address _vaultAddress) {
        require(_tokenAddress != address(0));
        require(_vaultAddress != address(0));

        // VLBToken and VLBRefundVault was deployed separately
        token = VLBToken(_tokenAddress);
        vault = VLBRefundVault(_vaultAddress);
    }

    /**
     * @dev fallback function can be used to buy tokens
     */
    function() payable {
        buyTokens(msg.sender);
    }

    /**
     * @dev main function to buy tokens
     * @param beneficiary target wallet for tokens can vary from the sender one
     */
    function buyTokens(address beneficiary) public payable {
        require(beneficiary != address(0));
        require(validPurchase(msg.value));

        uint256 weiAmount = msg.value;

        // buyer and beneficiary could be two different wallets
        address buyer = msg.sender;

        // calculate token amount to be created
        uint256 tokens = weiAmount.mul(getConversionRate());

        weiRaised = weiRaised.add(weiAmount);

        if (!token.transferFrom(token.crowdsaleTokensWallet(), beneficiary, tokens)) {
            revert();
        }

        TokenPurchase(buyer, beneficiary, weiAmount, tokens);

        vault.deposit.value(weiAmount)(buyer);
    }

    /**
     * @dev check if the current purchase valid based on time and amount of passed ether
     * @param _value amount of passed ether
     * @return true if investors can buy at the moment
     */
    function validPurchase(uint256 _value) internal constant returns (bool) {
        bool nonZeroPurchase = _value != 0;
        bool withinPeriod = now >= startTime && now <= endTime;
        bool withinCap = weiRaised.add(_value) <= cap;
        // For presale we want to decline all payments less then minPresaleAmount
        bool withinAmount = now >= startTime + 5 days || msg.value >= minPresaleAmount;

        return nonZeroPurchase && withinPeriod && withinCap && withinAmount;
    }

    /**
     * @dev check if crowdsale still active based on current time and cap
     * @return true if crowdsale event has ended
     */
    function hasEnded() public constant returns (bool) {
        bool capReached = weiRaised >= cap;
        bool timeIsUp = now > endTime;
        return timeIsUp || capReached;
    }

    /**
     * @dev if crowdsale is unsuccessful, investors can claim refunds here
     */
    function claimRefund() public {
        require(isFinalized);
        require(!goalReached());

        vault.refund(msg.sender);
    }

    /**
     * @dev finalize crowdsale. this method triggers vault and token finalization
     */
    function finalize() onlyOwner public {
        require(!isFinalized);
        require(hasEnded());

        // trigger vault and token finalization
        if (goalReached()) {
            vault.close(token.wingsWallet());
        } else {
            vault.enableRefunds();
        }

        token.endTokensale();
        isFinalized = true;

        Finalized();
    }

    /**
     * @dev check if hard cap goal is reached
     */
    function goalReached() public constant returns (bool) {
        return weiRaised >= goal;
    }

    /**
     * @dev returns current token price based on current presale time frame
     */
    function getConversionRate() public constant returns (uint256) {
        if (now >= startTime + 20 days) {
            return 650;
            // 650        Crowdasle Part 4
        } else if (now >= startTime + 15 days) {
            return 715;
            // 650 + 10%. Crowdasle Part 3
        } else if (now >= startTime + 10 days) {
            return 780;
            // 650 + 20%. Crowdasle Part 2
        } else if (now >= startTime + 5 days) {
            return 845;
            // 650 + 30%. Crowdasle Part 1
        } else if (now >= startTime) {
            return 910;
            // 650 + 40%. Presale
        }
        return 0;
    }
}
