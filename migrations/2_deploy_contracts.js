// Crowdasle deps
var VLBToken = artifacts.require("./VLBToken.sol");
var VLBCrowdsale = artifacts.require("./VLBCrowdsale.sol");
var env = require("../env.js");

module.exports = function(deployer) {
    console.log("===============");
    console.log("Deplpoying with tokens wallet address: " + env.crowdsale.accounts.crowdsaleTokenWallet);
    console.log("Deplpoying with wallet address: " + env.crowdsale.accounts.wallet);
    console.log("Deplpoying with escrow address: " + env.crowdsale.accounts.escrow);
    console.log("Deplpoying with ETHUSD rate: " + env.crowdsale.ETHUSD + " * 10^-2");
    console.log("===============");

    deployer.deploy(VLBToken, env.crowdsale.accounts.crowdsaleTokenWallet).then(function() {
        return deployer.deploy(
            VLBCrowdsale,
            VLBToken.address,
            env.crowdsale.accounts.wallet,
            env.crowdsale.accounts.escrow,
            env.crowdsale.ETHUSD).catch(function (e) {
                console.log(e);
            });
    }).catch(function(e) {
        console.error(e);
    });
};
