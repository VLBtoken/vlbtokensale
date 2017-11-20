// Crowdasle deps
var VLBToken = artifacts.require("./VLBToken.sol");
var VLBCrowdsale = artifacts.require("./VLBCrowdsale.sol");
var VLBRefundVault = artifacts.require("./VLBRefundVault.sol");

module.exports = function(deployer) {
    deployer.deploy(VLBToken).then(function() {
        return deployer.deploy(VLBRefundVault).then(function () {
            return deployer.deploy(
                VLBCrowdsale,
                VLBToken.address,
                VLBRefundVault.address).then(function () {
                    return VLBToken.deployed().then(function (instance) {
                        instance.setCrowdsaleAddress(VLBCrowdsale.address);
                    }).catch(function (e) {
                        console.log(e);
                    });
                }).then(function () {
                    return VLBRefundVault.deployed().then(function (instance) {
                        instance.setCrowdsaleAddress(VLBCrowdsale.address);
                    }).catch(function (e) {
                        console.log(e);
                    });
                }).catch(function (e) {
                    console.log(e);
                });
        }).catch(function (e) {
            console.log(e);
        });
    }).catch(function(e) {
        console.error(e);
    });
};
