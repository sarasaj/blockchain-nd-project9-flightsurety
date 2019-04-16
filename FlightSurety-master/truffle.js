var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "order ceiling taxi error world lend area faint tent nation depend sight";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", 
      gas: 5555555
    }
  },
  // networks: {
  //   development: {
  //     provider: function() {
  //       return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 50);
  //     },
  //     network_id: '*',
  //     gas: 5555555
  //   }
  // },
  compilers: {
    solc: {
      version: "^0.4.24"
    }
  }
};