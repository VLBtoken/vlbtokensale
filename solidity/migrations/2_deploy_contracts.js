// Crowdasle deps
var VLBProxy = artifacts.require("./VLBProxy.sol");
var VLBToken = artifacts.require("./VLBToken.sol");
var VLBCrowdsale = artifacts.require("./VLBCrowdsale.sol");
var VLBRefundVault = artifacts.require("./VLBRefundVault.sol");

module.exports = function(deployer) {
    var currentTime = Math.floor(Date.now() / 1000);
    var startTime = currentTime + 600;
    var endTime = startTime + 1200;

    deployer.deploy(VLBToken).then(function() {
        return deployer.deploy(VLBRefundVault).then(function () {
            console.log("start time: " + startTime);
            console.log("end time: " + endTime);
            console.log("VLBToken address: " + VLBToken.address);
            console.log("VLBRefundVault address: " + VLBRefundVault.address);
            return deployer.deploy(
                VLBCrowdsale,
                VLBToken.address,
                VLBRefundVault.address,
                startTime,
                endTime).then(function () {
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
    }).then(function () {
        return VLBCrowdsale.deployed().then(function (instance) {
            instance.startPresale();
        });
    }).then(function(){
        return deployer.deploy(VLBProxy, VLBCrowdsale.address);
    }).catch(function(e) {
        console.error(e);
    });
};
