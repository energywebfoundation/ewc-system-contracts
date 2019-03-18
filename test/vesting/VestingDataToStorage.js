const Web3 = require('web3')
const web3 = new Web3()

const data = {
    "0xdD870fA1b7C4700F2BD7f44238821C26f7392148": {
        availableAmount: "0x09",
        time: "0x01"
    }

}

const addressToSlot = (address) => {
    return web3.utils.soliditySha3(web3.eth.abi.encodeParameter('address', address),  web3.eth.abi.encodeParameter('uint256', '0x0'))
}

Object.keys(data).forEach(address => {
    const slot = addressToSlot(address)
    console.log('"' + slot + '": "' + data[address].availableAmount + '",')
    console.log('"0x' + (new web3.utils.BN(slot.replace('0x', ''), 16)).add(new web3.utils.BN('1', 16)).toString(16) + '": "' + data[address].time + '",')
    

    
});



