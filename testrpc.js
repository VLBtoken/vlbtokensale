/* jshint esversion: 6 */

const TestRPC = require("ethereumjs-testrpc");
const createKeccakHash = require('keccak');
const BigNumber = require('bignumber.js');
const port = 8545;

// Set testrpc time to Dec 17, 2017, 12:00:00 GMT (1513512000)
var startDate = new Date(0);
startDate.setUTCSeconds(1513512000);

let server = TestRPC.server({
    mnemonic: "web life name funny sunset nut feed machine object bag saddle deposit",
    time: startDate,
    logger: console,
    accounts: [
        {
            balance: '310000000000000000000', // 301 ether
            secretKey: "0x2725df8c556b8d57aff96de8472ab40e6a536b21f0f81b5503622487e159ecfd"
        },
        {
            balance: "200000000000000000000", // 200 ether
            secretKey: "0x48e64b4200f976259cfb7f94b6dd9ebb2e4ef221dce3a24f47d629c931459973"
        },
        {
            balance: "0",
            secretKey: "0x668572816277270985ca46526be211a96361054e739769a3564306f73e18f9e5"
        },
        {
            secretKey: "0x0df3e552f9288afb4869ef5b41ebe99c08a56f2268e40cdfdee7207218d065eb"
        },
        {
            balance: "101000000000000000000",
            secretKey: "0x3cfa460bf1dc82e4be4b341c12590562e133596480a4b65917af1e958eeabe4d"
        },
        {
            secretKey: "0x3b7e980dfb88ea68af6b946a7e180a9a4db5fbf97e17554ccfba0054c845548c"
        },
        {
            secretKey: "0xc1cec7603812b724f34e6de55d48cced66ddb0a2b8fe59f844328461c7162c88"
        },
        {
            balance: '26000000000000000000000', // 26 Kether
            secretKey: "0x35f4051897dafc7e5d14a7fc62dff12e27419809662af10f8253e700d44dbf8d"
        },
        {
            balance: "0",
            secretKey: "0x78239a97f0abb5ddef85e259c1e5960a62f247b96bcb83571cb74601a851898e"
        }
    ]
});

function fromHexToDecimal(hex) {
    let hexStr = hex.toString("hex");
    if (hexStr == "") {
        return 0;
    }
    let decimal = new BigNumber("0x" + hex.toString("hex"), 16);
    return decimal.dividedBy(new BigNumber(10).pow(18)).toNumber();
}

function toChecksumAddress (address) {
    address = address.toLowerCase().replace('0x','');
    var hash = createKeccakHash('keccak256').update(address).digest('hex');
    var ret = '0x';

    for (var i = 0; i < address.length; i++) {
        if (parseInt(hash[i], 16) >= 8) {
            ret += address[i].toUpperCase();
        } else {
            ret += address[i];
        }
    }

    return ret;
}

server.listen(port, function(err, blockchain) {
    if (err) {
        console.log(err);
        return;
    }

    var state = blockchain ? blockchain : server.provider.manager.state;

    console.log("");
    console.log("Available Accounts");
    console.log("==================");

    var accounts = state.accounts;
    var addresses = Object.keys(accounts);

    addresses.forEach(function(address, index) {
        var addressLine = "    🤖  " + address;

        if (state.isUnlocked(address) == false) {
            addressLine += " 🔒";
        }

        var normalizedAddressLine = "(" + index + ") 🤓  " + toChecksumAddress(address);
        var privateKeyLine = "    🔑  0x" + accounts[address].secretKey.toString("hex");
        var balanceLine = "    💰  " + fromHexToDecimal(accounts[address].account.balance) + " ether";

        console.log(normalizedAddressLine);
        console.log(addressLine);
        console.log(privateKeyLine);
        console.log(balanceLine);
        console.log();
    });

    console.log("");
    console.log("Listening on localhost:" + port);
    console.log("===========================");
    console.log("");
});

process.on('uncaughtException', function(e) {
    console.log(e.stack);
    process.exit(1);
});

process.on("SIGINT", function () {
    // graceful shutdown
    server.close(function(err) {
        if (err) {
            console.log(err.stack || err);
        }
        process.exit();
    });
});