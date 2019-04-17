
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', async () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });
    

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        })
        // hard code flights in dapptruffle.cmd migrate 
        let flight1 = "ND1";
        let from = "jeddah";
        let to1 = "new york";
        let to2 = "london";
        let to3 = "tokyo";
        let to4 = "Dubai";
        let flight2 = "ND2";
        let flight3 = "ND3";
        let flight4 = "ND4";

        contract.registerFlight(flight1,from,to1, (error, result) => {
            console.log(error,result);
            display('Flights', '', [ { label: 'Flight : ', error: error, value: result.flight },
            { label: 'time : ', error: error, value: result.timestamp } ]);
        });
        contract.registerFlight(flight2,from,to2, (error, result) => {
            console.log(error,result);
            display('', '', [ { label: 'Flight : ', error: error, value: result.flight },
             { label: 'time : ', error: error, value: result.timestamp } ]);
        });        
        contract.registerFlight(flight3,from,to3, (error, result) => {
            console.log(error,result);
            display('', '', [ { label: 'Flight : ', error: error, value: result.flight },
            { label: 'time : ', error: error, value: result.timestamp } ]);
        });        
        contract.registerFlight(flight4,from,to4, (error, result) => {
            console.log(error,result);
            display('', '', [ { label: 'Flight : ', error: error, value: result.flight },
            { label: 'time : ', error: error, value: result.timestamp } ]);
        });

        DOM.elid('buyInsurance').addEventListener('click',async () => {
            let flightname = DOM.elid('flight-number').value;
            let amountPaid = DOM.elid('amountPaid').value;
            let flightkey = await contract.getFlight(flightname).call();
            contract.buyInsurance(flight, amountPaid, (error, result) => {
                console.log(error,result);
                display('insurance purchased', '', [ { label: 'Flight:' + flight +' amount paid:', error: error, value: amountPaid} ]);
            });
        })

        DOM.elid('withdrawFunds').addEventListener('click',async () => {
            let flightkey = await contract.getFlight(flightname).call();
            let flightname = DOM.elid('flight-number').value;
            // Write transaction
            contract.withdrawFunds(flightkey,(error, result) => {
                console.log(error,result);
                display('withdraw Funds', '', [ { label: 'status : ', error: error, value: "success"} ]);
            });
        })

        
    
    });
    

})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}







