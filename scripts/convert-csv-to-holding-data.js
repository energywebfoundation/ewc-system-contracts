const fs = require('fs');
const csv = require('csv-parser');
const Web3 = require('web3');
const BN = require('bn.js');

const main = async () => {
    const result = await new Promise((resolve, reject) => {
        const tempResults = [];
        fs.createReadStream(process.argv[2])
          .pipe(csv())
          .on('data', (data) => tempResults.push(data))
          .on('end', () => {
            resolve(tempResults)
          });
      });
    
    if(process.argv[3] === '--sum') {
        let sum = Web3.utils.toBN('0')
        result.forEach(row => {
            sum = sum.add(Web3.utils.toBN(row['Amount (WEI)'].toString()))
        });
        console.log(sum.toString(10))
    } else {
        result
        .map(row => 'addHolding(' + Web3.utils.toChecksumAddress(row['Address']) + ', ' + row['Amount (WEI)'] + ', ' + row['Unix Timestamp'] + ');')
        .forEach(line => console.log(line));
    }   
}

main();
