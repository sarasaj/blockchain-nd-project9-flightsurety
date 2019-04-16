# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

To install, download or clone the repo, then:

`npm install`
`npm install openzeppelin-solidity`
`npm install truffle-hdwallet-provider`
`npm install bignumber.js`
`npm install web3`
`npm install -g webpack-dev-server`
`npm install --save-dev webpack`
`npm install --save-dev webpack-dev-server`
`npm install --save-dev webpack-cli`
`truffle compile`

## Develop Client

To run truffle tests:
`truffle test ./test/flightSurety.js` better test it in truffle.cmd develop so you won't have any problems with the nonce
`truffle test ./test/oracles.js`

To use the dapp:

`truffle migrate` < try to set the gas limit in ganache & truffle.config if you had a problem
`npm run dapp` < make sure you run on the same port 8545 in ganache, config.json in both dapp & server also metamask



To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`
`truffle test ./test/oracles.js`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder


## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)