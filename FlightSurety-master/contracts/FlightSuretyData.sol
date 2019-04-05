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
    mapping(address => uint256) private PassengersFunds;

    uint256 public noOfAirlines = 0;
    uint M= 2;
    address[] multiCalls = new address[](0);
    unit fundingValue = 10 ether;
    uint256 private enabled = block.timestamp;
    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    event AirlinrRegistred(address airlineAddress);
    event Funded(address airlineAddress);
    event fundsWithdrawn(address passenger, amount);
    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor() public
    {
        contractOwner = msg.sender;
        //registering the 1st air line
        Airline storage firstAirline = airlines[msg.sender];
        firstAirline.airlineAddress = msg.sender;
        firstAirline.name = "1st airline";
        firstAirline.registerd = true;
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
    modifier isAirlineRegistred()
    {
        require(isAirlineRegistred, "airline is not registerd");
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
                            isCallerAuthorized
                            
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

    function getNoOfAirlines() external returns(uint256 ) {
        return noOfAirlines;
    }
    function isAirlineRegistred(address airline) external returns(bool) {
        return airlines[airline].registerd;

    }
    function authorizedContract(address dataContract) external requireContractOwner {
      authorizedContracts[dataContract] = 1;
    }
    function deAuthorizedContract(address dataContract) external requireContractOwner {
      delete authorizedContracts[dataContract];
    }
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
                            pure
                            requireIsOperational
    {

        Airline storage newAirline = airlines[newAirlineAddress];
        newAirline.airlineAddress = newAirlineAddress;
        newAirline.name = name;
        newAirline.registerd = true;

        noOfAirlines++;

        emit AirlinrRegistred(newAirlineAddress);

    }


   /**
    * @dev Buy insurance for a flight
    *
    */
    function buy
                            (
                            )
                            external
                            payable
    {

    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                )
                                external
                                pure
    {
    }


    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                            )
                            external
                            pure
    {
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund
                            (
                                address airline
                            )
                            external
                            payable
                            requireIsOperational
                            isAirlineRegistred
                            isFundingEnough

    {
        airlines[airline].hasFunded = true;
        airlines[airline].fundingAmount = msg.value;

        emit Funded(airline);

    }

    //passengers can withdraw their money from passengersFunds

    function safeWithdraw(uint256 amount){
        //checks
        require(msg.sender == tx.origin, "contracts not allowed");
        require(passengersFunds[msg.sender]>= amount, "insuffeint funds");
        //effects 
        uint256 amount = passengersFunds[msg.sender];
        passengersFunds[msg.sender] = passengersFunds[msg.sender].sub(amount);
        //interaction
        msg.sender.transfer(amount);

        emit PassengersFunds(msg.sender , amount)

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
        fund();
    }


}
