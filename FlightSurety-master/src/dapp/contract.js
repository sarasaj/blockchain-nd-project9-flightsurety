import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

var BigNumber = require('bignumber.js');
export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }
    initialize(callback) {
        this.web3.eth.getAccounts().then(accts => {
                this.owner = accts[0];
    
                let counter = 1;
                const initFund = web3.utils.toWei('10', 'ether');

                while(this.airlines.length < 5) {
                    this.airlines.push(accts[counter]);
                    this.flightSuretyData.methods.fund.send({from: this.owner, value:initFund});
                    this.flightSuretyApp.methods.registerAirline(accts[counter] , counter+" Airline" ,{from: this.owner});
                    counter++;
                }
    
                while(this.passengers.length < 5) {
                    this.passengers.push(accts[counter++]);
                }
    
                callback();
            });
        }
    

    //  initialize(callback) {
    //      this.web3.eth.getAccounts((error, accts) => {
    //        let self = this;
    //         this.owner = accts[0];

    //         let counter = 1;

    //         while(this.airlines.length < 5) {
    //             this.airlines.push(accts[counter]);
    //             self.flightSuretyData.methods.fund.send({from: self.owner, value: web3.utils.toWei("10","ether")});
    //             self.flightSuretyApp.methods.registerAirline(accts[counter] , counter+" Airline" ,{from: self.owner});
    //             counter++;
    //         }

    //         while(this.passengers.length < 5) {
    //             this.passengers.push(accts[counter++]);
    //         }

    //         callback();
    //     });
    // }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods.fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }

    getFlight(flightname, callback) {
        let self = this;
        return self.flightSuretyData.methods
             .getFlight(flightname)
             .call({ from: self.owner}, callback)
     }

    async registerFlight(name,from,to, callback) {
        let airlineAddress = this.airlines[1]
        let statusCode = 0;
        let timestamp = Math.floor(Date.now() / 1000);
        await self.flightSuretyData.methods
            .registerFlight(name,from,to,airlineAddress,statusCode,timestamp)
            .send({ from: self.owner, gas: 500000}, (error, result) => {
                callback(error);
            });
    }

    async buyInsurance(flightkey, amountPaid ,callback) {
        let airline = airline[1];
        let buyer = passenger[1];
        let name = "passenger1"
        let self = this;
        try {
            await self.flightSuretyData.methods
            .buy(flightkey,amountPaid,buyer,name, airline)
            .send({ from: self.passengers[1], value: amountPaid}, (error, result) => {
                callback(error, result);
            });
          }
        catch(e) {
            console.log(e.message)
        }

    }

    async withdrawFunds(amount,fligtkey,callback) {
        let self = this;
        try {
            await self.flightSuretyData.methods
            .safeWithdraw(amount,fligtkey)
            .send({ from: self.passengers[1]}, (error, result) => {
                callback(error, result);
            });
          }
        catch(e) {
            console.log(e.message)
        }

    }

}