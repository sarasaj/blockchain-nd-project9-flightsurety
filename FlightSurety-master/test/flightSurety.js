
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  const initFund = web3.utils.toWei('10', 'ether');
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizedContract(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");

  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      //await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {

    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline,"2nd airline", {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isRegistred.call(newAirline);

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it('(airline) first airline is registerd when contract is deployed', async () => {
    let firstAirline = accounts[1];
    let result = await config.flightSuretyData.isRegistred.call(firstAirline);
    assert.equal(result, true, "first airline is registered");
  });
  it('(airline) Airline can be registered, but does not participate in contract until it submits funding of 10 ether', async () => {
    // ARRANGE
     let secondAirline = accounts[2];
     let firstAirline = accounts[1];

    // ACT
    try {
        await config.flightSuretyData.fund( {from: firstAirline, value: web3.utils.toWei("5","ether") });
    }
    catch(e) {
        console.log("error in funding",e);
    }
    try {
        await config.flightSuretyApp.registerAirline(secondAirline , "2nd Airline" {from: firstAirline});
    }
    catch(e) {
        console.log("error in registering an Airline",e);
    }
    let result = await config.flightSuretyData.isAirline.call(secondAirline);

    // ASSERT
    assert.equal(result, false, "registed airline can only praticpate in contract after funding 10 ethers");
  });
  it('(airline) Only existing airline may register a new airline until there are at least four airlines registered', async () => {


    // ARRANGE
    //registerd airlines
    let firstAirline = accounts[1];
    let secondAirline = accounts[2];

    //new airline
    let airline3 = accounts[3];
    let airline4 = accounts[4];
    let airline4 = accounts[5];

    // ACT
    try {
        await config.flightSuretyData.fund({from: firstAirline, value:initFund});
        await config.flightSuretyData.fund({from: secondAirline, value:initFund});
    }
    catch(e) {

    }
    try {
      //registered by exisiting airlines
        await config.flightSuretyApp.registerAirline(airline3,"3rd airline", {from: config.firstAirline});
        await config.flightSuretyApp.registerAirline(airline4,"4th airline", {from: config.secondAirline});

      //registered by multiconsensus
      await config.flightSuretyApp.registerAirline(airline4,"4th airline", {from: config.secondAirline});
      await config.flightSuretyApp.registerAirline(airline4,"4th airline", {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isRegistred.call(newAirline);

    // ASSERT
    assert.equal(result, true, "Airline registered");

  });
  it('(airline) Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines', async () => {

  });



});
