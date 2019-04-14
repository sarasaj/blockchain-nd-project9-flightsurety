import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let oracles = [];
let fees = web3.utils.toWei('1', 'ether');; 
const ORACLES_COUNT = 20;
let accounts;

RegisterAllOracles(count){ // a funvtion that registers oracles 
accounts = await web3.eth.getAccounts();
//fees = await flightSuretyApp.methods.REGISTRATION_FEE.call({from: accounts[0]});
let account;
for (var i = 0; i < count; i++) {
	account = accounts[i+5]; //letting diffrents accounts regesiter oracles starting from 5
	await flightSuretyApp.methods.registerOracle({ from: account, value: fees });

	let result = await flightSuretyApp.methods.getMyIndexes().call({from: account});
	  console.log(`Oracle Registered:: [${result[0]}, ${result[1]}, ${result[2]}]`);
	  oracles.push([account, result]);

}

}

flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, function (error, event) {
    if (error) console.log(error)
    console.log(event)
});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;


