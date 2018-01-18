// See deployed contract with all the actual values at 
// https://etherscan.io/address/0xdea2bc436d38d4f8ee6f9e63b63b72a399c24e2c#code
// All values here returned back so test won't fail

module.exports = {
    network: {
        gasAmount: 4000000
    },
    crowdsale: {
        accounts: {
            wallet: "0x6aEeE7E0088C067641f8E5a8B83003a7040C65e5", // testrpc
            crowdsaleTokenWallet: "0x4A4A67ddbFbC5A6bbFFe07613fa0599b76f1CC21", // testrpc
            escrow: "0xfA81DD8Ed3610F2c872bD0a2b7dEd913dDDC1A47" // testrpc
        },
        // In production initial exchange rate is 68939
        ETHUSD: 66977,
        allowance: function(web3) {
            // In production allowance is 175M
            return web3.toWei("9", "mether");
        }
    },
    tests: {
        accounts: {
            privateBuyerAddress: "0x9dD1c94058c51E1A24c4598B1071fDcaf908205F",
            returningPresaleBuyerAddress: "0xb49fbbd01D8fF9a2bF46B7E4cB31CF8b8CFB96A9",
            frequentBuyer: "0x6AB20252Cc8fe103949ef6500C8e27f5c194375C",
            owner: "0x156419fc32aB83B78421d3881397c2167A5FA552",
            gamechangerBuyerAddress: "0xb0715271307d9749e7e12ce3ec66091f033f3240",
            refundWallet: "0x57f856B7314A73478FC01fbc76B92D4F2c2579bf"
        }
    }
};
