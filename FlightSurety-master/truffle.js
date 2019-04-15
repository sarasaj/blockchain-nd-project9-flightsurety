var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "baby game radio leisure inside birth position panther clump shuffle glass august";

module.exports = {
  networks: {
    development: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:7545/", 0, 50);
      },
      network_id: '5777',
      gas: 4712388
    }
  },
  compilers: {
    solc: {
      version: "^0.4.24"
    }
  }
};