var VLBToken = artifacts.require("./VLBToken.sol");
var VLBCrowdsale = artifacts.require("./VLBCrowdsale.sol");
var BigNumber = require("bignumber.js");

contract('VLBCrowdsale', function (accounts) {
    //const wallet = "0x6aEeE7E0088C067641f8E5a8B83003a7040C65e5";
    const teamWallet = "0xb49fbbd01D8fF9a2bF46B7E4cB31CF8b8CFB96A9";
    const bountyTokenWallet = "0xfA81DD8Ed3610F2c872bD0a2b7dEd913dDDC1A47";
    const presaleTokenWallet = "0x995d3876d03CeC2Ae2Dc79dC29E066C9C0A1fBF8";
    const crowdsaleTokenWallet = "0x4A4A67ddbFbC5A6bbFFe07613fa0599b76f1CC21";
    const presaleBuyerAddress = "0x6AB20252Cc8fe103949ef6500C8e27f5c194375C";
    //const crowdsaleBuyerAddress = "0x9dD1c94058c51E1A24c4598B1071fDcaf908205F";
    const gasAmount = 4000000;

    function form18DecimalsTo1(source) {
        return source.dividedBy(new BigNumber(10).pow(18)).toNumber();
    }

    it("Check initial balances", function () {
        var token = VLBToken.at(VLBToken.address);
        Promise.resolve(token.balanceOf(teamWallet, {from: teamWallet, gas: gasAmount})).then(function (value) {
            assert.equal(form18DecimalsTo1(value), 20000000, "Insufficient balance on Team Tokens Wallet");
        });

        Promise.resolve(token.balanceOf(bountyTokenWallet, {from: bountyTokenWallet, gas: gasAmount})).then(function (value) {
            assert.equal(form18DecimalsTo1(value), 10000000, "Insufficient balance on Bounty Tokens Wallet");
        });

        Promise.resolve(token.balanceOf(presaleTokenWallet, {from: presaleTokenWallet, gas: gasAmount})).then(function (value) {
            assert.equal(form18DecimalsTo1(value), 20000000, "Insufficient balance on Presale Tokens Wallet");
        });

        Promise.resolve(token.balanceOf(crowdsaleTokenWallet, {from: crowdsaleTokenWallet, gas: gasAmount})).then(function (value) {
            assert.equal(form18DecimalsTo1(value), 200000000, "Insufficient balance on Crowdsale Tokens Wallet");
        });
    });
    
    it("Transfer presale tokens", function () {
        var tokenInstance;
        var buyerBalance;
        VLBToken.deployed().then(function (instance) {
            tokenInstance = instance;
            return tokenInstance.transferFromPresale(presaleBuyerAddress, web3.toWei("2", "mether"));
        }).then(function () {
            return tokenInstance.balanceOf.call(presaleBuyerAddress);
        }).then(function (balance) {
            buyerBalance = balance;
            return tokenInstance.balanceOf.call(presaleTokenWallet);
        }).then(function (balance) {
            assert.equal(form18DecimalsTo1(buyerBalance), 2000000, "Fail to tranfer tokens to presale buyer");
            assert.equal(form18DecimalsTo1(balance), 18000000, "Fail to tranfer tokens from presale wallet");
        }).catch(function (e) {
            console.log(e);
        });
    });

});
