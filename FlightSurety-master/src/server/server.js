import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import express from 'express';
import 'babel-polyfill';
var Web3 = require('web3');

const ORACLES_COUNT = 21;
var accounts;
var oracles = [];
let fees; 

let config = Config['localhost'];
const web3 = new Web3(Web3.givenProvider || 'ws://localhost:8545', null, {});

web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

//(oracles1) Oracle functionality is implemented in the server app.
//(oracles2) 20+ oracles are registered and their assigned indexes are persisted in memory

registerAllOracles();


async function registerAllOracles(){ // a function that registers oracles 
accounts = await web3.eth.getAccounts();
fees = await flightSuretyApp.methods.REGISTRATION_FEE.call({from: accounts[0]});
//console.log(`Oracle array Count = ${oracles.length}`);

let limit = ORACLES_COUNT+5;
	for (let i = 5; i < limit ; i++) {
		console.log("account:"+accounts[i]+"		i:"+i);
		registerOneOracle(accounts[i]);
	}
	
}
async function registerOneOracle(account){
	try{
	flightSuretyApp.methods.registerOracle.send({ from: account, value: fees, gas:3000000});
	let result = await flightSuretyApp.methods.getMyIndexes().call({from: account});
	console.log("Oracle Registered:" +result[0]+"-"+result[1]+"-"+result[2]);
	oracles.push([account, result]);
	//console.log("New Oracle array Count = "+oracles.length);
	
	}catch(e)
  {
    console.log(e);
  }
}
function submitOracleResponse(index, airline, flight, timestamp, FlightStatusCode, OracleAddress) {
  try{
    flightSuretyApp.methods.submitOracleResponse(index, airline, flight, timestamp, FlightStatusCode)
    .send({
			from: OracleAddress,
			gas: 3000000
    });

  }
  catch(e)
  {
    console.log(e.message);
  }

}
// (oracles) Oracle Updates & Oracle Functionality
flightSuretyApp.events.OracleRequest({fromBlock: 0 }, function (error, event) {
    if (error) console.log(error)
    
  //console.log("event values:"+JSON.stringify(event.returnValues));
	let index = JSON.stringify(event.returnValues.index);
	let airline = JSON.stringify(event.returnValues.airline);
	let flight = JSON.stringify(event.returnValues.flight);
	let timestamp = JSON.stringify(event.returnValues.timestamp);
	var statusCode = Math.floor(Math.random() * 6)*10 //random as per rubric
	console.log("random statusCode", statusCode);

	  for (let i = 0; i < oracles.length; i++) {
	    if (oracles[i][1].includes(index)) { //looping through all registered oracles, identify those oracles for which the OracleRequest event applies
	      console.log('matcing index found account'+oracles[i][0]);
	      submitOracleResponse(index, airline, flight, timestamp, statusCode,oracles[i][0]);
	      //respond by calling into FlightSuretyApp contract with random status code
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


