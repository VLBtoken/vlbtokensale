var VLBToken = artifacts.require("./VLBToken.sol");
var VLBCrowdsale = artifacts.require("./VLBCrowdsale.sol");
var VLBRefundVault = artifacts.require("./VLBRefundVault.sol");
var BigNumber = require("bignumber.js");

contract('VLBCrowdsale', function (accounts) {
    //const wallet = "0x6aEeE7E0088C067641f8E5a8B83003a7040C65e5";
    const teamWallet = "0xb49fbbd01D8fF9a2bF46B7E4cB31CF8b8CFB96A9";
    const bountyTokenWallet = "0xfA81DD8Ed3610F2c872bD0a2b7dEd913dDDC1A47";
    const presaleTokenWallet = "0x995d3876d03CeC2Ae2Dc79dC29E066C9C0A1fBF8";
    const crowdsaleTokenWallet = "0x4A4A67ddbFbC5A6bbFFe07613fa0599b76f1CC21";
    const presaleBuyerAddress = "0x6AB20252Cc8fe103949ef6500C8e27f5c194375C";
    //const crowdsaleBuyerAddress = "0x9dD1c94058c51E1A24c4598B1071fDcaf908205F";
    const owner = "0x156419fc32aB83B78421d3881397c2167A5FA552";
    const gasAmount = 4000000;

    function form18DecimalsTo1(source) {
        return source.dividedBy(new BigNumber(10).pow(18)).toNumber();
    }

    it("Check initial balances", async() => {
        const token = await VLBToken.new({from: owner, gas: gasAmount});
        const vault = await VLBRefundVault.new({from: owner, gas: gasAmount});

        var currentTime = currentTime = Math.floor(Date.now() / 1000);
        const tokensale = await VLBCrowdsale.new(
            token.address,
            vault.address,
            currentTime + 100,
            currentTime + 1000,
            {from: owner, gas: gasAmount});

        token.setCrowdsaleAddress(tokensale.address, {from: owner, gas: gasAmount});
        vault.setCrowdsaleAddress(vault.address, {from: owner, gas: gasAmount});

        await tokensale.startPresale({from: owner, gas: gasAmount});

        const teamBalance = await token.balanceOf(teamWallet, {from: teamWallet, gas: gasAmount});
        assert.equal(form18DecimalsTo1(teamBalance), 20000000, "Insufficient balance on Team Tokens Wallet");

        const bountyBalance = await token.balanceOf(bountyTokenWallet, {from: bountyTokenWallet, gas: gasAmount});
        assert.equal(form18DecimalsTo1(bountyBalance), 10000000, "Insufficient balance on Bounty Tokens Wallet");

        const presaleBalance = await token.balanceOf.call(presaleTokenWallet, {from: presaleTokenWallet, gas: gasAmount});
        assert.equal(form18DecimalsTo1(presaleBalance), 20000000, "Insufficient balance on Presale Tokens Wallet");

        const crowdsaleBalance = await token.balanceOf(crowdsaleTokenWallet, {from: crowdsaleTokenWallet, gas: gasAmount});
        assert.equal(form18DecimalsTo1(crowdsaleBalance), 200000000, "Insufficient balance on Crowdsale Tokens Wallet");
    });

    it("Check Presale flow", async() => {
        const token = await VLBToken.new({from: owner, gas: gasAmount});
        const vault = await VLBRefundVault.new({from: owner, gas: gasAmount});

        var currentTime = currentTime = Math.floor(Date.now() / 1000);
        const tokensale = await VLBCrowdsale.new(
            token.address,
            vault.address,
            currentTime + 100,
            currentTime + 1000,
            {from: owner, gas: gasAmount});

        token.setCrowdsaleAddress(tokensale.address, {from: owner, gas: gasAmount});
        vault.setCrowdsaleAddress(vault.address, {from: owner, gas: gasAmount});

        await tokensale.startPresale({from: owner, gas: gasAmount});

        await token.transferFromPresale(
            presaleBuyerAddress,
            web3.toWei("5", "mether"),
            {from: owner, gas: gasAmount});

        var presaleBalance = await token.balanceOf.call(presaleTokenWallet, {from: presaleTokenWallet, gas: gasAmount});
        assert.equal(form18DecimalsTo1(presaleBalance), 15000000, "Failed to transfer from Presale Tokens Wallet");

        const buyerBalance = await token.balanceOf.call(presaleBuyerAddress, {from: presaleBuyerAddress, gas: gasAmount});
        assert.equal(form18DecimalsTo1(buyerBalance), 5000000, "Failed to transfer to Buyer Tokens Wallet");

        await tokensale.endPresale({from: owner, gas: gasAmount});

        presaleBalance = await token.balanceOf.call(presaleTokenWallet, {from: presaleTokenWallet, gas: gasAmount});
        assert.equal(presaleBalance, 0, "Failed to transfer from Presale Tokens Wallet");

        const teamBalance = await token.balanceOf(teamWallet, {from: teamWallet, gas: gasAmount});
        assert.equal(form18DecimalsTo1(teamBalance), 35000000, "Insufficient balance on Team Tokens Wallet");
    });
});
