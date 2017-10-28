pragma solidity ^0.4.0;


import "./lib/math/SafeMath.sol";
import "./lib/ownership/Ownable.sol";
import "./lib/lifecycle/Pausable.sol";
import "./VLBToken.sol";
import "./VLBRefundVault.sol";


contract VLBCrowdsale is Ownable, Pausable {
    using SafeMath for uint;

    // Tokensale state machine
    enum TokensaleState {Init, Presale, PresaleEnded, Crowdsale, CrowdsaleEnded}
    TokensaleState public state;

    // Token contract
    VLBToken public token;

    // Refund vault used to hold funds while crowdsale is running
    VLBRefundVault public vault;

    // All the time points relates to the Crowdsale
    // Presale is closed and reflected only as contract state

    // Start time: Nov 27, 2017, 12:00:00 GMT (1511784000)
    uint startTime = 1511784000;

    // End time: Dec 17, 2017 12:00:00 GMT (1513512000), or the date when
    // 300’000 ether have been collected, whichever occurs first
    uint endTime = 1513512000;

    // minimum and maximum amount of funds to be raised in weis
    uint256 public constant goal = 25 * 10**21;  // 25 Kether
    uint256 public constant cap  = 300 * 10**21; // 300 Kether

    // amount of raised money in wei
    uint256 public weiRaised;

    // tokensale finalization flag
    bool public isFinalized = false;

    /**
     * event for token purchase logging
     * @param purchaser who paid for the tokens
     * @param beneficiary who got the tokens
     * @param value weis paid for purchase
     * @param amount amount of tokens purchased
     */
    event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);
    event PresaleForTokensaleStated();
    event PresaleForTokensaleEnded();
    event CrowdsaleForTokensaleStated();
    event Finalized();

    // Crowdsale in the constructor takes addresses of the
    // just deployed VLBToken and VLBRefundVault contracts
    // TODO: startTime and endTime here are temporary, for testing purposes only
    function VLBCrowdsale(address _tokenAddress, address _vaultAddress, uint _startTime, uint _endTime) {
        require(_tokenAddress != address(0));
        require(_vaultAddress != address(0));
        if (_startTime != 0 && _endTime != 0 && _startTime > now && _startTime < _endTime) {
            startTime = _startTime;
            endTime = _endTime;
        }

        // VLBToken and VLBRefundVault was deployed separately
        token = VLBToken(_tokenAddress);
        vault = VLBRefundVault(_vaultAddress);

        state = TokensaleState.Init;
    }

    // fallback function can be used to buy tokens
    function() payable {
        buyTokens(msg.sender);
    }

    // You can buy tokens only in Crowdsale state
    function buyTokens(address beneficiary) payable {
        require(state == TokensaleState.Crowdsale);
        require(beneficiary != address(0));
        require(validPurchase(msg.value));

        uint256 weiAmount = msg.value;
        address buyer = msg.sender;

        // calculate token amount to be created
        uint256 tokens = weiAmount.mul(getConversionRate());

        weiRaised = weiRaised.add(weiAmount);

        if (!token.transferFromCrowdsale(beneficiary, tokens)) revert();

        TokenPurchase(buyer, beneficiary, weiAmount, tokens);

        vault.deposit.value(weiAmount)(buyer);
    }

    function startCrowdsale() onlyOwner public {
        require(state == TokensaleState.PresaleEnded);
        require(now >= startTime);

        token.startCrowdsale();
        state = TokensaleState.Crowdsale;

        CrowdsaleForTokensaleStated();

    }

     function startPresale() onlyOwner public {
        require(state == TokensaleState.Init);

        token.issueTokens();
        state = TokensaleState.Presale;

        PresaleForTokensaleStated();
    }

    function endPresale() onlyOwner public {
        require(state == TokensaleState.Presale);
        token.endPresale();
        state = TokensaleState.PresaleEnded;

        PresaleForTokensaleEnded();
    }

    // @return true if investors can buy at the moment
    function validPurchase(uint256 _value) constant returns (bool) {
        bool withinPeriod = now >= startTime && now <= endTime;
        bool nonZeroPurchase = _value != 0;
        bool withinCap = weiRaised.add(_value) <= cap;
        return withinPeriod && nonZeroPurchase && withinCap;
    }

    // @return true if crowdsale event has ended
    function hasEnded() public constant returns (bool) {
        bool capReached = weiRaised >= cap;
        bool timeIsUp = now > endTime;
        return timeIsUp && capReached;
    }

    // if crowdsale is unsuccessful, investors can claim refunds here
    function claimRefund() public {
        require(isFinalized);
        require(!goalReached());

        vault.refund(msg.sender);
    }

    /**
     * @dev Must be called after crowdsale ends, to do some extra finalization
     * work. Calls the contract's finalization function.
    */
    function finalize() onlyOwner public {
        require(!isFinalized);
        require(hasEnded());
        require(state == TokensaleState.Crowdsale);

        finalization();
        Finalized();

        isFinalized = true;
    }

    // vault finalization task, called when owner calls finalize()
    function finalization() internal {
        if (goalReached()) {
            vault.close();
        }
        else {
            vault.enableRefunds();
        }

        token.endCrowdsale();
        state = TokensaleState.CrowdsaleEnded;
    }

    function goalReached() public constant returns (bool) {
        return weiRaised >= goal;
    }

    function getConversionRate() public constant returns (uint256) {
        if (now >= startTime + 15 days) {
            return 650;
            // 650
        }
        else if (now >= startTime + 10 days) {
            return 715;
            // 650 + 10%
        }
        else if (now >= startTime + 5 days) {
            return 780;
            // 650 + 20%
        }
        else if (now >= startTime) {
            return 845;
            // 650 + 30%
        }

        return 650;
    }
}
