var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "orphan bonus believe gravity visa always conduct tiny someone puppy frown alone";

module.exports = {
  networks: {
    development: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 50);
      },
      network_id: '*',
      gas: 4712388
    }
  },
  compilers: {
    solc: {
      version: "^0.4.24"
    }
  }
};