
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
   
        DOM.elid('buyInsurance').addEventListener('click',async () => {
            let flightname = DOM.elid('flight-number').value;
            let amountPaid = DOM.elid('amountPaid').value;
            
            contract.buyInsurance(flightname, amountPaid, (error, result) => {
                console.log(error,result);
                display('insurance purchased', '', [ { label: 'Flight:' + flightname +' amount paid:'+ amountPaid, error: error, value: amountPaid} ]);
            });
        })

    //     DOM.elid('withdrawFunds').addEventListener('click',async () => {
    //         let flightkey = await contract.getFlight(flightname).call();
    //         let flightname = DOM.elid('flight-number').value;
    //         // Write transaction
    //         contract.withdrawFunds(flightkey,(error, result) => {
    //             console.log(error,result);
    //             display('withdraw Funds', '', [ { label: 'status : ', error: error, value: "success"} ]);
    //         });
    //     })

        
    
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
