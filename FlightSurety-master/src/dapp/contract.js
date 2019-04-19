import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.initialize(callback);
        //this.registerAndFund();
        this.initFund = web3.toWei(10, 'ether');
        this.owner = null;
        this.airlines = [];
        this.passengers = [];

        this.firstAirline = null;
        this.airline2 = null;
        this.airline3 =null
        this.airline4 = null;
        
        this.flight1 = "ND101";
        this.flight1 = "ND102";
        this.flight1 = "ND102";

        this.departure1 = Math.floor(Date.now() / 1000);
        this.departure2 = Math.floor(Date.now() / 1000);
        this.departure3 = Math.floor(Date.now() / 1000);
    }

    initialize(callback) {
        this.web3.eth.getAccounts(async (error, accts) => {
            this.owner = accts[0];

            let counter = 5;
            
            // while(this.airlines.length < 5) {
            //     this.airlines.push(accts[counter++]);
            // }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }
            this.fundAirline(accts[1],(error, result) => { //accts[1] is registered at contract creation so i will fund it only
                if(error){
                  console.log("error funding",accts[1] ,error)

                } 

                this.registerFlight("ND101",accts[1],this.departure1 ,(error, result) => { //only one airline is registed and funded and 3 registered flight
                    if(error){
                        console.log("error registering ND101" ,error)

                    }else{          
                        console.log("ND101" ,result)
                        this.airlines.push(accts[1]);

                    }
                }); 
                this.registerFlight("ND102",accts[1],this.departure2 ,(error, result) => {
                    if(error){
                        console.log("error registering ND101 " ,error)

                    }else{          
                        console.log("ND102" ,result)

                    }
                }); 
                this.registerFlight("ND103",accts[1],this.departure3 ,(error, result) => {
                    if(error){
                        console.log("error registering ND103" ,error)

                    }else{          
                        console.log("ND103" ,result)

                    }
                }); 
            }); 
            callback();
        });
    }
    registerFlight(flight,address,dep, callback) {
        let self = this;
          
        self.flightSuretyData.methods
            .registerFlight(flight,"jeddah","tokyo",address,0,dep   )
            .send({ from: self.owner , gas: 5555555 }, (error, result) => {
                callback(error, result);
            });
    }
    fundAirline(address, callback) {
        let self = this;
          
        self.flightSuretyData.methods
            .fund()
            .send({ from: address ,value: this.web3.utils.toWei("10","ether")}, (error, result) => {
                callback(error, result);
            });
    }
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
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }
    buyInsurance(flightname, amountPaid ,callback) {
        let self = this;
        let airline = this.airlines[0];
        console.log("airline:"+airline);
        let buyer = this.passengers[1];
        let name = "passenger1"
        let timestamp = 0
        // if(flightname =="ND101") timestamp = this.departure1;
        // else if(flightname =="ND102") timestamp = this.departure2;
        // else timestamp = this.departure3;
        //
        //this.web3.utils.fromWei(amountPaid ,'ether')
        console.log("amount:"+amountPaid);
        console.log("amount after:"+this.web3.utils.toWei(amountPaid,"ether"));
        try {
            self.flightSuretyData.methods
            .buy(flightname,buyer,name, airline)
            .send({ from: self.passengers[1], value:this.web3.utils.toWei(amountPaid,"ether") }, (error, result) => {
                callback(error, result);
            });
          }
        catch(e) {
            console.log(e.message)
        }

    }

    withdrawFunds(amount,fligtkey,callback) {
        let self = this;
        try {
            self.flightSuretyData.methods
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