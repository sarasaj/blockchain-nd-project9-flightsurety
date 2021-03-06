import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import express from 'express';
import 'babel-polyfill';
//import Web3 from 'web3';
var Web3 = require('web3');

const ORACLES_COUNT = 21;
var accounts;
var oracles = [];
let fees; 

let config = Config['localhost'];
const web3 = new Web3(Web3.givenProvider || 'ws://localhost:8545', null, {});
//let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

//(oracles1) Oracle functionality is implemented in the server app.
//(oracles2) 20+ oracles are registered and their assigned indexes are persisted in memory
// (async () => {
// 	registerAllOracles();
// })()

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
	setTimeout(function() {
		  console.log("wait for oracles"); //await async has a pronblem in my code so i'm using this instead
		  for (let i = 5; i < limit ; i++) {
			print(accounts[i]); 
		}
	}, 3000);

	
	
}
async function registerOneOracle(account){
	try{
	flightSuretyApp.methods.registerOracle.send({ from: account, value: fees, gas:3000000}); //when i use await here it causes problems and stops excution 
	//i reviewed that with mentors and friends on slack and no one is able to figure out the problem .. the contract function run perfectly the problem is in the serer
	//console.log("New Oracle array Count = "+oracles.length);
	}catch(e){
    console.log(e);
	}
	
}
	
async function print(account){
	let result = await flightSuretyApp.methods.getMyIndexes().call({from: account});
	console.log("Oracle Registered:" +result[0]+"-"+result[1]+"-"+result[2]);
	oracles.push([account, result]);
}

function submitOracleResponse(index, airline, flight, timestamp, FlightStatusCode, OracleAddress) {
  try{
    flightSuretyApp.methods.submitOracleResponse(index, airline, flight, timestamp, FlightStatusCode).send({
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
 flightSuretyApp.events.OracleRequest({fromBlock: 0 },function (error, event) {
    if (error) console.log(error)
    
  //console.log("event values:"+JSON.stringify(event.returnValues));
	let index = event.returnValues.index;
	let airline = event.returnValues.airline;
	//console.log('airline'+airline);
	let flight = event.returnValues.flight;
	let timestamp = event.returnValues.timestamp;
	var statusCode = Math.floor(Math.random() * 6)*10 //random as per rubric
	console.log("oracleRequest - index:"+ index+"	flight: "+ flight+"status code:"+statusCode);
try {
	for (let i = 0; i < oracles.length; i++) {
		console.log("i:"+ i);
		var indexesArray = oracles[i][1];

		for(let idx=0;idx<3;idx++) {
			if(indexesArray[idx] == index){
				console.log('matcing index found account'+oracles[i][0]+"	indx:"+indexesArray[idx]+"	 array:"+ indexesArray );
				//looping through all registered oracles, identify those oracles for which the OracleRequest event applies
				submitOracleResponse(index, airline, flight, timestamp, statusCode,oracles[i][0]);
				//respond by calling into FlightSuretyApp contract with random status code
			}
			 
	}
	}
}catch(e){

}
	  
});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})
export default app;