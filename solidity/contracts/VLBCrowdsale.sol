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

    // All the time points relades to the Crowdsale
    // Presale is closed and reflected only as contract state

    // Start time: Nov 27, 2017, 09:00:00 GMT
    uint startTime = 1511773200;

    // End time: Dec 22, 2017 17:00:00 GMT, or the date when
    // 200’000’000 VLB Tokens have been sold, whichever occurs first
    uint endTime = 1513962000;

    // minimum amount of funds to be raised in weis
    uint256 goal = 25000000000000000000000; // 25 Kether

    // minimum amount of funds to be raised in weis
    uint256 cap = 300000000000000000000000; // 300 Kether

    // amount of raised money in wei
    uint256 public weiRaised;

    // tokensale finalization flag
    bool public isFinalized = false;

    // TODO: Fake addresses, replace to real
    address public constant teamTokensWallet = 0xb49fbbd01D8fF9a2bF46B7E4cB31CF8b8CFB96A9;
    address public constant bountyTokensWallet = 0xfA81DD8Ed3610F2c872bD0a2b7dEd913dDDC1A47;
    address public constant presaleTokensWallet = 0x995d3876d03CeC2Ae2Dc79dC29E066C9C0A1fBF8;
    address public constant crowdsaleTokensWallet = 0x4A4A67ddbFbC5A6bbFFe07613fa0599b76f1CC21;

    /**
     * event for token purchase logging
     * @param purchaser who paid for the tokens
     * @param beneficiary who got the tokens
     * @param value weis paid for purchase
     * @param amount amount of tokens purchased
     */
    event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);
    event Finalized();

    // Crowdsale in the constructor takes addresses of the
    // just deployed VLBToken and VLBRefundVault contracts
    // startTime and endTime here are temporary,
    // for testing purposes only
    function VLBCrowdsale(address _tokenAdsdress, address _vaultAddress, uint _startTime, uint _endTime) {
        require(_tokenAdsdress != address(0));
        require(_vaultAddress != address(0));
        require(_startTime > now && startTime < endTime);

        startTime = _startTime;
        endTime = _endTime;

        // VLBToken and VLBRefundVault was deployed separately
        token = VLBToken(_tokenAdsdress);
        vault = VLBRefundVault(_vaultAddress);
    }

    // fallback function can be used to buy tokens
    function() payable {
        buyTokens(msg.sender);
    }

    // You can buy tokens only in Crodsale state
    function buyTokens(address beneficiary) payable {
        require(state == TokensaleState.Crowdsale);
        require(beneficiary != address(0));
        require(validPurchase(msg.value));

        uint256 weiAmount = msg.value;

        // calculate token amount to be created
        uint256 tokens = weiAmount.mul(getConversionRate());

        // update state
        weiRaised = weiRaised.add(weiAmount);

        if (!token.transferFromCrowdsale(beneficiary, tokens)) revert();

        TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

        vault.deposit.value(msg.value)(msg.sender);
    }

    function startCrowdsale() onlyOwner public {
        require(state == TokensaleState.PresaleEnded);
        token.startCrowdsale();
        state = TokensaleState.Crowdsale;
    }

    // Addresses will be hardcoded. This method exist like this only for testing purposes.
     function startPresale() onlyOwner public {
        require(state == TokensaleState.Init);

        token.issueTokens(teamTokensWallet, bountyTokensWallet, presaleTokensWallet, crowdsaleTokensWallet);
        state = TokensaleState.Presale;
    }

    function endPresale() onlyOwner public {
        require(state == TokensaleState.Presale);
        token.endPresale();
        state = TokensaleState.PresaleEnded;
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
        return now > endTime && capReached;
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
        if (now > startTime + 15 days) {
            return 650;
            // 650
        }
        else if (now > startTime + 10 days) {
            return 715;
            // 650 + 10%
        }
        else if (now > startTime + 5 days) {
            return 780;
            // 650 + 20%
        }
        else if (now > startTime) {
            return 845;
            // 650 + 30%
        }

        return 650;
    }
}
