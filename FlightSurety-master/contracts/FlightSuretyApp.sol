pragma solidity ^0.4.25;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner;          // Account used to deploy contract

   FlightSuretyData flightSuretyData;
    uint noOfRequiredCalls; //M the 50% of N the number of airline for multiparty consensus
    address[] public multiCalls = new address[](0);

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
         // Modify to call data contract's status
         // returns the opreational status from data contract
        require(flightSuretyData.isOperational(), "Contract is currently not operational");
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
    modifier airlineHasFunded(address airline)
    {
        require(flightSuretyData.hasFunded(msg.sender), "airline has not funded any ethers yet");
        _;
    }
    modifier isAirline()
    {
        require(flightSuretyData.isRegistred(msg.sender), "you need to register first to fund any ether");
        _;
    }

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor
                                (
                                	address dataContract
                                )
                                public
    {
        contractOwner = msg.sender;
        flightSuretyData = FlightSuretyData(dataContract);
    }


    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational()
                            public
                            view
                            returns(bool)
    {
        return flightSuretyData.isOperational();  // Modify to call data contract's status
    }

    function getNoOfcalls() public
                            view 
                            returns(uint256)
    {
        return multiCalls.length;
    }
    function getNoOfVotesNeeded() 
                            public
                            view
                            returns(uint)
    {
        return noOfRequiredCalls;
    }
    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/


   /**
    * @dev Add an airline to the registration queue
    *
    */
    function registerAirline
                            (
                            address airlineToBeRegistered,
                            string nameOfAirline
                            )
                            external
                            requireIsOperational
                            returns(bool success)
    {
    	//the msg sender can be an existing airline and wants to submit a new airline address to be registed
    	//so we have a senderAddress from msg.sender and new airlineToBeRegistered address
        success= false;
    	if(flightSuretyData.getNoOfAirlines() <= 4){ //if airline are less than 4 only regired airlines can register a new airline
    		require(flightSuretyData.isRegistred(msg.sender), "only registered airlines can register a new one"); // msg.sender must be a registerd air line to regsiter a new address as a new airline
            flightSuretyData.registerAirline(airlineToBeRegistered,nameOfAirline,msg.sender);
    		success = true;
        } 
    	else { //multi party consensus
	        bool isDuplicate = false;
	        for(uint c=0; c<multiCalls.length; c++) {
	            if (multiCalls[c] == msg.sender) {
	                isDuplicate = true;
	                break;
	            }
	        }
	        require(!isDuplicate, "Caller has already called this function.");

	        noOfRequiredCalls = (flightSuretyData.getNoOfAirlines()).div(2); //50% for multiparty consensus
	        multiCalls.push(msg.sender);
            success = false;

	        if (multiCalls.length >= noOfRequiredCalls) {
	            flightSuretyData.registerAirline(airlineToBeRegistered,nameOfAirline,msg.sender);
    			success = true;
	            multiCalls = new address[](0);
	        }
    	}
        
        return success;
    }


   /**
    * @dev Register a future flight for insuring.
    *
    */
    // function registerFlight
    //                             (
    //                             	string name,
    //                             	string from,
    //                             	string to,
    //                             	address airlineAddress,
    //                             	uint8 statusCode,
    //                             	uint256 timestamp

    //                             )
    //                             external
    //                             airlineHasFunded(airlineAddress)
    // {
    // 	flightSuretyData.registerFlight(name,from,to,airlineAddress,statusCode,timestamp);

    // }

    function buyInsurance(bytes32 flightkey,string Passengername,address airline) requireIsOperational payable external {
    	flightSuretyData.buy(flightkey, msg.value , msg.sender,Passengername,airline);
    }

   /**
    * @dev Called after oracle has updated flight status
    *
    */
    function processFlightStatus
                                (
                                    address airline,
                                    string memory flight,
                                    uint256 timestamp,
                                    uint8 statusCode
                                )
                                internal
    {
        if(statusCode == STATUS_CODE_LATE_AIRLINE){
            bytes32 flightKey = getFlightKey(airline, flight,timestamp);
            flightSuretyData.creditInsurees(flightKey);
        }
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
                        (
                            address airline,
                            string flight,
                            uint256 timestamp
                        )
                        external
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true
                                            });

        emit OracleRequest(index, airline, flight, timestamp);
    }


// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle
                            (
                            )
                            external
                            payable
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({isRegistered: true, indexes: indexes});
    }

    function getMyIndexes
                            (
                            )
                            view
                            external
                            returns(uint8[3])
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }




    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }


    function getFlightKey
                        (
                            address airline,
                            string flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (
                                address account
                            )
                            internal
                            returns(uint8[3])
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}
//reference Data contract function by creating an  refernce for every function that is going to be called in the app contract
contract FlightSuretyData {

	function isOperational() public view returns(bool);
	function registerAirline(
                            address newAirlineAddress,
                            string name,
                            address regAirline
                            )
                            external;
    function getNoOfAirlines() external returns(uint256);
    function isRegistred(address airline) external returns(bool);
    function registerFlight(
                                    string name,
                                    string from,
                                    string to,
                                    address airlineAddress,
                                    uint8 statusCode,
                                    uint256 timestamp

                            ) external;
    function hasFunded(address airline) external  returns(bool);
    function buy(bytes32 flightkey, uint amountPaid, address buyer, string PassengerName, address airline) external payable;
    function creditInsurees(bytes32 flightkey) external;

}
