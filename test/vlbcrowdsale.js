/* jshint ignore: start */

var VLBToken = artifacts.require("./VLBToken.sol");
var VLBCrowdsale = artifacts.require("./VLBCrowdsale.sol");
var BigNumber = require("bignumber.js");
var env = require("../env.js");

contract('VLBCrowdsale', function (accounts) {

    function form18DecimalsTo1(source) {
        return source.dividedBy(new BigNumber(10).pow(18)).toNumber();
    }

    // Move forward
    function quantumLeap(days) {
        web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [86400 * days], id: 0});
    }

    it("Check initial balances", async() => {
        const token = await VLBToken.new(
            env.crowdsale.accounts.crowdsaleTokenWallet, 
            {from: env.tests.accounts.owner, gas: env.network.gasAmount});

        const crowdsaleBalance = await token.balanceOf.call(
            env.crowdsale.accounts.crowdsaleTokenWallet, 
            {from: env.crowdsale.accounts.crowdsaleTokenWallet, gas: env.network.gasAmount});

        assert.equal(form18DecimalsTo1(crowdsaleBalance), 175000000, "Wrong balance on tokens wallet");
        
        // Check total supply
        const totalSupply = await token.totalSupply.call({from: env.tests.accounts.owner, gas: env.network.gasAmount});
        assert.equal(form18DecimalsTo1(totalSupply), 175000000, "Wrong totalSupply amount");
    });

    it("Check burn tokens", async() => {
        const token = await VLBToken.new(
            env.crowdsale.accounts.crowdsaleTokenWallet, 
            {from: env.tests.accounts.owner, gas: env.network.gasAmount});

        var crowdsaleBalance = await token.balanceOf.call(
            env.crowdsale.accounts.crowdsaleTokenWallet, 
            {from: env.crowdsale.accounts.crowdsaleTokenWallet, gas: env.network.gasAmount});

        assert.equal(form18DecimalsTo1(crowdsaleBalance), 175000000, "Wrong balance on tokens wallet before burn");

        await token.burn(web3.toWei("5", "mether"), {from: env.crowdsale.accounts.crowdsaleTokenWallet, gas: env.network.gasAmount});
        
        crowdsaleBalance = await token.balanceOf.call(
            env.crowdsale.accounts.crowdsaleTokenWallet, 
            {from: env.crowdsale.accounts.crowdsaleTokenWallet, gas: env.network.gasAmount});

        assert.equal(form18DecimalsTo1(crowdsaleBalance), 170000000, "Wrong balance on tokens wallet after burn");
    });

    it("Check transfer tokens", async() => {
        const token = await VLBToken.new(
            env.crowdsale.accounts.crowdsaleTokenWallet, 
            {from: env.tests.accounts.owner, gas: env.network.gasAmount});

        // Transfer 500'000 tokens
        await token.transfer(
            env.tests.accounts.privateBuyerAddress, 
            web3.toWei("500", "kether"), 
            {from: env.crowdsale.accounts.crowdsaleTokenWallet, gas: env.network.gasAmount});

        var balance = await token.balanceOf.call(
            env.crowdsale.accounts.crowdsaleTokenWallet, 
            {from:env.crowdsale.accounts.crowdsaleTokenWallet, gas: env.network.gasAmount});

        assert.equal(form18DecimalsTo1(balance), 174500000, "Failed to transfer tokens from tokens wallet to beneficiary");    

        balance = await token.balanceOf.call(
            env.tests.accounts.privateBuyerAddress, 
            {from: env.tests.accounts.privateBuyerAddress, gas: env.network.gasAmount});

        assert.equal(form18DecimalsTo1(balance), 500000, "Wrong balance beneficiary wallet after tarnsfer");
    });

    it("Check presale flow", async() => {
        const token = await VLBToken.new(
            env.crowdsale.accounts.crowdsaleTokenWallet, 
            {from: env.tests.accounts.owner, gas: env.network.gasAmount});

        const tokensale = await VLBCrowdsale.new(
            token.address,
            env.crowdsale.accounts.wallet,
            env.crowdsale.accounts.escrow,
            env.crowdsale.ETHUSD,
            {from: env.tests.accounts.owner, gas: env.network.gasAmount});

        await token.approve(
            tokensale.address, 
            env.crowdsale.allowance(web3), 
            {from: env.crowdsale.accounts.crowdsaleTokenWallet, gas: env.network.gasAmount});

        await tokensale.addRate(
            env.tests.accounts.returningPresaleBuyerAddress, 
            120, 
            {from: env.tests.accounts.owner, gas: env.network.gasAmount});

        await tokensale.buyTokens(
            env.tests.accounts.returningPresaleBuyerAddress,
            {from: env.tests.accounts.returningPresaleBuyerAddress, value: web3.toWei("500", "finney"), gasLimit: env.network.gasAmount});

        var tokenBalance = await token.balanceOf.call(
            env.crowdsale.accounts.crowdsaleTokenWallet, 
            {from: env.crowdsale.accounts.crowdsaleTokenWallet, gas: env.network.gasAmount});

        assert.equal(form18DecimalsTo1(tokenBalance), 174999493, "Failed to sell tokens to returning buyer, wrong balance on tokens wallet");

        var buyerTokenBalance = await token.balanceOf.call(
            env.tests.accounts.returningPresaleBuyerAddress, 
            {from: env.tests.accounts.returningPresaleBuyerAddress, gas: env.network.gasAmount});

        assert.equal(form18DecimalsTo1(buyerTokenBalance), 507, "Failed to buy tokens, wrong balance on returning buyer wallet");

        await tokensale.buyTokens(
            env.tests.accounts.returningPresaleBuyerAddress,
            {from: env.tests.accounts.returningPresaleBuyerAddress, value: web3.toWei("10", "ether"), gasLimit: env.network.gasAmount});

        tokenBalance = await token.balanceOf.call(
            env.crowdsale.accounts.crowdsaleTokenWallet, 
            {from: env.crowdsale.accounts.crowdsaleTokenWallet, gas: env.network.gasAmount});

        assert.equal(form18DecimalsTo1(tokenBalance), 174991043, "Failed to second sell tokens to returning buyer, wrong balance on tokens wallet");

        buyerTokenBalance = await token.balanceOf.call(
            env.tests.accounts.returningPresaleBuyerAddress, 
            {from: env.tests.accounts.returningPresaleBuyerAddress, gas: env.network.gasAmount});

        assert.equal(form18DecimalsTo1(buyerTokenBalance), 8957, "Failed to buy tokens, wrong balance on presale buyer wallet");

        await tokensale.buyTokens(
            env.tests.accounts.privateBuyerAddress,
            {from: env.tests.accounts.privateBuyerAddress, value: web3.toWei("100", "ether"), gasLimit: env.network.gasAmount});

        tokenBalance = await token.balanceOf.call(
            env.crowdsale.accounts.crowdsaleTokenWallet, 
            {from: env.crowdsale.accounts.crowdsaleTokenWallet, gas: env.network.gasAmount});

        assert.equal(form18DecimalsTo1(tokenBalance), 174906543, "Failed to sell tokens to preslae buyer, wrong balance on tokens wallet");

        buyerTokenBalance = await token.balanceOf.call(
            env.tests.accounts.privateBuyerAddress, 
            {from: env.tests.accounts.privateBuyerAddress, gas: env.network.gasAmount});

        assert.equal(form18DecimalsTo1(buyerTokenBalance), 84500, "Failed to buy tokens, wrong balance on presale buyer wallet");
    });

    it("Check min cap flow", async() => {
        const token = await VLBToken.new(
            env.crowdsale.accounts.crowdsaleTokenWallet, 
            {from: env.tests.accounts.owner, gas: env.network.gasAmount});
        
        const tokensale = await VLBCrowdsale.new(
            token.address,
            env.crowdsale.accounts.wallet,
            env.crowdsale.accounts.escrow,
            env.crowdsale.ETHUSD,
            {from: env.tests.accounts.owner, gas: env.network.gasAmount});

        await token.approve(
            tokensale.address, 
            env.crowdsale.allowance(web3), 
            {from: env.crowdsale.accounts.crowdsaleTokenWallet, gas: env.network.gasAmount});

        await tokensale.buyTokens(
            env.tests.accounts.gamechangerBuyerAddress,
            {from: env.tests.accounts.gamechangerBuyerAddress, value: web3.toWei("9", "kether"), gasLimit: env.network.gasAmount}); 

        var buyerBalance = await token.balanceOf.call(
            env.tests.accounts.gamechangerBuyerAddress, 
            {from: env.tests.accounts.gamechangerBuyerAddress, gas: env.network.gasAmount});
            
        assert.equal(form18DecimalsTo1(buyerBalance), 7605000, "Failed to buy tokens, wrong balance on buyer wallet");
    
        var crowdsaleBalance = await token.balanceOf.call(
            env.crowdsale.accounts.crowdsaleTokenWallet, 
            {from: env.crowdsale.accounts.crowdsaleTokenWallet, gas: env.network.gasAmount});

        assert.equal(form18DecimalsTo1(crowdsaleBalance), 167395000, "Failed to sell tokens, wrong balance on crowdsale wallet");

        await tokensale.updateExchangeRate(2000, {from: env.crowdsale.accounts.escrow, gasLimit: env.network.gasAmount});
        
        var isThrowed = false;
        try {
            await tokensale.unholdFunds({from: env.tests.accounts.owner, gas: env.network.gasAmount});
        } catch (e) {
            isThrowed = true;
        }

        assert.equal(isThrowed, true, "Should throw since ETH x USD is too low")

        await tokensale.updateExchangeRate(env.crowdsale.ETHUSD, {from: env.crowdsale.accounts.escrow, gasLimit: env.network.gasAmount});
        await tokensale.unholdFunds({from: env.tests.accounts.owner, gas: env.network.gasAmount});

        var walletBalance = await web3.eth.getBalance(env.crowdsale.accounts.wallet);
        assert.equal(form18DecimalsTo1(walletBalance), 9000, "Failed to unhold funds, wrong wallet collected amount");

        await tokensale.buyTokens(
            env.tests.accounts.gamechangerBuyerAddress,
            {from: env.tests.accounts.gamechangerBuyerAddress, value: web3.toWei("1", "kether"), gasLimit: env.network.gasAmount});

        buyerBalance = await token.balanceOf.call(
            env.tests.accounts.gamechangerBuyerAddress, 
            {from: env.tests.accounts.gamechangerBuyerAddress, gas: env.network.gasAmount});

        assert.equal(form18DecimalsTo1(buyerBalance), 8450000, "Failed to but tokens second time, wrong balance on buyer amount");
    
        crowdsaleBalance = await token.balanceOf.call(
            env.crowdsale.accounts.crowdsaleTokenWallet, 
            {from: env.crowdsale.accounts.crowdsaleTokenWallet, gas: env.network.gasAmount});

        assert.equal(form18DecimalsTo1(crowdsaleBalance), 166550000, "Failed to sell tokens second time, wrong balance on crowdsale wallet");

        await tokensale.updateExchangeRate(2000, {from: env.crowdsale.accounts.escrow, gasLimit: env.network.gasAmount});
        
        await tokensale.unholdFunds({from: env.tests.accounts.owner, gas: env.network.gasAmount});

        walletBalance = await web3.eth.getBalance(env.crowdsale.accounts.wallet);
        assert.equal(form18DecimalsTo1(walletBalance), 10000, "Failed to unhold funds second time, wrong wallet collected amount");

        //await tokensale.updateExchangeRate(env.crowdsale.ETHUSD, {from: env.crowdsale.accounts.escrow, gasLimit: env.network.gasAmount});
    });    

    it("Check discount tiers flow", async() => {
        const token = await VLBToken.new(
            env.crowdsale.accounts.crowdsaleTokenWallet, 
            {from: env.tests.accounts.owner, gas: env.network.gasAmount});
        
        const tokensale = await VLBCrowdsale.new(
            token.address,
            env.crowdsale.accounts.wallet,
            env.crowdsale.accounts.escrow,
            env.crowdsale.ETHUSD,
            {from: env.tests.accounts.owner, gas: env.network.gasAmount});

        await token.approve(
            tokensale.address, 
            env.crowdsale.allowance(web3), 
            {from: env.crowdsale.accounts.crowdsaleTokenWallet, gas: env.network.gasAmount});
        
        var crowdsaleBalance = await token.balanceOf.call(
            env.crowdsale.accounts.crowdsaleTokenWallet, 
            {from: env.crowdsale.accounts.crowdsaleTokenWallet, gas: env.network.gasAmount});

        assert.equal(form18DecimalsTo1(crowdsaleBalance), 175000000, "Wrong balance on crowdsale wallet");

        var buyerBalance = await token.balanceOf.call(
            env.tests.accounts.frequentBuyer, 
            {from: env.tests.accounts.frequentBuyer, gas: env.network.gasAmount});

        assert.equal(buyerBalance, 0, "Failed to check buyer initial ballance");

        // -> Tier #1 (845)
        await quantumLeap(50);

        await tokensale.buyTokens(
            env.tests.accounts.frequentBuyer,
            {from: env.tests.accounts.frequentBuyer, value: web3.toWei("50", "ether"), gasLimit: env.network.gasAmount});

        crowdsaleBalance = await token.balanceOf.call(
            env.crowdsale.accounts.crowdsaleTokenWallet, 
            {from: env.crowdsale.accounts.crowdsaleTokenWallet, gas: env.network.gasAmount});

        assert.equal(form18DecimalsTo1(crowdsaleBalance), 174957750, "Failed to sell tier #1 tokens, wrong balance on crowdsale wallet");

        buyerBalance = await token.balanceOf.call(
            env.tests.accounts.frequentBuyer, 
            {from: env.tests.accounts.frequentBuyer, gas: env.network.gasAmount});

        assert.equal(form18DecimalsTo1(buyerBalance), 42250, "Failed to buy tier #1 tokens, wrong ballance on buyer wallet");

        // -> Tier #2 (780)
        await quantumLeap(35);

        await tokensale.buyTokens(
            env.tests.accounts.frequentBuyer,
            {from: env.tests.accounts.frequentBuyer, value: web3.toWei("50", "ether"), gasLimit: env.network.gasAmount});

        crowdsaleBalance = await token.balanceOf.call(
            env.crowdsale.accounts.crowdsaleTokenWallet, 
            {from: env.crowdsale.accounts.crowdsaleTokenWallet, gas: env.network.gasAmount});
            
        assert.equal(form18DecimalsTo1(crowdsaleBalance), 174918750, "Failed to sell tier #2 tokens, wrong balance on crowdsale wallet");

        buyerBalance = await token.balanceOf.call(
            env.tests.accounts.frequentBuyer, 
            {from: env.tests.accounts.frequentBuyer, gas: env.network.gasAmount});
        assert.equal(form18DecimalsTo1(buyerBalance), 81250, "Failed to buy tier #2 tokens, wrong ballance on buyer wallet");

        // -> Tier #3 (715)
        await quantumLeap(7);

        await tokensale.buyTokens(
            env.tests.accounts.frequentBuyer,
            {from: env.tests.accounts.frequentBuyer, value: web3.toWei("50", "ether"), gasLimit: env.network.gasAmount});

        crowdsaleBalance = await token.balanceOf.call(
            env.crowdsale.accounts.crowdsaleTokenWallet, 
            {from: env.crowdsale.accounts.crowdsaleTokenWallet, gas: env.network.gasAmount});

        assert.equal(form18DecimalsTo1(crowdsaleBalance), 174883000, "Failed to sell tier #3 tokens, wrong balance on crowdsale wallet");

        buyerBalance = await token.balanceOf.call(env.tests.accounts.frequentBuyer, {from: env.tests.accounts.frequentBuyer, gas: env.network.gasAmount});
        assert.equal(form18DecimalsTo1(buyerBalance), 117000, "Failed to buy tier #3 tokens, wrong ballance on buyer wallet");

        // -> Tier #4 (650)
        await quantumLeap(7);

        await tokensale.buyTokens(
            env.tests.accounts.frequentBuyer,
            {from: env.tests.accounts.frequentBuyer, value: web3.toWei("50", "ether"), gasLimit: env.network.gasAmount});

        crowdsaleBalance = await token.balanceOf.call(
            env.crowdsale.accounts.crowdsaleTokenWallet, 
            {from: env.crowdsale.accounts.crowdsaleTokenWallet, gas: env.network.gasAmount});

        assert.equal(form18DecimalsTo1(crowdsaleBalance), 174850500, "Failed to sell tier #4 tokens, wrong balance on crowdsale wallet");

        buyerBalance = await token.balanceOf.call(
            env.tests.accounts.frequentBuyer, 
            {from: env.tests.accounts.frequentBuyer, gas: env.network.gasAmount});
        assert.equal(form18DecimalsTo1(buyerBalance), 149500, "Failed to buy tier #4 tokens, wrong ballance on buyer wallet");

        // -> Tier #4 (500)
        await quantumLeap(7);
        
        await tokensale.buyTokens(
            env.tests.accounts.frequentBuyer,
            {from: env.tests.accounts.frequentBuyer, value: web3.toWei("50", "ether"), gasLimit: env.network.gasAmount});

        crowdsaleBalance = await token.balanceOf.call(
            env.crowdsale.accounts.crowdsaleTokenWallet, 
            {from: env.crowdsale.accounts.crowdsaleTokenWallet, gas: env.network.gasAmount});

        assert.equal(form18DecimalsTo1(crowdsaleBalance), 174825500, "Failed to sell tier #5 tokens, wrong balance on crowdsale wallet");

        buyerBalance = await token.balanceOf.call(
            env.tests.accounts.frequentBuyer, 
            {from: env.tests.accounts.frequentBuyer, gas: env.network.gasAmount});

        assert.equal(form18DecimalsTo1(buyerBalance), 174500, "Failed to buy tier #5 tokens, wrong ballance on buyer wallet");
                
    });

    it("Check refund flow", async() => {
        const token = await VLBToken.new(env.crowdsale.accounts.crowdsaleTokenWallet, {from: env.tests.accounts.owner, gas: env.network.gasAmount});
        
        const tokensale = await VLBCrowdsale.new(
            token.address,
            env.tests.accounts.refundWallet,
            env.crowdsale.accounts.escrow,
            env.crowdsale.ETHUSD,
           {from: env.tests.accounts.owner, gas: env.network.gasAmount});

        await token.approve(
            tokensale.address, 
            env.crowdsale.allowance(web3), 
            {from: env.crowdsale.accounts.crowdsaleTokenWallet, gas: env.network.gasAmount});

        await tokensale.buyTokens(
            env.tests.accounts.gamechangerBuyerAddress,
            {from: env.tests.accounts.gamechangerBuyerAddress, value: web3.toWei("5", "kether"), gasLimit: env.network.gasAmount});

        var buyerBalance = await token.balanceOf.call(
            env.tests.accounts.gamechangerBuyerAddress, 
            {from: env.tests.accounts.gamechangerBuyerAddress, gas: env.network.gasAmount});

        assert.equal(form18DecimalsTo1(buyerBalance), 2500000, "Failed to buy tokens, wrong balance on buyer account");
    
        var crowdsaleBalance = await token.balanceOf.call(
            env.crowdsale.accounts.crowdsaleTokenWallet, 
            {from: env.crowdsale.accounts.crowdsaleTokenWallet, gas: env.network.gasAmount});
        assert.equal(form18DecimalsTo1(crowdsaleBalance), 172500000, "Failed to sell tokens, wrong balance on tokens wallet");

        await quantumLeap(7);
        
        await tokensale.finalize({from: env.tests.accounts.owner, gas: env.network.gasAmount});

        var balance = await web3.eth.getBalance(env.tests.accounts.refundWallet);
        assert.equal(form18DecimalsTo1(balance), 0, "Failed to verify wallet collected amount after finalization");

        balance = await web3.eth.getBalance(env.tests.accounts.gamechangerBuyerAddress);
        assert.ok(form18DecimalsTo1(balance) > 10990 && form18DecimalsTo1(balance) < 11000, "Failed to verify buyer wallet balance");

        await tokensale.claimRefund({from: env.tests.accounts.gamechangerBuyerAddress, gas: env.network.gasAmount});

        balance = await web3.eth.getBalance(env.tests.accounts.refundWallet);
        assert.equal(form18DecimalsTo1(balance), 0, "Failed to verify refunder wallet collected amount");

        balance = await web3.eth.getBalance(env.tests.accounts.gamechangerBuyerAddress);
        assert.ok(form18DecimalsTo1(balance) > 15900 && form18DecimalsTo1(balance) < 16000, "Failed to verify wallet collected amount");
        
     });
});

/* jshint ignore: end */
