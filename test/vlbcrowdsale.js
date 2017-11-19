var VLBToken = artifacts.require("./VLBToken.sol");
var VLBCrowdsale = artifacts.require("./VLBCrowdsale.sol");
var VLBRefundVault = artifacts.require("./VLBRefundVault.sol");
var BigNumber = require("bignumber.js");

contract('VLBCrowdsale', function (accounts) {
    const wallet = "0x6aEeE7E0088C067641f8E5a8B83003a7040C65e5";
    const teamWallet = "0xb49fbbd01D8fF9a2bF46B7E4cB31CF8b8CFB96A9";
    const bountyTokenWallet = "0xfA81DD8Ed3610F2c872bD0a2b7dEd913dDDC1A47";
    const crowdsaleTokenWallet = "0x4A4A67ddbFbC5A6bbFFe07613fa0599b76f1CC21";
    const presaleBuyerAddress = "0x6AB20252Cc8fe103949ef6500C8e27f5c194375C";
    const crowdsaleBuyerAddress = "0x9dD1c94058c51E1A24c4598B1071fDcaf908205F";
    const owner = "0x156419fc32aB83B78421d3881397c2167A5FA552";
    const gamechangerBuyerAddress = "0xb0715271307d9749e7e12ce3ec66091f033f3240";
    const wingsWallet = "0x57f856B7314A73478FC01fbc76B92D4F2c2579bf";
    const gasAmount = 1500000;

    function form18DecimalsTo1(source) {
        return source.dividedBy(new BigNumber(10).pow(18)).toNumber();
    }

    // Move forward for 5 days (432000 sec)
    function quantumLeap() {
        web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [432000], id: 0});
    }

    it("Check initial balances", async() => {
        const token = await VLBToken.new({from: owner, gas: gasAmount});

        const teamBalance = await token.balanceOf(teamWallet, {from: teamWallet, gas: gasAmount});
        assert.equal(form18DecimalsTo1(teamBalance), 20000000, "Test #1: Insufficient balance on Team Tokens Wallet");

        const bountyBalance = await token.balanceOf(bountyTokenWallet, {from: bountyTokenWallet, gas: gasAmount});
        assert.equal(form18DecimalsTo1(bountyBalance), 10000000, "Test #1: Insufficient balance on Bounty Tokens Wallet");

        const crowdsaleBalance = await token.balanceOf(crowdsaleTokenWallet, {from: crowdsaleTokenWallet, gas: gasAmount});
        assert.equal(form18DecimalsTo1(crowdsaleBalance), 217500000, "Test #1: Insufficient balance on Crowdsale Tokens Wallet");
        
        // Check total supply
        const totalSupply = await token.totalSupply.call({from: owner, gas: gasAmount});
        assert.equal(form18DecimalsTo1(totalSupply), 250000000, "Insufficient totalSupply amount");
    });

    it("Check Presale flow", async() => {
        const token = await VLBToken.new({from: owner, gas: gasAmount});
        const vault = await VLBRefundVault.new({from: owner, gas: gasAmount});

        const tokensale = await VLBCrowdsale.new(
            token.address,
            vault.address,
            {from: owner, gas: gasAmount});

        token.setCrowdsaleAddress(tokensale.address, {from: owner, gas: gasAmount});
        vault.setCrowdsaleAddress(tokensale.address, {from: owner, gas: gasAmount});

        await tokensale.buyTokens(
            presaleBuyerAddress,
            {from: presaleBuyerAddress, value: web3.toWei("100", "ether"), gasLimit: gasAmount});

        // Buy tokens by 910 price
        const tokenBalance = await token.balanceOf.call(crowdsaleTokenWallet, {from: crowdsaleTokenWallet, gas: gasAmount});
        assert.equal(form18DecimalsTo1(tokenBalance), 217409000, "Test #2: Failed to transfer from Presale Tokens Wallet");

        // Buyer balance needs to be 910 * 300
        const buyerTokenBalance = await token.balanceOf.call(presaleBuyerAddress, {from: presaleBuyerAddress, gas: gasAmount});
        assert.equal(form18DecimalsTo1(buyerTokenBalance), 91000, "Test #2: Failed to transfer to Buyer Tokens Wallet");
    });

    it("Check Crowdsale flow", async() => {
        const token = await VLBToken.new({from: owner, gas: gasAmount});
        const vault = await VLBRefundVault.new({from: owner, gas: gasAmount});

        const tokensale = await VLBCrowdsale.new(
            token.address,
            vault.address,
            {from: owner, gas: gasAmount});

        token.setCrowdsaleAddress(tokensale.address, {from: owner, gas: gasAmount});
        vault.setCrowdsaleAddress(tokensale.address, {from: owner, gas: gasAmount});

        var crowdsaleBalance = await token.balanceOf.call(crowdsaleTokenWallet, {from: crowdsaleTokenWallet, gas: gasAmount});
        assert.equal(form18DecimalsTo1(crowdsaleBalance), 217500000, "Test #3: Insufficient balance on Crowdsale Tokens Wallet");

        var buyerBalance = await token.balanceOf.call(crowdsaleBuyerAddress, {from: crowdsaleBuyerAddress, gas: gasAmount});
        assert.equal(buyerBalance, 0, "Test #3: Failed to transfer to Buyer Tokens Wallet");

        // -> Tier #1 (845)
        await quantumLeap();

        await tokensale.buyTokens(
            crowdsaleBuyerAddress,
            {from: crowdsaleBuyerAddress, value: web3.toWei("20", "ether"), gasLimit: gasAmount});

        crowdsaleBalance = await token.balanceOf.call(crowdsaleTokenWallet, {from: crowdsaleTokenWallet, gas: gasAmount});
        assert.equal(form18DecimalsTo1(crowdsaleBalance), 217483100, "Test #3: Insufficient tier #1 balance on Crowdsale Tokens Wallet");

        buyerBalance = await token.balanceOf.call(crowdsaleBuyerAddress, {from: crowdsaleBuyerAddress, gas: gasAmount});
        assert.equal(form18DecimalsTo1(buyerBalance), 16900, "Test #3: Failed to transfer tier #1 to Buyer Tokens Wallet");

        // -> Tier #2 (780)
        await quantumLeap();

        await tokensale.buyTokens(
            crowdsaleBuyerAddress,
            {from: crowdsaleBuyerAddress, value: web3.toWei("20", "ether"), gasLimit: gasAmount});

        crowdsaleBalance = await token.balanceOf.call(crowdsaleTokenWallet, {from: crowdsaleTokenWallet, gas: gasAmount});
        assert.equal(form18DecimalsTo1(crowdsaleBalance), 217467500, "Test #3: Insufficient tier #2 balance on Crowdsale Tokens Wallet");

        buyerBalance = await token.balanceOf.call(crowdsaleBuyerAddress, {from: crowdsaleBuyerAddress, gas: gasAmount});
        assert.equal(form18DecimalsTo1(buyerBalance), 32500, "Test #3: Failed to transfer tier #2 to Buyer Tokens Wallet");

        // -> Tier #3 (710)
        await quantumLeap();

        await tokensale.buyTokens(
            crowdsaleBuyerAddress,
            {from: crowdsaleBuyerAddress, value: web3.toWei("20", "ether"), gasLimit: gasAmount});

        crowdsaleBalance = await token.balanceOf.call(crowdsaleTokenWallet, {from: crowdsaleTokenWallet, gas: gasAmount});
        assert.equal(form18DecimalsTo1(crowdsaleBalance), 217453200, "Test #3: Insufficient tier #3 balance on Crowdsale Tokens Wallet");

        buyerBalance = await token.balanceOf.call(crowdsaleBuyerAddress, {from: crowdsaleBuyerAddress, gas: gasAmount});
        assert.equal(form18DecimalsTo1(buyerBalance), 46800, "Test #3: Failed to transfer tier #3 to Buyer Tokens Wallet");

        // -> Tier #4 (650)
        await quantumLeap();

        await tokensale.buyTokens(
            crowdsaleBuyerAddress,
            {from: crowdsaleBuyerAddress, value: web3.toWei("20", "ether"), gasLimit: gasAmount});

        crowdsaleBalance = await token.balanceOf.call(crowdsaleTokenWallet, {from: crowdsaleTokenWallet, gas: gasAmount});
        assert.equal(form18DecimalsTo1(crowdsaleBalance), 217440200, "Test #3: Insufficient tier #4 balance on Crowdsale Tokens Wallet");

        buyerBalance = await token.balanceOf.call(crowdsaleBuyerAddress, {from: crowdsaleBuyerAddress, gas: gasAmount});
        assert.equal(form18DecimalsTo1(buyerBalance), 59800, "Test #3: Failed to transfer tier #4 to Buyer Tokens Wallet");
    });

    it("Check finalization flow", async() => {
        const token = await VLBToken.new({from: owner, gas: gasAmount});
        const vault = await VLBRefundVault.new({from: owner, gas: gasAmount});

        const tokensale = await VLBCrowdsale.new(
            token.address,
            vault.address,
            {from: owner, gas: gasAmount});

        vault.setCrowdsaleAddress(tokensale.address, {from: owner, gas: gasAmount});
        token.setCrowdsaleAddress(tokensale.address, {from: owner, gas: gasAmount});

        var crowdsaleBalance = await token.balanceOf.call(crowdsaleTokenWallet, {from: crowdsaleTokenWallet, gas: gasAmount});
        assert.equal(form18DecimalsTo1(crowdsaleBalance), 217500000, "Test #4: Insufficient balance on Crowdsale Tokens Wallet");

        var buyerBalance = await token.balanceOf.call(gamechangerBuyerAddress, {from: gamechangerBuyerAddress, gas: gasAmount});
        assert.equal(buyerBalance, 0, "Test #3: Failed to transfer to Buyer Tokens Wallet");

        await tokensale.buyTokens(
            gamechangerBuyerAddress,
            {from: gamechangerBuyerAddress, value: web3.toWei("25", "kether"), gasLimit: gasAmount});

        crowdsaleBalance = await token.balanceOf.call(crowdsaleTokenWallet, {from: crowdsaleTokenWallet, gas: gasAmount});
        assert.equal(form18DecimalsTo1(crowdsaleBalance), 201250000, "Test #4: Insufficient tier #4 balance on Crowdsale Tokens Wallet");

        buyerBalance = await token.balanceOf.call(gamechangerBuyerAddress, {from: gamechangerBuyerAddress, gas: gasAmount});
        assert.equal(form18DecimalsTo1(buyerBalance), 16250000, "Test #4: Failed to transfer tier #4 to Buyer Tokens Wallet");

        // -> Final
        await quantumLeap();

        await tokensale.finalize({from: owner, gas: gasAmount});

        crowdsaleBalance = await token.balanceOf.call(crowdsaleTokenWallet, {from: crowdsaleTokenWallet, gas: gasAmount});
        assert.equal(form18DecimalsTo1(crowdsaleBalance), 0, "Test #4: Insufficient final balance on Crowdsale Tokens Wallet");

        buyerBalance = await token.balanceOf.call(gamechangerBuyerAddress, {from: gamechangerBuyerAddress, gas: gasAmount});
        assert.equal(form18DecimalsTo1(buyerBalance), 16250000, "Test #4: Failed to final transfer to Buyer Tokens Wallet");

        const walletBalance = await web3.eth.getBalance(wallet);
        assert.equal(form18DecimalsTo1(walletBalance), 24750, "Test #4: Failed to verify wallet collected amount");

        // Check wings earnings
        const wingsEthBalance = await web3.eth.getBalance(wingsWallet);
        assert.equal(form18DecimalsTo1(wingsEthBalance), 250, "Test #4: Failed to verify wings.ai wallet collected amount");

        buyerBalance = await token.balanceOf.call(wingsWallet, {from: wingsWallet, gas: gasAmount});
        assert.equal(form18DecimalsTo1(buyerBalance), 462500, "Test #4: Failed to final transfer to wings.ai Tokens Wallet");

        // Check total supply
        const totalSupply = await token.totalSupply.call({from: owner, gas: gasAmount})
        assert.equal(form18DecimalsTo1(totalSupply), 46712500, "Innsificient total supplay amount on tokensale end");
    });
});
