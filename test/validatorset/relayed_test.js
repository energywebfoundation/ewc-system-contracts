let Relayed = artifacts.require('./mockcontracts/MockValidatorSetRelayed.sol');
let Relay = artifacts.require('./mockcontracts/MockValidatorSetRelay.sol');

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bn')(web3.utils.BN))
    .should();

const {
    assertThrowsAsync,
    REVERT_ERROR_MSG,
    DEFAULT_ADDRESS,
    SYSTEM_ADDRESS,
    EMPTY_BYTES32
} = require(__dirname + "/../utils.js");

let relayed;
let relay;


contract('ValidatorSetRELAYED [all features]', function (accounts) {

    let owner;
    let system;
    let relayAddress;

    async function newRelayedWithDummyRelay(_owner, _system) {
        owner = _owner;
        system = _system;
        relay = await Relay.new(_owner, { from: _owner }).should.be.fulfilled;
        relayAddress = relay.address;
        relayed = await Relayed.new(relayAddress, [accounts[1]], { from: _owner }).should.be.fulfilled;

        await relay.setRelayed(relayed.address, { from: _owner }).should.be.fulfilled;
        await relay.setSystem(_system, { from: _owner }).should.be.fulfilled;
    }

    beforeEach(async function () {
        await newRelayedWithDummyRelay(accounts[9], accounts[9]);
    });

    describe('constructor', async function () {

        beforeEach(async function () {
            await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
            relayAddress = owner;
        });

        it('should not allow initialization with 0x0 relay address.', async function () {
            await Relayed.new(DEFAULT_ADDRESS, []).should.be.rejectedWith(REVERT_ERROR_MSG);
        });

        it('should not allow initialization with an initial validator of address 0x0.', async function () {
            await Relayed.new(owner, [accounts[1], DEFAULT_ADDRESS]).should.be.rejectedWith(REVERT_ERROR_MSG);
        });

        it('should leave finalized value false by default', async function () {
            let validators = await relayed.getValidators.call();
            let finalized = await relayed.finalized.call();
            validators.should.be.deep.equal([accounts[1]]);
            finalized.should.be.false;

            relayed = await Relayed.new(owner, []).should.be.fulfilled;
            validators = await relayed.getValidators.call();
            finalized = await relayed.finalized.call();
            validators.should.be.deep.equal([]);
            finalized.should.be.false;
        });

        it('should set current list of validators correctly', async function () {
            const validatorsList = [accounts[2], accounts[3], accounts[4]];
            let relayed = await Relayed.new(owner, validatorsList).should.be.fulfilled;
            let validators = await relayed.getValidators.call();
            validators.should.be.deep.equal(validatorsList);
        });

        it('should make validator and pending lists equal', async function () {
            const validatorsList = [accounts[2], accounts[3], accounts[4]];
            let relayed = await Relayed.new(owner, validatorsList).should.be.fulfilled;
            let validators = await relayed.getValidators.call();
            let pending = await relayed.getPendingValidators.call();
            pending.should.be.deep.equal(validators);
        });

        it('should set validator address statuses correctly', async function () {
            const validatorsList = [accounts[2], accounts[3], accounts[4]];
            let relayed = await Relayed.new(owner, validatorsList).should.be.fulfilled;

            let validators = await relayed.getValidators.call();

            let i;
            for (i = 0; i < validators.length; i++) {
                let currentStatus = await relayed.addressStatus.call(validators[i]);
                currentStatus[0].should.be.true;
                currentStatus[1].should.be.false;
                currentStatus[2].toNumber(10).should.equal(i);
            };
        });

        it('should set relay address correctly', async function () {
            let relayaddress = await relayed.relaySet.call();
            relayaddress.should.equal(owner);
        });
    });

    describe("#getValidatorsNum", async function () {

        it('should return the correct validators number', async function () {
            let currentValidators = await relayed.getValidators.call();
            let currentValidatorsLength = await relayed.getValidatorsNum.call();
            currentValidatorsLength.toNumber(10).should.equal(currentValidators.length);

            relayed = await Relayed.new(accounts[9], [accounts[2], accounts[3], accounts[4]]).should.be.fulfilled;
            currentValidators = await relayed.getValidators.call();
            currentValidatorsLength = await relayed.getValidatorsNum.call();
            currentValidatorsLength.toNumber(10).should.equal(currentValidators.length);
        });
    });

    describe('#finalizeChange', async function () {

        beforeEach(async function () {
            await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
            relayAddress = owner;
        });

        it('should only be callable by the relay address', async function () {
            await relayed.finalizeChange({ from: accounts[5] }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relayed.finalizeChange({ from: relayAddress }).should.be.fulfilled;
        });

        it('should set finalized to true', async function () {
            let finalized = await relayed.finalized.call();
            finalized.should.be.false;
            await relayed.finalizeChange({ from: relayAddress }).should.be.fulfilled;
            finalized = await relayed.finalized.call();
            finalized.should.be.true;
        });

        it('should set currentValidators to pendingValidators', async function () {
            const { logs } = await relayed.finalizeChange({ from: relayAddress }).should.be.fulfilled;
            let currentValidators = await relayed.getValidators.call();
            let pendingValidators = await relayed.getPendingValidators.call();
            currentValidators.should.be.deep.equal(pendingValidators);
            logs[0].event.should.be.equal('ChangeFinalized');
            logs[0].args.validatorSet.should.be.deep.equal(currentValidators);
        });

        it('should set currentValidators to pendingValidators after addValidator call', async function () {
            await newRelayedWithDummyRelay(owner, owner);

            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relayed.addValidator(accounts[2], { from: accounts[2] }).should.be.rejectedWith(REVERT_ERROR_MSG);

            let currentValidators = await relayed.getValidators.call();
            let pendingValidators = await relayed.getPendingValidators.call();

            await addValidatorWithEvent(accounts[2], true, { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            currentValidators = await relayed.getValidators.call();
            pendingValidators = await relayed.getPendingValidators.call();
            currentValidators.should.be.deep.equal(pendingValidators);

            await addValidatorWithEvent(accounts[3], true, { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            currentValidators = await relayed.getValidators.call();
            pendingValidators = await relayed.getPendingValidators.call();
            currentValidators.should.be.deep.equal(pendingValidators);

            const expected = [accounts[1], accounts[2], accounts[3]];
            expected.should.be.deep.equal(pendingValidators);
            expected.should.be.deep.equal(currentValidators);

        })
    });

    describe('#addValidator', async function () {

        beforeEach(async function () {
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
        });

        it('should only be callable by owner', async function () {
            await relayed.addValidator(accounts[2], { from: accounts[1] }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await addValidatorWithEvent(accounts[2], true, { from: owner });
            const expected = [accounts[1], accounts[2]];
            await checkPendingValidators(expected);
        });

        it('should not allow to add already active validator', async function () {
            await addValidatorWithEvent(accounts[2], true, { from: owner });
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await addValidatorWithEvent(accounts[1], false, { from: owner });
            await addValidatorWithEvent(accounts[2], false, { from: owner });
        });

        it('should not allow to add if not finalized', async function () {
            await addValidatorWithEvent(accounts[2], true, { from: owner });
            await relayed.addValidator(accounts[2], { from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
        });

        it('should not allow to add 0x0 addresses', async function () {
            await addValidatorWithEvent(DEFAULT_ADDRESS, false, { from: owner });
        });

        it('should set addressStatus for new validator', async function () {
            await addValidatorWithEvent(accounts[2], true, { from: owner });
            let status = await relayed.addressStatus.call(accounts[2]);
            let pendingValidators = await relayed.getPendingValidators.call();
            status[0].should.be.true;
            status[1].should.be.true;
            status[2].should.be.bignumber.equal((pendingValidators.length - 1).toString(10));
        });

        it('should not be finalized yet', async function () {
            await addValidatorWithEvent(accounts[2], true, { from: owner });
            let finalized = await relayed.finalized.call();
            finalized.should.be.false;
        });

        it('should update the pending set', async function () {
            await addValidatorWithEvent(accounts[2], true, { from: owner });
            await checkPendingValidators([accounts[1], accounts[2]]);
        });

        it('should not change the current validator set', async function () {
            await addValidatorWithEvent(accounts[2], true, { from: owner });
            await checkCurrentValidators([accounts[1]]);
        });

        it('should emit InitiateChange with correct blockhash and pendingValidators', async function () {
            await addValidatorWithEvent(accounts[2], true, { from: owner }).should.be.fulfilled;
            let currentValidators = await relayed.getValidators.call();
            currentValidators.push(accounts[2]);
            const currentBlocknumber = (await web3.eth.getBlockNumber());
            const parent = await web3.eth.getBlock(currentBlocknumber - 1);
            const events = await relay.getPastEvents(
                "InitiateChange",
                {
                    "fromBlock": currentBlocknumber,
                    "toBlock": currentBlocknumber
                }
            );

            events.length.should.equal(1);
            events[0].args._parentHash.should.be.equal(parent.hash);
            events[0].args._newSet.should.be.deep.equal(currentValidators);

            let finalized = await relayed.finalized.call();
            finalized.should.be.false;
        })
    })

    describe('#removeValidator', async function () {

        beforeEach(async function () {
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
        });

        it('should remove validator', async function () {
            await removeValidatorWithEvent(accounts[1], true, { from: owner }).should.be.fulfilled;
            await checkPendingValidators([]);
        });

        it('should only be callable by owner', async function () {
            await relayed.removeValidator(accounts[1], { from: accounts[2] }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await removeValidatorWithEvent(accounts[1], true, { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await addValidatorWithEvent(accounts[2], true, { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relayed.removeValidator(accounts[2], { from: accounts[1] }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await removeValidatorWithEvent(accounts[2], true, { from: owner }).should.be.fulfilled;
            await checkPendingValidators([]);
            await checkCurrentValidators([accounts[2]])
        });

        it('should only be allowed to remove from existing set of validators', async function () {
            await removeValidatorWithEvent(accounts[6], false, { from: owner });
            await removeValidatorWithEvent(accounts[1], true, { from: owner });
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await addValidatorWithEvent(accounts[2], true, { from: owner });
            await removeValidatorWithEvent(accounts[2], false, { from: owner });
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await removeValidatorWithEvent(accounts[2], true, { from: owner });
        });

        it('should not allow to remove if not finalized', async function () {
            await addValidatorWithEvent(accounts[2], true, { from: owner });
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await removeValidatorWithEvent(accounts[2], true, { from: owner });
            await relayed.removeValidator(accounts[2], { from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
        });

        it('should change pending set correctly', async function () {
            await checkPendingValidators([accounts[1]]);
            await addValidatorWithEvent(accounts[2], true, { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await addValidatorWithEvent(accounts[3], true, { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await checkPendingValidators([accounts[1], accounts[2], accounts[3]]);

            let pendingValidators = await relayed.getPendingValidators.call();
            let currentValidatorsLength = await relayed.getValidatorsNum.call();

            const indexOfRemovedElement = pendingValidators.indexOf(accounts[1]);
            pendingValidators[indexOfRemovedElement] = pendingValidators.pop()

            await removeValidatorWithEvent(accounts[1], true, { from: owner }).should.be.fulfilled;

            let newPendingValidators = await relayed.getPendingValidators.call();
            newPendingValidators.length.should.be.equal(currentValidatorsLength.toNumber(10) - 1);
            pendingValidators.should.be.deep.equal(newPendingValidators);

            const expected = [accounts[3], accounts[2]];
            expected.should.be.deep.equal(pendingValidators);

            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            (await relayed.getPendingValidators.call()).should.be.deep.equal(expected);
        });

        it('should change current set correctly', async function () {

            await checkCurrentValidators([accounts[1]]);

            await addValidatorWithEvent(accounts[2], true, { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await addValidatorWithEvent(accounts[3], true, { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            await checkCurrentValidators([accounts[1], accounts[2], accounts[3]]);

            let currentValidators = await relayed.getValidators.call();
            let currentValidatorsLength = await relayed.getValidatorsNum.call();

            await removeValidatorWithEvent(accounts[1], true, { from: owner }).should.be.fulfilled;

            let pendingValidators = await relayed.getPendingValidators.call();
            await checkCurrentValidators(currentValidators);
            currentValidatorsLength.toNumber(10).should.be.equal((await relayed.getValidatorsNum.call()).toNumber(10));

            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            currentValidators = await relayed.getValidators.call();

            pendingValidators.should.be.deep.equal(currentValidators);

            const expected = [accounts[3], accounts[2]];
            expected.should.be.deep.equal(currentValidators);
        });

        it('should change address status correctly', async function () {
            await addValidatorWithEvent(accounts[2], true, { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await removeValidatorWithEvent(accounts[2], true, { from: owner }).should.be.fulfilled;

            let status = await relayed.addressStatus.call(accounts[2]);
            status[0].should.be.false;
            status[1].should.be.true;
            status[2].should.be.bignumber.equal("0");

            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            status = await relayed.addressStatus.call(accounts[2]);
            status[0].should.be.false;
            status[1].should.be.false;
            status[2].should.be.bignumber.equal("0");
        });

        it('should set finalized to false', async function () {
            await removeValidatorWithEvent(accounts[1], true, { from: owner }).should.be.fulfilled;
            const finalized = await relayed.finalized.call();
            finalized.should.be.false;
        });

    });

    describe('#isValidator', async function () {

        it('should return true for validator', async function () {
            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            (await relayed.isValidator.call(accounts[1])).should.be.true;
            (await relayed.isValidator.call(accounts[2])).should.be.false;

            await addValidatorWithEvent(accounts[2], true, { from: owner }).should.be.fulfilled;
            (await relayed.isValidator.call(accounts[2])).should.be.true;

            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await removeValidatorWithEvent(accounts[2], true, { from: owner }).should.be.fulfilled;
            (await relayed.isValidator.call(accounts[2])).should.be.false;

            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            (await relayed.isValidator.call(accounts[2])).should.be.false;
        });
    });

    describe('#isFinalizedValidator', async function () {

        it('should return true only for finalized validator', async function () {
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            (await relayed.isFinalizedValidator.call(accounts[1])).should.be.true;
            (await relayed.isFinalizedValidator.call(accounts[2])).should.be.false;
            await addValidatorWithEvent(accounts[2], true, { from: owner }).should.be.fulfilled;
            (await relayed.isFinalizedValidator.call(accounts[2])).should.be.false;

            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await removeValidatorWithEvent(accounts[2], true, { from: owner }).should.be.fulfilled;
            (await relayed.isFinalizedValidator.call(accounts[2])).should.be.true;

            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            (await relayed.isFinalizedValidator.call(accounts[2])).should.be.false;
        });
    });

    describe('#isPending', async function () {

        it('returns true for pending validators only', async function () {

            (await relayed.isPending.call(accounts[1])).should.be.false;
            (await relayed.addressStatus.call(accounts[1]))[1].should.be.false;

            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            (await relayed.isPending.call(accounts[1])).should.be.false;
            (await relayed.addressStatus.call(accounts[1]))[1].should.be.false;

            await addValidatorWithEvent(accounts[2], true, { from: owner }).should.be.fulfilled;
            (await relayed.isPending.call(accounts[2])).should.be.true;

            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            (await relayed.isPending.call(accounts[2])).should.be.false;

            await removeValidatorWithEvent(accounts[2], true, { from: owner }).should.be.fulfilled;
            (await relayed.isPending.call(accounts[2])).should.be.true;

            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            (await relayed.isPending.call(accounts[2])).should.be.false;

        });
    });

    describe('#reportMalicious', async function () {

        beforeEach(async function () {
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await addValidatorWithEvent(accounts[2], true, { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
        });

        it('should be called successfully', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relayed.reportMalicious(accounts[2], accounts[1], bn, "0x0", { from: owner }).should.be.fulfilled;
        });

        it('should only be called by validator', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relayed.reportMalicious(accounts[2], accounts[1], bn - 1, "0x0", { from: owner }).should.be.fulfilled;
            await relayed.reportMalicious(accounts[1], accounts[2], bn, "0x0", { from: owner }).should.be.fulfilled;
            await relayed.reportMalicious(accounts[4], accounts[1], bn - 1, "0x0", { from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relayed.reportMalicious(accounts[3], accounts[2], bn - 1, "0x0", { from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
        });

        it('should only be called on validator', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relayed.reportMalicious(accounts[2], accounts[1], bn - 1, "0x0", { from: owner }).should.be.fulfilled;
            await relayed.reportMalicious(accounts[1], accounts[2], bn, "0x0", { from: owner }).should.be.fulfilled;
            await relayed.reportMalicious(accounts[1], accounts[4], bn - 1, "0x0", { from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relayed.reportMalicious(accounts[2], accounts[3], bn - 1, "0x0", { from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
        });

        it('should only be called on existing block number', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relayed.reportMalicious(accounts[1], accounts[2], bn - 1, "0x0", { from: owner }).should.be.fulfilled;
            await relayed.reportMalicious(accounts[2], accounts[1], bn, "0x0", { from: owner }).should.be.fulfilled;
            await relayed.reportMalicious(accounts[1], accounts[2], await web3.eth.getBlockNumber() + 1, "0x0", { from: owner })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
            await relayed.reportMalicious(accounts[2], accounts[3], (await web3.eth.getBlockNumber()) + 100, "0x0", { from: owner })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
        });

        it('should emit an event', async function () {
            const bn = await web3.eth.getBlockNumber();
            let { logs } = await relayed.reportMalicious(accounts[2], accounts[1], bn, "0x0", { from: owner })
                .should.be.fulfilled;
            logs[0].event.should.be.equal("ReportedMalicious");
            logs[0].args[0].should.be.equal(accounts[2]);
            logs[0].args[1].should.be.equal(accounts[1]);
            logs[0].args[2].toNumber(10).should.be.equal(bn);
        });

        it('should not accept report on a pending-to-be-added validator', async function () {
            await relayed.setRelay(relayAddress, { from: owner }).should.be.fulfilled;
            await addValidatorWithEvent(accounts[3], true, { from: owner }).should.be.fulfilled;
            let bn = await web3.eth.getBlockNumber();
            await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
            await relayed.reportMalicious(accounts[1], accounts[3], bn, "0x0", { from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relayed.finalizeChange({ from: owner }).should.be.fulfilled;
            bn = await web3.eth.getBlockNumber();
            await relayed.reportMalicious(accounts[1], accounts[3], bn, "0x0", { from: owner }).should.be.fulfilled;
        });

        it('should accept report on a pending-to-be-removed validator', async function () {
            await relayed.setRelay(relayAddress, { from: owner }).should.be.fulfilled;
            await removeValidatorWithEvent(accounts[2], true, { from: owner }).should.be.fulfilled;
            let bn = await web3.eth.getBlockNumber();
            await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
            await relayed.reportMalicious(accounts[1], accounts[2], bn, "0x0", { from: owner }).should.be.fulfilled;
            await relayed.finalizeChange({ from: owner }).should.be.fulfilled;
            bn = await web3.eth.getBlockNumber();
            await relayed.reportMalicious(accounts[1], accounts[2], bn, "0x0", { from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
        });
    });

    describe('#reportBenign', async function () {

        beforeEach(async function () {
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await addValidatorWithEvent(accounts[2], true, { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
        });

        it('should be called successfully', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relayed.reportBenign(accounts[2], accounts[1], bn, { from: owner }).should.be.fulfilled;
        });

        it('should only be called by validator', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relayed.reportBenign(accounts[2], accounts[1], bn - 1, { from: owner }).should.be.fulfilled;
            await relayed.reportBenign(accounts[1], accounts[2], bn, { from: owner }).should.be.fulfilled;
            await relayed.reportBenign(accounts[4], accounts[1], bn - 1, { from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relayed.reportBenign(accounts[3], accounts[2], bn - 1, { from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
        });

        it('should only be called on validator', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relayed.reportBenign(accounts[2], accounts[1], bn - 1, { from: owner }).should.be.fulfilled;
            await relayed.reportBenign(accounts[1], accounts[2], bn, { from: owner }).should.be.fulfilled;
            await relayed.reportBenign(accounts[1], accounts[4], bn - 1, { from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relayed.reportBenign(accounts[2], accounts[3], bn - 1, { from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
        });

        it('should only be called on existing block number', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relayed.reportBenign(accounts[1], accounts[2], bn - 1, { from: owner }).should.be.fulfilled;
            await relayed.reportBenign(accounts[2], accounts[1], bn, { from: owner }).should.be.fulfilled;
            await relayed.reportBenign(accounts[1], accounts[2], await web3.eth.getBlockNumber() + 1, { from: owner })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
            await relayed.reportBenign(accounts[2], accounts[3], (await web3.eth.getBlockNumber()) + 100, { from: owner })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
        });

        it('should emit an event', async function () {
            const bn = await web3.eth.getBlockNumber();
            let { logs } = await relayed.reportBenign(accounts[2], accounts[1], bn, { from: owner })
                .should.be.fulfilled;
            logs[0].event.should.be.equal("ReportedBenign");
            logs[0].args[0].should.be.equal(accounts[2]);
            logs[0].args[1].should.be.equal(accounts[1]);
            logs[0].args[2].toNumber(10).should.be.equal(bn);
        });

        it('should not accept report on a pending-to-be-added validator', async function () {
            await relayed.setRelay(relayAddress, { from: owner }).should.be.fulfilled;
            await addValidatorWithEvent(accounts[3], true, { from: owner }).should.be.fulfilled;
            let bn = await web3.eth.getBlockNumber();
            await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
            await relayed.reportBenign(accounts[1], accounts[3], bn, { from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relayed.finalizeChange({ from: owner }).should.be.fulfilled;
            bn = await web3.eth.getBlockNumber();
            await relayed.reportBenign(accounts[1], accounts[3], bn, { from: owner }).should.be.fulfilled;
        });

        it('should accept report on a pending-to-be-removed validator', async function () {
            await relayed.setRelay(relayAddress, { from: owner }).should.be.fulfilled;
            await removeValidatorWithEvent(accounts[2], true, { from: owner }).should.be.fulfilled;
            let bn = await web3.eth.getBlockNumber();
            await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
            await relayed.reportBenign(accounts[1], accounts[2], bn, { from: owner }).should.be.fulfilled;
            await relayed.finalizeChange({ from: owner }).should.be.fulfilled;
            bn = await web3.eth.getBlockNumber();
            await relayed.reportBenign(accounts[1], accounts[2], bn, { from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
        });
    });
});

async function addValidatorWithEvent(_validator, shouldBeSuccessful, options) {
    const _result = await relayed.addValidatorWithEvent(_validator, options).should.be.fulfilled;
    if (shouldBeSuccessful) {
        _result.logs[0].event.should.be.equal("AddSuccess");
    } else {
        _result.logs[0].event.should.be.equal("AddFail");
    }
    return _result;
}

async function removeValidatorWithEvent(_validator, shouldBeSuccessful, options) {
    const _result = await relayed.removeValidatorWithEvent(_validator, options).should.be.fulfilled;
    if (shouldBeSuccessful) {
        _result.logs[0].event.should.be.equal("RemoveSuccess");
    } else {
        _result.logs[0].event.should.be.equal("RemoveFail");
    }
    return _result;
}

async function checkPendingValidators(expected) {
    const _pendingValidators = await relayed.getPendingValidators.call();
    expected.should.be.deep.equal(_pendingValidators);
}

async function checkCurrentValidators(expected) {
    const _currentValidators = await relayed.getValidators.call();
    expected.should.be.deep.equal(_currentValidators);
}
