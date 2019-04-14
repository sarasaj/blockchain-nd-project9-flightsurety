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

//(oracles1) Oracle functionality is implemented in the server app.
//(oracles2) 20+ oracles are registered and their assigned indexes are persisted in memory
registerAllOracles(ORACLES_COUNT);

registerAllOracles(count){ // a funvtion that registers oracles 
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

//(oracles) Oracle Updates & Oracle Functionality
flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, function (error, event) {
    if (error) console.log(error)
    
    console.log(event)
	let index = event.returnValues.index;
	let airline = event.returnValues.airline;
	let flight = event.returnValues.flight;
	let timestamp = event.returnValues.timestamp;

	var statusCode = Math.floor(Math.random() * 6)*10 //random as per rubric
	console.log("random statusCode", statusCode)

	  for (let i = 0; i < OracleArray.length; i++) {
	    if (OracleArray[i][1].includes(index)) {
	      console.log(`Oracle With Matched Index Found`);
	      submitOracleResponse(index, airline, flight, timestamp, statusCode, OracleArray[i][0])
	    }
	  }
});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;


