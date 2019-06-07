let Holding = artifacts.require('../../contracts/vesting/Holding.sol');
let HoldingMock = artifacts.require('./mockcontracts/HoldingMock.sol');
let HoldingMockB = artifacts.require('./mockcontracts/HoldingMockB.sol');
let HoldingMockC = artifacts.require('./mockcontracts/HoldingMockC.sol');
const Utils = require('../utils.js');

let rpcId = 1;

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bn')(web3.utils.BN))
    .should();


contract('Holding', function (accounts) {

    const ACCOUNT_WITH_FUNDS = '0x2526AeE4A3b281a5F17324E1F306a051bb4607Ae';
    const ACCOUNT_FUNDING = web3.utils.toWei('99', 'ether').toString(10);
    const ACCOUNT_WITH_NO_FUNDS = '0xaf9DdE98b6aeB2225bf87C2cB91c58833fbab2Ab';
    const TARGET_AMOUNT_BN = web3.utils.toBN(web3.utils.toWei('41198207933333333690000000', 'wei'));
    const TARGET_AMOUNT = TARGET_AMOUNT_BN.toString(10);

    describe('Sanity tests regarding the holded amount', async function () {

        let holding;
        let snapshotId;

        before(async () => {
            snapshotId = await Utils.createSnapshot();
        });

        beforeEach(async function () {
            await Utils.revertSnapshot(snapshotId, rpcId++);
            snapshotId = await Utils.createSnapshot();
            deployer = accounts[0];
        });

        it('Should be deployable with the correct balance', async function () {
            holding = await Holding.new({ from: deployer, value: TARGET_AMOUNT }).should.be.fulfilled;
        });

        it('Should throw if contract balance is less than expected', async function () {
            holding = await Holding.new({ from: deployer, value: TARGET_AMOUNT_BN.sub(web3.utils.toBN('1')).toString(10) }).should.be
                .rejectedWith('Balance should equal target amount.');
        });

        it('Should throw if contract balance is higher than expected', async function () {
            holding = await Holding.new({ from: deployer, value: TARGET_AMOUNT_BN.add(web3.utils.toBN('1')).toString(10) }).should.be
                .rejectedWith('Balance should equal target amount.');
        });

        it('Should throw if inital locked up amount does not equal target amount', async function () {
            holding = await HoldingMock.new({ from: deployer, value: TARGET_AMOUNT }).should.be.fulfilled
                .rejectedWith('Target amount should equal actual amount.');
        });

        it('Should throw if the vesting data set conatains two times the same address', async function () {
            holding = await HoldingMockB.new({ from: deployer, value: TARGET_AMOUNT }).should.be.fulfilled
                .rejectedWith('Holding for this address was already set.');
        });
    });

    describe('Holding dataset tests', async function () {

        let holding;
        let snapshotId;

        before(async () => {
            snapshotId = await Utils.createSnapshot();
        });

        beforeEach(async function () {
            await Utils.revertSnapshot(snapshotId, rpcId++);
            snapshotId = await Utils.createSnapshot();
            deployer = accounts[0];
        });

        it('Test holder amount should be set correctly', async function () {
            holding = await HoldingMockC.new({ from: deployer, value: TARGET_AMOUNT }).should.be.fulfilled;
            let holderStruct = await holding.holders(ACCOUNT_WITH_FUNDS);
            holderStruct.availableAmount.should.be.bignumber.equal(ACCOUNT_FUNDING);
        });

        it('Test holder time should be set correctly', async function () {
            holding = await HoldingMockC.new({ from: deployer, value: TARGET_AMOUNT }).should.be.fulfilled;
            let holderStruct = await holding.holders(ACCOUNT_WITH_FUNDS);
            holderStruct.lockedUntilBlocktimestamp.should.be.bignumber.equal(new web3.utils.BN('2000000000', 10));
        });

        it('It should not be possible to release funds before time', async function () {
            holding = await HoldingMockC.new({ from: deployer, value: TARGET_AMOUNT }).should.be.fulfilled;
            await holding.releaseFunds(ACCOUNT_WITH_FUNDS)
                .should.be.rejectedWith('Holding period is not over.');
        });

        it('It should not be possible to release funds from a account which has no funds', async function () {
            holding = await HoldingMockC.new({ from: deployer, value: TARGET_AMOUNT }).should.be.fulfilled;
            await holding.releaseFunds(ACCOUNT_WITH_NO_FUNDS)
                .should.be.rejectedWith('Available amount is 0.');
        });

        it('It should be possible to release funds after time', async function () {
            holding = await HoldingMockC.new({ from: deployer, value: TARGET_AMOUNT }).should.be.fulfilled;
            await Utils.timeTravel(2000000000);
            const balanceOfAccountBeforeRelease = new web3.utils.BN(await web3.eth.getBalance(ACCOUNT_WITH_FUNDS));
            await holding.releaseFunds(ACCOUNT_WITH_FUNDS);
            const balanceOfAccountAfterRelease = new web3.utils.BN(await web3.eth.getBalance(ACCOUNT_WITH_FUNDS));
            balanceOfAccountAfterRelease.should.be.bignumber.equal(balanceOfAccountBeforeRelease.add(new web3.utils.BN(ACCOUNT_FUNDING)));
        });

        it('Event ReleaseFunds should be emitted correctly', async function () {
            holding = await HoldingMockC.new({ from: deployer, value: TARGET_AMOUNT }).should.be.fulfilled;
            await Utils.timeTravel(2000000000);
            const balanceOfAccountBeforeRelease = new web3.utils.BN(await web3.eth.getBalance(ACCOUNT_WITH_FUNDS));
            const tx = await holding.releaseFunds(ACCOUNT_WITH_FUNDS);
            tx.logs[0].args._releasedToAccount.should.be.equal(ACCOUNT_WITH_FUNDS);
            tx.logs[0].args._amount.should.be.bignumber.equal(new web3.utils.BN(ACCOUNT_FUNDING));
        });

        it('It should only be possible to release funds once', async function () {
            holding = await HoldingMockC.new({ from: deployer, value: TARGET_AMOUNT }).should.be.fulfilled;
            await Utils.timeTravel(2000000000);
            await holding.releaseFunds(ACCOUNT_WITH_FUNDS);
            await holding.releaseFunds(ACCOUNT_WITH_FUNDS)
                .should.be.rejectedWith('Available amount is 0.');
        });
    });
});
