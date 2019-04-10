pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    struct Airline {
        address airlineAddress;
        string name;
        bool registerd;
        bool hasFunded;
        uint fundingAmount;

    }

    mapping(address => Airline) airlines;
    mapping(address => uint256) authorizedContracts;


    struct Passenger {
        uint fundingAmount;
        string name;
        uint number;
        uint256 wallet; //if flight is delayed funds will be stored here
    }
    struct Flight {
        string name;
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
        string from;
        string to;
        mapping(address => Passenger) passengers; //passengers and the amount they paid
        address[] passengersFunds;
        //mapping(address => uint256) private PassengersFunds; //funds for passengers to withdraw
    }
    mapping(bytes32 => Flight) public flights;


    uint256 noOfAirlines = 0;
    uint M= 2;
    address[] multiCalls = new address[](0);
    uint fundingValue = 10 ether;
    uint256 private enabled = block.timestamp;
    uint256 private counter = 1;
    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    event AirlinrRegistred(address airlineAddress, uint256 number);
    event Funded(address airlineAddress);
    event Credited(bytes32 flightkey);
    event FundsWithdrawn(address passenger,uint amount);
    event FlightRegistered(bytes32 flightkey);

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor(address firstAirline) public
    {
        contractOwner = msg.sender;
        //registering the 1st air line
        Airline storage regfirstAirline = airlines[firstAirline];
        regfirstAirline.airlineAddress = firstAirline;
        regfirstAirline.name = "1st airline";
        regfirstAirline.registerd = true;
        noOfAirlines++;

    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier isCallerAuthorized()
    {
        require(authorizedContracts[msg.sender] == 1, "Caller is not authorized");
        _;
    }
    modifier isAirlineRegistred(address airline)
    {
        require(airlines[airline].registerd, "airline is not registerd");
        _;
    }
    modifier isFundingEnough()
    {
        require(msg.value >= fundingValue , "airline must fund at least 10 ether");
        _;
    }
    modifier rateLimit(uint time)
    {
        require(block.timestamp >= enabled , "rate limiting in effects");
        enabled = enabled.add(time);
        _;
    }
    modifier entracyGuard(uint time)
    {
        counter = counter.add(1);
        uint256 guard = counter;
        _;
        require(guard == counter ,"that is not allowed");
    }
    modifier flightRegistered(bytes32 flightkey)
    {
        require(flights[flightkey].isRegistered, "flight is not registered");
        _;
    }
    modifier airlineHasFunded()
    {
        require(airlines[msg.sender].hasFunded, "airline has not funded any ethers yet");
        _;
    }
    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational()
                            public
                            view
                            returns(bool)
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */

    function setOperatingStatus
                            (
                                bool mode
                            )
                            external
                            requireContractOwner
                            //isCallerAuthorized

    {
        require(mode != operational, "New mode must be different from existing mode");

        bool isDuplicate = false;
        for(uint c=0; c<multiCalls.length; c++) {
            if (multiCalls[c] == msg.sender) {
                isDuplicate = true;
                break;
            }
        }
        require(!isDuplicate, "Caller has already called this function.");
        M = noOfAirlines/2; //%05% for multiparty consensus
        multiCalls.push(msg.sender);
        if (multiCalls.length >= M) {
            operational = mode;
            multiCalls = new address[](0);
        }
    }

    function getNoOfAirlines() external returns(uint256) {
        return noOfAirlines;
    }
    function isRegistred(address airline) external returns(bool) {
        return airlines[airline].registerd;

    }
    function  authorizedContract(address dataContract) external requireContractOwner {
      authorizedContracts[dataContract] = 1;
    }
    function deAuthorizedContract(address dataContract) external requireContractOwner {
      delete authorizedContracts[dataContract];
    }
    function hasFunded(address airline) external returns(bool){
      return airlines[airline].hasFunded;
    }

    // function getFlight(bytes32 flightkey) returns()
    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */

    function registerAirline(
                            address newAirlineAddress,
                            string name
                            )
                            external
                            requireIsOperational
                            airlineHasFunded
    {
        Airline storage newAirline = airlines[newAirlineAddress];
        newAirline.airlineAddress = newAirlineAddress;
        newAirline.name = name;
        newAirline.registerd = true;

        noOfAirlines++;

        emit AirlinrRegistred(newAirlineAddress,noOfAirlines);

    }
    function registerFlight
                                (
                                    string name,
                                    string from,
                                    string to,
                                    address airlineAddress,
                                    uint8 statusCode,
                                    uint256 timestamp

                                )
                                external
                                requireIsOperational
                                airlineHasFunded

    {
        Flight memory newFlight;
        newFlight.name = name;
        newFlight.isRegistered = true;
        newFlight.statusCode = statusCode;
        newFlight.updatedTimestamp= timestamp;
        newFlight.airline = airlineAddress;
        newFlight.from = from;
        newFlight.to = to;
        newFlight.passengersFunds = new address[](0);
        bytes32 flightkey = getFlightKey(airlineAddress,name,timestamp);
        flights[flightkey] = newFlight;

        emit FlightRegistered(flightkey);

}
   /**
    * @dev Buy insurance for a flight
    *
    */
    function buy
                            (
                                bytes32 flightkey,
                                uint amountPaid,
                                address buyer,
                                string PassengerName,
                                address airline
                            )
                            external
                            payable
                            requireIsOperational
                            flightRegistered(flightkey)
    {
        require(amountPaid<=0 ether, "you need to pay more than 0 ether or less than 1 ether");
        require(amountPaid>1 ether, "you can pay up to 1 ether only");
        uint count = flights[flightkey].passengersFunds.length;
        Passenger memory newPassenger = Passenger(amountPaid,PassengerName,count,0);
        flights[flightkey].passengersFunds.push(msg.sender);
        flights[flightkey].passengers[buyer] = newPassenger;
        airline.transfer(amountPaid);
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                    bytes32 flightkey
                                )
                                external
                                requireIsOperational
                                flightRegistered(flightkey)
    {
        address[] storage arrayRef = flights[flightkey].passengersFunds;
        address passengerAddress;

        for(uint c=0; c<arrayRef.length; c++) {
            passengerAddress = arrayRef[c];
            flights[flightkey].passengers[passengerAddress].wallet = flights[flightkey].passengers[passengerAddress].fundingAmount.mul(3); //1.5 = 3/2
            flights[flightkey].passengers[passengerAddress].wallet = flights[flightkey].passengers[passengerAddress].fundingAmount.div(2);
        }

        emit Credited(flightkey);
    }


    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    //passengers can withdraw their money from passengersFunds

    function safeWithdraw(uint256 amount,bytes32 flightKey) external rateLimit(5 minutes){
        //to protect again re entracy attack
        //checks
        require(msg.sender == tx.origin, "contracts not allowed");
        require(flights[flightKey].passengers[msg.sender].wallet >= amount, "insuffeint funds");
        //effects
        uint256 uamount = flights[flightKey].passengers[msg.sender].wallet;
        flights[flightKey].passengers[msg.sender].wallet = flights[flightKey].passengers[msg.sender].wallet.sub(uamount);
        //interaction
        msg.sender.transfer(uamount);


        emit FundsWithdrawn(msg.sender , uamount);

    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund
                            (
                            )
                            external
                            payable
                            requireIsOperational
                            isAirlineRegistred(msg.sender)
                            isFundingEnough
                            entracyGuard(now)

    {
        airlines[msg.sender].hasFunded = true;
        airlines[msg.sender].fundingAmount = msg.value;
        contractOwner.transfer(msg.value);
        emit Funded(msg.sender);

    }



    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function()
                            external
                            payable
    {
        //fund();
    }


}
