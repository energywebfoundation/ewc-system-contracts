let Holding = artifacts.require('./mockcontracts/HoldingMock');
const Utils = require('../utils.js');

let rpcId = 1;

console.log("Web3 version: " + web3.version);

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bn')(web3.utils.BN))
  .should();


contract('Holding', function (accounts) {
    

    describe('Holding mock', async function() {

        let holdingMock;
        let time; 
        let snapshotId;

        const ACCOUNT_WITH_FUNDS = '0xdD870fA1b7C4700F2BD7f44238821C26f7392148';
        const ACCOUNT_FUNDING = '3';
        const ACCOUNT_WITH_NO_FUNDS = '0xaf9DdE98b6aeB2225bf87C2cB91c58833fbab2Ab';

        before(async () => {
            snapshotId =  await Utils.createSnapshot();
        });
        

        beforeEach(async function() {
            await Utils.revertSnapshot(snapshotId, rpcId++);
            snapshotId =  await Utils.createSnapshot();
            deployer = accounts[0];
            time = new web3.utils.BN((await web3.eth.getBlock(await web3.eth.getBlockNumber())).timestamp + 10000, 10)
            holdingMock = await Holding.new(ACCOUNT_WITH_FUNDS, ACCOUNT_FUNDING, time, {from: deployer, value: web3.utils.toWei(ACCOUNT_FUNDING, 'ether')}).should.be.fulfilled;

        });

        it('Test holder amount should be set correctly', async function() {
            let holderStruct = await holdingMock.holders(ACCOUNT_WITH_FUNDS);
            holderStruct.availableAmount.should.be.bignumber.equal(ACCOUNT_FUNDING);
        });

        it('Test holder time should be set correctly', async function() {
            let holderStruct = await holdingMock.holders(ACCOUNT_WITH_FUNDS);
            holderStruct.time.should.be.bignumber.equal(time);
        });

        it('It should not be possible to release funds before time', async function() {
            await holdingMock.releaseFunds(ACCOUNT_WITH_FUNDS)
                .should.be.rejectedWith('Holding period is not over.'); 
        });

        it('It should not be possible to release funds from a account which has no funds', async function() {
            await holdingMock.releaseFunds(ACCOUNT_WITH_NO_FUNDS)
                .should.be.rejectedWith('Available amount is 0.'); 
        });

        it('It should be possible to release funds after time', async function() {
            await Utils.timeTravel(10001)
            const balanceOfAccountBeforeRelease = new web3.utils.BN(await web3.eth.getBalance(ACCOUNT_WITH_FUNDS))
            await holdingMock.releaseFunds(ACCOUNT_WITH_FUNDS)
            const balanceOfAccountAfterRelease = new web3.utils.BN(await web3.eth.getBalance(ACCOUNT_WITH_FUNDS))
            balanceOfAccountAfterRelease.should.be.bignumber.equal(balanceOfAccountBeforeRelease.add(new web3.utils.BN(ACCOUNT_FUNDING)))

        });

        it('It should only be possible to release funds once', async function() {
            await Utils.timeTravel(10001)

            await holdingMock.releaseFunds(ACCOUNT_WITH_FUNDS)
            await holdingMock.releaseFunds(ACCOUNT_WITH_FUNDS)
                .should.be.rejectedWith('Available amount is 0.'); 

        });
    });
});
