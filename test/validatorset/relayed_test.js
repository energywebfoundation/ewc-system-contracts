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

const NOT_OWNER_ERROR = "Sender is not owner";
const RELAY_ADDRESS_ERROR = "Relay contract address cannot be 0x0";
const RELAY_SAME_ERROR = "New relay contract address cannot be the same as the current one";
const NOT_RELAY_ERROR = "Caller is not the Relay contract";
const VALIDATOR_ADDRESS_ZERO_ERROR = "Validator address cannot be 0x0";
const VALIDATOR_ACTIVE_ERROR = "This validator is already active";
const NOT_VALIDATOR_ERROR = "Address is not an active validator";
const NO_VALIDATORS_ERROR = "There are no validators to remove from";
const FINALIZED_ERROR = "Validator set is finalized";
const NOT_FINALIZED_ERROR = "Validator set is not finalized yet";
const BLOCKNUM_NOT_VALID_ERROR = "Block number is not valid";

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
        await newRelayedWithDummyRelay(accounts[9], accounts[8]);
    });

    describe('constructor', async function () {

        beforeEach(async function () {
            await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
            relayAddress = owner;
        });

        it('should not allow initialization with a 0x0 relay address.', async function () {
            await Relayed.new(DEFAULT_ADDRESS, []).should.be.rejectedWith(RELAY_ADDRESS_ERROR);
        });

        it('should not allow initialization with an initial validator of address 0x0.', async function () {
            await Relayed.new(owner, [accounts[1], DEFAULT_ADDRESS])
                .should.be.rejectedWith(VALIDATOR_ADDRESS_ZERO_ERROR);
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

        it('should emit event', async function () {
            relay = await Relayed.new(owner, []).should.be.fulfilled;
            const currentBlocknumber = (await web3.eth.getBlockNumber());
            const events = await relay.getPastEvents(
                "NewRelay",
                {
                    "fromBlock": currentBlocknumber,
                    "toBlock": currentBlocknumber
                }
            );
            events.length.should.equal(1);
            events[0].args.relay.should.be.deep.equal(owner);
        });
    });

    describe('#finalizeChange', async function () {

        beforeEach(async function () {

        });

        it('should only be callable by the relay address', async function () {
            await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
            relayAddress = owner;

            await relayed.finalizeChange({ from: accounts[5] }).should.be.rejectedWith(NOT_RELAY_ERROR);
            await relayed.finalizeChange({ from: relayAddress }).should.be.fulfilled;
        });

        it('should only be callable if changes are not finalized yet', async function () {
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.rejectedWith(FINALIZED_ERROR);

            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.rejectedWith(FINALIZED_ERROR);

            await relayed.removeValidator(accounts[1], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.rejectedWith(FINALIZED_ERROR);
        });

        it('should set finalized to true', async function () {
            await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
            relayAddress = owner;

            let finalized = await relayed.finalized.call();
            finalized.should.be.false;
            await relayed.finalizeChange({ from: relayAddress }).should.be.fulfilled;
            finalized = await relayed.finalized.call();
            finalized.should.be.true;
        });

        it('should set currentValidators to pendingValidators after constructor', async function () {
            await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
            relayAddress = owner;

            const { logs } = await relayed.finalizeChange({ from: relayAddress }).should.be.fulfilled;
            let currentValidators = await relayed.getValidators.call();
            let pendingValidators = await relayed.getPendingValidators.call();
            currentValidators.should.be.deep.equal(pendingValidators);
            logs[0].event.should.be.equal('ChangeFinalized');
            logs[0].args.validatorSet.should.be.deep.equal(currentValidators);
        });

        it('should set currentValidators to pendingValidators after addValidator call', async function () {
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relayed.addValidator(accounts[2], { from: accounts[2] }).should.be.rejectedWith(REVERT_ERROR_MSG);

            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            let currentValidators = await relayed.getValidators.call();
            let pendingValidators = await relayed.getPendingValidators.call();
            currentValidators.should.be.deep.equal(pendingValidators);

            await relayed.addValidator(accounts[3], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            currentValidators = await relayed.getValidators.call();
            pendingValidators = await relayed.getPendingValidators.call();
            currentValidators.should.be.deep.equal(pendingValidators);

            const expected = [accounts[1], accounts[2], accounts[3]];
            expected.should.be.deep.equal(pendingValidators);
            expected.should.be.deep.equal(currentValidators);
        });

        it('should set currentValidators to pendingValidators after removeValidator call', async function () {
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            await relayed.removeValidator(accounts[2], { from: accounts[2] }).should.be.rejectedWith(REVERT_ERROR_MSG);

            await relayed.removeValidator(accounts[2], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            let currentValidators = await relayed.getValidators.call();
            let pendingValidators = await relayed.getPendingValidators.call();
            currentValidators.should.be.deep.equal(pendingValidators);

            await relayed.removeValidator(accounts[1], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            currentValidators = await relayed.getValidators.call();
            pendingValidators = await relayed.getPendingValidators.call();
            currentValidators.should.be.deep.equal(pendingValidators);

            const expected = [];
            expected.should.be.deep.equal(pendingValidators);
            expected.should.be.deep.equal(currentValidators);
        });
    });

    describe('#addValidator', async function () {

        beforeEach(async function () {
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
        });

        it('should only be callable by owner', async function () {
            await relayed.addValidator(accounts[2], { from: accounts[1] }).should.be.rejectedWith(NOT_OWNER_ERROR);
            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            const expected = [accounts[1], accounts[2]];
            await checkPendingValidators(expected);
        });

        it('should not allow to add already active validator', async function () {
            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relayed.addValidator(accounts[1], { from: owner }).should.be.rejectedWith(VALIDATOR_ACTIVE_ERROR);
            await relayed.addValidator(accounts[2], { from: owner }).should.be.rejectedWith(VALIDATOR_ACTIVE_ERROR);
        });

        it('should not allow to add if not finalized', async function () {
            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            await relayed.addValidator(accounts[2], { from: owner }).should.be.rejectedWith(NOT_FINALIZED_ERROR);
            await relayed.addValidator(accounts[3], { from: owner }).should.be.rejectedWith(NOT_FINALIZED_ERROR);
        });

        it('should not allow to add 0x0 addresses', async function () {
            await relayed.addValidator(DEFAULT_ADDRESS, { from: owner }).should.be.rejectedWith(VALIDATOR_ADDRESS_ZERO_ERROR);
        });

        it('should set addressStatus for new validator', async function () {
            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            let status = await relayed.addressStatus.call(accounts[2]);
            let pendingValidators = await relayed.getPendingValidators.call();
            status[0].should.be.true;
            status[1].should.be.true;
            status[2].toNumber(10).should.be.equal(pendingValidators.length - 1);
        });

        it('should not be finalized before finalize call', async function () {
            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            let finalized = await relayed.finalized.call();
            finalized.should.be.false;
        });

        it('should update the pending set', async function () {
            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            await checkPendingValidators([accounts[1], accounts[2]]);
        });

        it('should not change the current validator set', async function () {
            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            await checkCurrentValidators([accounts[1]]);
        });

        it('should emit InitiateChange in relay with correct blockhash and pendingValidators', async function () {
            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
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
            await relayed.removeValidator(accounts[1], { from: owner }).should.be.fulfilled;
            await checkPendingValidators([]);
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await checkCurrentValidators([]);
        });

        it('should not try to remove from empty pending list', async function () {
            await relayed.removeValidator(accounts[1], { from: owner }).should.be.fulfilled;
            await checkPendingValidators([]);
            await relayed.removeValidator(accounts[1], { from: owner }).should.be.rejectedWith(NOT_FINALIZED_ERROR);
            await relayed.removeValidator(accounts[2], { from: owner }).should.be.rejectedWith(NOT_FINALIZED_ERROR);
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relayed.removeValidator(accounts[1], { from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
            await relayed.removeValidator(accounts[2], { from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
        });

        it('should only be callable by owner', async function () {
            await relayed.removeValidator(accounts[1], { from: accounts[2] }).should.be.rejectedWith(NOT_OWNER_ERROR);
            await relayed.removeValidator(accounts[1], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relayed.removeValidator(accounts[2], { from: accounts[1] }).should.be.rejectedWith(NOT_OWNER_ERROR);
            await relayed.removeValidator(accounts[2], { from: owner }).should.be.fulfilled;
            await checkPendingValidators([]);
            await checkCurrentValidators([accounts[2]])
        });

        it('should only be allowed to remove from existing set of validators', async function () {
            await relayed.removeValidator(accounts[6], { from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
            await relayed.removeValidator(DEFAULT_ADDRESS, { from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
            await relayed.removeValidator(accounts[1], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            await relayed.removeValidator(accounts[2], { from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relayed.removeValidator(accounts[2], { from: owner }).should.be.fulfilled;
        });

        it('should not allow to remove if not finalized', async function () {
            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relayed.removeValidator(accounts[2], { from: owner }).should.be.fulfilled;
            await relayed.removeValidator(accounts[2], { from: owner }).should.be.rejectedWith(NOT_FINALIZED_ERROR);
        });

        it('should allow remove after a failed remove', async function () {
            await relayed.removeValidator(accounts[1], { from: accounts[2] }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relayed.removeValidator(accounts[2], { from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relayed.removeValidator(accounts[1], { from: owner }).should.be.fulfilled;
            await checkPendingValidators([]);
            await relayed.removeValidator(accounts[1], { from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await checkCurrentValidators([]);
            await checkPendingValidators([]);
        });

        it('should change pending set correctly', async function () {
            await checkPendingValidators([accounts[1]]);
            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relayed.addValidator(accounts[3], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await checkPendingValidators([accounts[1], accounts[2], accounts[3]]);

            let pendingValidators = await relayed.getPendingValidators.call();
            let currentValidatorsLength = await relayed.getValidatorsNum.call();

            const indexOfRemovedElement = pendingValidators.indexOf(accounts[1]);
            pendingValidators[indexOfRemovedElement] = pendingValidators.pop()

            await relayed.removeValidator(accounts[1], { from: owner }).should.be.fulfilled;

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

            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relayed.addValidator(accounts[3], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            await checkCurrentValidators([accounts[1], accounts[2], accounts[3]]);

            let currentValidators = await relayed.getValidators.call();
            let currentValidatorsLength = await relayed.getValidatorsNum.call();

            await relayed.removeValidator(accounts[1], { from: owner }).should.be.fulfilled;

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
            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relayed.removeValidator(accounts[2], { from: owner }).should.be.fulfilled;

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
            await relayed.removeValidator(accounts[1], { from: owner }).should.be.fulfilled;
            const finalized = await relayed.finalized.call();
            finalized.should.be.false;
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

    describe('#isAddedValidator', async function () {

        it('should return true for added validators only', async function () {
            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            (await relayed.isAddedValidator.call(accounts[1])).should.be.true;
            (await relayed.isAddedValidator.call(accounts[2])).should.be.false;

            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            (await relayed.isAddedValidator.call(accounts[2])).should.be.true;

            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relayed.removeValidator(accounts[2], { from: owner }).should.be.fulfilled;
            (await relayed.isAddedValidator.call(accounts[2])).should.be.false;

            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            (await relayed.isAddedValidator.call(accounts[2])).should.be.false;
        });
    });

    describe('#isActiveValidator', async function () {

        it('should return true for active (sealing) validators only', async function () {
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            (await relayed.isActiveValidator.call(accounts[1])).should.be.true;
            (await relayed.isActiveValidator.call(accounts[2])).should.be.false;
            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            (await relayed.isActiveValidator.call(accounts[2])).should.be.false;

            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relayed.removeValidator(accounts[2], { from: owner }).should.be.fulfilled;
            (await relayed.isActiveValidator.call(accounts[2])).should.be.true;

            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            (await relayed.isActiveValidator.call(accounts[2])).should.be.false;
        });
    });

    describe('#isPending', async function () {

        it('returns true for pending-to-be-added/removed validators only', async function () {

            (await relayed.isPending.call(accounts[1])).should.be.false;
            (await relayed.addressStatus.call(accounts[1]))[1].should.be.false;

            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            (await relayed.isPending.call(accounts[1])).should.be.false;
            (await relayed.addressStatus.call(accounts[1]))[1].should.be.false;

            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            (await relayed.isPending.call(accounts[2])).should.be.true;

            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            (await relayed.isPending.call(accounts[2])).should.be.false;

            await relayed.removeValidator(accounts[2], { from: owner }).should.be.fulfilled;
            (await relayed.isPending.call(accounts[2])).should.be.true;

            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            (await relayed.isPending.call(accounts[2])).should.be.false;
        });
    });

    describe("#setRelay", async function () {

        it('should be called successfully by owner', async function () {
            await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
            let relayaddress = await relayed.relaySet.call();
            relayaddress.should.equal(owner);
        });

        it('should emit event on success', async function () {
            const { logs } = await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
            logs[0].event.should.be.equal("NewRelay");
            logs[0].args.relay.should.be.equal(owner);
        });

        it('should not be able to set it to 0x0', async function () {
            let relayaddress = await relayed.relaySet.call();
            await relayed.setRelay(DEFAULT_ADDRESS, { from: owner }).should.be.rejectedWith(RELAY_ADDRESS_ERROR);
            let relayaddressAgain = await relayed.relaySet.call();
            relayaddressAgain.should.equal(relayaddress);
        });

        it('should be only callable by owner', async function () {
            await relayed.setRelay(accounts[4], { from: accounts[4] }).should.be.rejectedWith(NOT_OWNER_ERROR);
            await relayed.setRelay(accounts[3], { from: accounts[3] }).should.be.rejectedWith(NOT_OWNER_ERROR);
            await relayed.setRelay(accounts[6], { from: accounts[5] }).should.be.rejectedWith(NOT_OWNER_ERROR);
            await relayed.setRelay(accounts[6], { from: owner }).should.be.fulfilled;
            let relayaddress = await relayed.relaySet.call();
            relayaddress.should.equal(accounts[6]);
        });

        it('should not allow same as the old one', async function () {
            await relayed.setRelay(accounts[4], { from: owner }).should.be.fulfilled;
            await relayed.setRelay(accounts[4], { from: owner }).should.be.rejectedWith(RELAY_SAME_ERROR);
            let relayaddress = await relayed.relaySet.call();
            relayaddress.should.equal(accounts[4]);
        });
    });

    describe('#reportMalicious', async function () {

        beforeEach(async function () {
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
        });

        it('should be called successfully', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relayed.reportMalicious(accounts[2], accounts[1], bn, "0x0", { from: owner }).should.be.fulfilled;
        });

        it('should only be called by the Relay contract', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relayed.reportMalicious(accounts[2], accounts[1], bn, "0x0", { from: accounts[5] }).should.be.rejectedWith(NOT_RELAY_ERROR);
            await relayed.reportMalicious(accounts[2], accounts[1], bn, "0x0", { from: system }).should.be.rejectedWith(NOT_RELAY_ERROR);
            await relayed.reportMalicious(accounts[2], accounts[1], bn, "0x0", { from: accounts[5] }).should.be.rejectedWith(NOT_RELAY_ERROR);
            await relayed.reportMalicious(accounts[2], accounts[1], bn, "0x0", { from: owner }).should.be.fulfilled;
        });

        it('should only be called by validator', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relayed.reportMalicious(accounts[2], accounts[1], bn - 1, "0x0", { from: owner }).should.be.fulfilled;
            await relayed.reportMalicious(accounts[1], accounts[2], bn, "0x0", { from: owner }).should.be.fulfilled;
            await relayed.reportMalicious(accounts[4], accounts[1], bn - 1, "0x0", { from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
            await relayed.reportMalicious(accounts[3], accounts[2], bn - 1, "0x0", { from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
        });

        it('should only be called on validator', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relayed.reportMalicious(accounts[2], accounts[1], bn - 1, "0x0", { from: owner }).should.be.fulfilled;
            await relayed.reportMalicious(accounts[1], accounts[2], bn, "0x0", { from: owner }).should.be.fulfilled;
            await relayed.reportMalicious(accounts[1], accounts[4], bn - 1, "0x0", { from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
            await relayed.reportMalicious(accounts[2], accounts[3], bn - 1, "0x0", { from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
        });

        it('should only be called on existing block number', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relayed.reportMalicious(accounts[1], accounts[2], bn - 1, "0x0", { from: owner }).should.be.fulfilled;
            await relayed.reportMalicious(accounts[2], accounts[1], bn, "0x0", { from: owner }).should.be.fulfilled;

            // works with BLOCKNUM_NOT_VALID_ERROR too in tests, but for some magical reason fails in solidity-coverage
            await relayed.reportMalicious(accounts[1], accounts[2], (await web3.eth.getBlockNumber()) + 1, "0x0", { from: owner })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
            await relayed.reportMalicious(accounts[2], accounts[1], (await web3.eth.getBlockNumber()) + 100, "0x0", { from: owner })
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
            await relayed.addValidator(accounts[3], { from: owner }).should.be.fulfilled;
            let bn = await web3.eth.getBlockNumber();
            await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
            await relayed.reportMalicious(accounts[1], accounts[3], bn, "0x0", { from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relayed.finalizeChange({ from: owner }).should.be.fulfilled;
            bn = await web3.eth.getBlockNumber();
            await relayed.reportMalicious(accounts[1], accounts[3], bn, "0x0", { from: owner }).should.be.fulfilled;
        });

        it('should accept report on a pending-to-be-removed validator', async function () {
            await relayed.setRelay(relayAddress, { from: owner }).should.be.fulfilled;
            await relayed.removeValidator(accounts[2], { from: owner }).should.be.fulfilled;
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
            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
        });

        it('should be called successfully', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relayed.reportBenign(accounts[2], accounts[1], bn, { from: owner }).should.be.fulfilled;
        });

        it('should only be called by the Relay contract', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relayed.reportBenign(accounts[2], accounts[1], bn, { from: accounts[5] }).should.be.rejectedWith(NOT_RELAY_ERROR);
            await relayed.reportBenign(accounts[2], accounts[1], bn, { from: system }).should.be.rejectedWith(NOT_RELAY_ERROR);
            await relayed.reportBenign(accounts[2], accounts[1], bn, { from: accounts[5] }).should.be.rejectedWith(NOT_RELAY_ERROR);
            await relayed.reportBenign(accounts[2], accounts[1], bn, { from: owner }).should.be.fulfilled;
        });

        it('should only be called by validator', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relayed.reportBenign(accounts[2], accounts[1], bn - 1, { from: owner }).should.be.fulfilled;
            await relayed.reportBenign(accounts[1], accounts[2], bn, { from: owner }).should.be.fulfilled;
            await relayed.reportBenign(accounts[4], accounts[1], bn - 1, { from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
            await relayed.reportBenign(accounts[3], accounts[2], bn - 1, { from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
        });

        it('should only be called on validator', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relayed.reportBenign(accounts[2], accounts[1], bn - 1, { from: owner }).should.be.fulfilled;
            await relayed.reportBenign(accounts[1], accounts[2], bn, { from: owner }).should.be.fulfilled;
            await relayed.reportBenign(accounts[1], accounts[4], bn - 1, { from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
            await relayed.reportBenign(accounts[2], accounts[3], bn - 1, { from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
        });

        it('should only be called on existing block number', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relayed.reportBenign(accounts[1], accounts[2], bn - 1, { from: owner }).should.be.fulfilled;
            await relayed.reportBenign(accounts[2], accounts[1], bn, { from: owner }).should.be.fulfilled;

            // works with BLOCKNUM_NOT_VALID_ERROR too in tests, but for some magical reason fails in solidity-coverage
            await relayed.reportBenign(accounts[1], accounts[2], (await web3.eth.getBlockNumber()) + 1, { from: owner })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
            await relayed.reportBenign(accounts[2], accounts[1], (await web3.eth.getBlockNumber()) + 100, { from: owner })
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
            await relayed.addValidator(accounts[3], { from: owner }).should.be.fulfilled;
            let bn = await web3.eth.getBlockNumber();
            await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
            await relayed.reportBenign(accounts[1], accounts[3], bn, { from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
            await relayed.finalizeChange({ from: owner }).should.be.fulfilled;
            bn = await web3.eth.getBlockNumber();
            await relayed.reportBenign(accounts[1], accounts[3], bn, { from: owner }).should.be.fulfilled;
        });

        it('should accept report on a pending-to-be-removed validator', async function () {
            await relayed.setRelay(relayAddress, { from: owner }).should.be.fulfilled;
            await relayed.removeValidator(accounts[2], { from: owner }).should.be.fulfilled;
            let bn = await web3.eth.getBlockNumber();
            await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
            await relayed.reportBenign(accounts[1], accounts[2], bn, { from: owner }).should.be.fulfilled;
            await relayed.finalizeChange({ from: owner }).should.be.fulfilled;
            bn = await web3.eth.getBlockNumber();
            await relayed.reportBenign(accounts[1], accounts[2], bn, { from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
        });
    });
});

async function checkPendingValidators(expected) {
    const _pendingValidators = await relayed.getPendingValidators.call();
    expected.should.be.deep.equal(_pendingValidators);
}

async function checkCurrentValidators(expected) {
    const _currentValidators = await relayed.getValidators.call();
    expected.should.be.deep.equal(_currentValidators);
}
