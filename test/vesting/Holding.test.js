let Holding = artifacts.require('./mockcontracts/HoldingMock');


console.log("Web3 version: " + web3.version);

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bn')(web3.utils.BN))
  .should();


contract('Holding', function (accounts) {
    

    describe('Holsing mock', async function() {

        let holdingMock;
        let time; 

        beforeEach(async function() {
            deployer = accounts[0];
            time = new web3.utils.BN((await web3.eth.getBlock(await web3.eth.getBlockNumber())).timestamp + 10000, 10)
            holdingMock = await Holding.new(time, {from: deployer}).should.be.fulfilled;
    
        });

        it('Test holder amount should be set correctly', async function() {
            let holderStruct = await holdingMock.holders('0xdD870fA1b7C4700F2BD7f44238821C26f7392148');
            holderStruct.availableAmount.should.be.bignumber.equal("99");
        });

        it('Test holder time should be set correctly', async function() {
            let holderStruct = await holdingMock.holders('0xdD870fA1b7C4700F2BD7f44238821C26f7392148');
            holderStruct.time.should.be.bignumber.equal(time);
        });

        it('It should not be possible to release funds before time', async function() {
            let holderStruct = await holdingMock.releaseFunds('0xdD870fA1b7C4700F2BD7f44238821C26f7392148')
                .should.be.rejectedWith('Holding period is not over.'); 
        });
    });
});
