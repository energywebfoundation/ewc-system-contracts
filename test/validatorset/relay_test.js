let Relayed = artifacts.require('./mockcontracts/MockValidatorSetRelayed.sol');
let Relay = artifacts.require('./mockcontracts/MockValidatorSetRelay.sol');

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bn')(web3.utils.BN))
    .should();

const {
    REVERT_ERROR_MSG,
    DEFAULT_ADDRESS,
    SYSTEM_ADDRESS,
    EMPTY_BYTES32
} = require(__dirname + "/../utils.js");

const NOT_OWNER_ERROR = "Sender is not owner";
const NOT_SYSTEM_ERROR = "Sender is not system";
const SYSTEM_SAME_ERROR = "New system address cannot be the same as the old one";
const RELAYED_SAME_ERROR = "New relayed contract address cannot be the same as the current one";
const NOT_RELAYED_ERROR = "Sender is not the Relayed contract";
const ADDRESS_ZERO_ERROR = "Address cannot be 0x0";
const NOT_VALIDATOR_ERROR = "Address is not an active validator";
const BLOCKNUM_NOT_VALID_ERROR = "Block number is not valid";

let relayed;
let relay;

contract('ValidatorSetRELAY [all features]', function (accounts) {

    let owner;
    let system;
    let relayAddress;
    let relayedAddress;

    async function newRelayWithDummyRelayed(_owner, _system) {
        owner = _owner;
        system = _system;
        relay = await Relay.new(_owner, _owner, { from: _owner }).should.be.fulfilled;
        relayAddress = relay.address;
        relayed = await Relayed.new(_owner, relayAddress, [accounts[1]], { from: _owner }).should.be.fulfilled;
        relayedAddress = relayed.address;

        await relay.setRelayed(relayedAddress, { from: _owner }).should.be.fulfilled;
        await relay.setSystem(system, { from: _owner }).should.be.fulfilled;
    }

    beforeEach(async function () {
        await newRelayWithDummyRelayed(accounts[9], accounts[8]);
    });

    describe('constructor', async function () {

        it('should not allow initialization with 0x0 relayed address.', async function () {
            await Relay.new(owner, DEFAULT_ADDRESS, { from: owner }).should.be.rejectedWith(ADDRESS_ZERO_ERROR);
        });

        it('should set relayed address correctly', async function () {
            let raddress = await relay.relayedSet.call();
            raddress.should.be.equal(relayedAddress);
        });

        it('should set owner correctly', async function () {
            (await relay.owner.call()).should.be.equal(owner);
        });

        it('should set system address correctly', async function () {
            relay = await Relay.new(owner, relayedAddress, { from: owner }).should.be.fulfilled;
            (await relay.systemAddress.call()).should.be.equal(SYSTEM_ADDRESS);
        });

        it('should emit event', async function () {
            relay = await Relay.new(owner, relayedAddress, { from: owner }).should.be.fulfilled;
            const currentBlocknumber = (await web3.eth.getBlockNumber());
            const events = await relay.getPastEvents(
                "NewRelayed",
                {
                    "fromBlock": currentBlocknumber,
                    "toBlock": currentBlocknumber
                }
            );
            events.length.should.equal(1);
            events[0].args.old.should.be.deep.equal(DEFAULT_ADDRESS);
            events[0].args.current.should.be.deep.equal(relayedAddress);
        });
    });

    describe("#setRelayed", async function () {

        it('should allow only the owner to set relayed address', async function () {
            await relay.setRelayed(accounts[2], { from: system }).should.be.rejectedWith(NOT_OWNER_ERROR);
            await relay.setRelayed(accounts[2], { from: accounts[2] }).should.be.rejectedWith(NOT_OWNER_ERROR);
            await relay.setRelayed(accounts[2], { from: owner }).should.be.fulfilled;
            (await relay.relayedSet.call()).should.be.equal(accounts[2]);
        });

        it('should set relayed address correctly', async function () {
            await relay.setRelayed(accounts[2], { from: owner }).should.be.fulfilled;
            (await relay.relayedSet.call()).should.be.equal(accounts[2]);
            await relay.setRelayed(relayedAddress, { from: owner }).should.be.fulfilled;
            (await relay.relayedSet.call()).should.be.equal(relayedAddress);
        });

        it('should not allow to set it to the same relayed address', async function () {
            await relay.setRelayed(relayedAddress, { from: owner }).should.be.rejectedWith(RELAYED_SAME_ERROR);
        });

        it('should emit event', async function () {
            let { logs } = await relay.setRelayed(accounts[2], { from: owner }).should.be.fulfilled;

            logs[0].event.should.be.equal('NewRelayed');
            logs[0].args.old.should.be.deep.equal(relayedAddress);
            logs[0].args.current.should.be.deep.equal(accounts[2]);

            let tr = await relay.setRelayed(accounts[3], { from: owner }).should.be.fulfilled;
            logs = tr.logs;

            logs[0].event.should.be.equal('NewRelayed');
            logs[0].args.old.should.be.deep.equal(accounts[2]);
            logs[0].args.current.should.be.deep.equal(accounts[3]);
        });
    });

    describe("#getValidators", async function () {

        it('should return the correct validators', async function () {
            let currentValidators = await relay.getValidators.call();
            currentValidators.should.be.deep.equal([accounts[1]]);

            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            (await relay.getValidators.call()).should.be.deep.equal(currentValidators);

            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            currentValidators = await relay.getValidators.call();
            currentValidators.should.be.deep.equal([accounts[1], accounts[2]]);


            await relayed.removeValidator(accounts[1], { from: owner }).should.be.fulfilled;
            (await relay.getValidators.call()).should.be.deep.equal(currentValidators);

            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            currentValidators = await relay.getValidators.call();
            currentValidators.should.be.deep.equal([accounts[2]]);

            await relayed.addValidator(accounts[1], { from: accounts[1] })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
            (await relay.getValidators.call()).should.be.deep.equal(currentValidators);

            await relayed.removeValidator(accounts[2], { from: accounts[1] })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
            (await relay.getValidators.call()).should.be.deep.equal(currentValidators);

            let currentValidatorsLength = await relayed.getValidatorsNum.call();
            currentValidatorsLength.toNumber(10).should.equal(currentValidators.length);
        });
    });

    describe('#finalizeChange', async function () {

        beforeEach(async function () {
            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
        });

        it('should only be callable by system', async function () {
            await relay.finalizeChange({ from: accounts[5] }).should.be.rejectedWith(NOT_SYSTEM_ERROR);
            await relay.finalizeChange({ from: owner }).should.be.rejectedWith(NOT_SYSTEM_ERROR);
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
        });

        it('should set finalized to true', async function () {
            let finalized = await relayed.finalized.call();
            finalized.should.be.false;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            finalized = await relayed.finalized.call();
            finalized.should.be.true;
        });

        it('should set currentValidators to migrationValidators in relayed', async function () {
            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            let currentValidators = await relayed.getValidators.call();
            let migrationValidators = await relayed.getMigrationValidators.call();
            currentValidators.should.be.deep.equal(migrationValidators);

            const currentBlocknumber = (await web3.eth.getBlockNumber());
            const events = await relayed.getPastEvents(
                "ChangeFinalized",
                {
                    "fromBlock": currentBlocknumber,
                    "toBlock": currentBlocknumber
                }
            );
            events.length.should.equal(1);
            events[0].args.validatorSet.should.be.deep.equal(currentValidators);
        });

        it('should set currentValidators to migrationValidators after addValidator call', async function () {
            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            await relayed.addValidator(accounts[3], { from: accounts[3] }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relayed.addValidator(accounts[3], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            let currentValidators = await relayed.getValidators.call();
            let migrationValidators = await relayed.getMigrationValidators.call();
            currentValidators.should.be.deep.equal(migrationValidators);

            await relayed.addValidator(accounts[4], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            currentValidators = await relayed.getValidators.call();
            migrationValidators = await relayed.getMigrationValidators.call();
            currentValidators.should.be.deep.equal(migrationValidators);

            const expected = [accounts[1], accounts[2], accounts[3], accounts[4]];
            expected.should.be.deep.equal(migrationValidators);
            expected.should.be.deep.equal(currentValidators);
        });

        it('should set currentValidators to migrationValidators after removeValidator call', async function () {
            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            await relayed.addValidator(accounts[3], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            await relayed.removeValidator(accounts[2], { from: accounts[3] }).should.be.rejectedWith(REVERT_ERROR_MSG);

            let currentValidators;
            let migrationValidators;
            for (let i = 1; i <= 2; i++) {
                await relayed.removeValidator(accounts[i], { from: owner }).should.be.fulfilled;
                await relay.finalizeChange({ from: system }).should.be.fulfilled;

                currentValidators = await relayed.getValidators.call();
                migrationValidators = await relayed.getMigrationValidators.call();
                currentValidators.should.be.deep.equal(migrationValidators);
            }
            const expected = [accounts[3]];
            migrationValidators.should.be.deep.equal(expected);
            currentValidators.should.be.deep.equal(expected);
        });
    });

    describe("#callbackInitiateChange", async function () {

        it('should allow to be called only by relayed contract', async function () {
            await relay.callbackInitiateChange("0x0", [], { from: owner }).should.be.rejectedWith(NOT_RELAYED_ERROR);
            await relay.callbackInitiateChange("0x0", [], { from: system }).should.be.rejectedWith(NOT_RELAYED_ERROR);
            await relay.callbackInitiateChange("0x0", [], { from: accounts[2] }).should.be.rejectedWith(NOT_RELAYED_ERROR);

            await callBackWithEvent("0x0", [], { from: owner }).should.be.fulfilled;
        });

        it('should emit event correctly', async function () {
            const expected = [EMPTY_BYTES32, []];
            await callBackWithEvent(expected[0], expected[1], { from: owner }).should.be.fulfilled;

            const currentBlocknumber = (await web3.eth.getBlockNumber());
            const events = await relay.getPastEvents(
                "InitiateChange",
                {
                    "fromBlock": currentBlocknumber,
                    "toBlock": currentBlocknumber
                }
            );
            events.length.should.equal(1);
            events[0].args._parentHash.should.be.equal(expected[0]);
            events[0].args._newSet.should.be.deep.equal(expected[1]);
        });
    });

    describe('#reportMalicious', async function () {

        async function checkMaliciousEvent(expected) {
            currentBlocknumber = await web3.eth.getBlockNumber();
            const events = await relayed.getPastEvents(
                "ReportedMalicious",
                {
                    "fromBlock": currentBlocknumber,
                    "toBlock": currentBlocknumber
                }
            );
            events[0].args.reporter.should.be.equal(expected.reporter);
            events[0].args.reported.should.be.equal(expected.reported);
            events[0].args.blocknum.toNumber(10).should.be.equal(expected.blocknum);
        }

        beforeEach(async function () {
            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
        });

        it('should be called successfully', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relay.reportMalicious(accounts[2], bn, "0x0", { from: accounts[1] }).should.be.fulfilled;
            await checkMaliciousEvent({
                reporter: accounts[1],
                reported: accounts[2],
                blocknum: bn
            });
        });

        it('should only be called by an active validator', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relay.reportMalicious(accounts[2], bn, "0x0", { from: accounts[1] }).should.be.fulfilled;
            await relay.reportMalicious(accounts[1], bn + 1, "0x0", { from: accounts[2] }).should.be.fulfilled;
            await relay.reportMalicious(accounts[1], bn + 2, "0x0", { from: accounts[4] }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
            await relay.reportMalicious(accounts[2], bn + 3, "0x0", { from: accounts[3] }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
        });

        it('should only be called on an active validator', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relay.reportMalicious(accounts[2], bn, "0x0", { from: accounts[1] }).should.be.fulfilled;
            await relay.reportMalicious(accounts[1], bn + 1, "0x0", { from: accounts[2] }).should.be.fulfilled;
            await relay.reportMalicious(accounts[3], bn + 2, "0x0", { from: accounts[1] }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
            await relay.reportMalicious(accounts[4], bn + 3, "0x0", { from: accounts[2] }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
        });

        it('should only be called on existing block number', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relay.reportMalicious(accounts[2], bn - 1, "0x0", { from: accounts[1] }).should.be.fulfilled;
            await relay.reportMalicious(accounts[1], bn, "0x0", { from: accounts[2] }).should.be.fulfilled;

            // works with BLOCKNUM_NOT_VALID_ERROR too in tests, but for some magical reason fails in solidity-coverage
            await relay.reportMalicious(accounts[2], (await web3.eth.getBlockNumber()) + 1, "0x0", { from: accounts[1] })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
            await relay.reportMalicious(accounts[1], (await web3.eth.getBlockNumber()) + 100, "0x0", { from: accounts[2] })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
        });

        it('should emit the event correctly', async function () {
            let bn = await web3.eth.getBlockNumber();
            await relay.reportMalicious(accounts[1], bn, "0x0", { from: accounts[2] })
                .should.be.fulfilled;
            await checkMaliciousEvent({
                reporter: accounts[2],
                reported: accounts[1],
                blocknum: bn
            });

            bn = await web3.eth.getBlockNumber();
            await relay.reportMalicious(accounts[2], bn, "0x0123456789abcdef", { from: accounts[1] })
                .should.be.fulfilled;
            await checkMaliciousEvent({
                reporter: accounts[1],
                reported: accounts[2],
                blocknum: bn
            });
        });

        it('should not accept report on a pending-to-be-added validator', async function () {
            await relayed.addValidator(accounts[3], { from: owner }).should.be.fulfilled;
            let bn = await web3.eth.getBlockNumber();
            await relay.reportMalicious(accounts[3], bn, "0x0", { from: accounts[1] }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            bn = await web3.eth.getBlockNumber();
            await relay.reportMalicious(accounts[3], bn, "0x0", { from: accounts[2] }).should.be.fulfilled;
        });

        it('should accept report on a pending-to-be-removed validator', async function () {
            await relayed.removeValidator(accounts[2], { from: owner }).should.be.fulfilled;
            let bn = await web3.eth.getBlockNumber();
            await relay.reportMalicious(accounts[2], bn, "0x0", { from: accounts[2] }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            bn = await web3.eth.getBlockNumber();
            await relay.reportMalicious(accounts[2], bn, "0x0", { from: accounts[2] }).should.be.rejectedWith(REVERT_ERROR_MSG);
        });
    });

    describe('#reportBenign', async function () {

        async function checkBenign(expected) {
            currentBlocknumber = await web3.eth.getBlockNumber();
            const events = await relayed.getPastEvents(
                "ReportedBenign",
                {
                    "fromBlock": currentBlocknumber,
                    "toBlock": currentBlocknumber
                }
            );
            events[0].args.reporter.should.be.equal(expected.reporter);
            events[0].args.reported.should.be.equal(expected.reported);
            events[0].args.blocknum.toNumber(10).should.be.equal(expected.blocknum);
        }

        beforeEach(async function () {
            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
        });

        it('should be called successfully', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relay.reportBenign(accounts[2], bn, { from: accounts[1] }).should.be.fulfilled;
            await checkBenign({
                reporter: accounts[1],
                reported: accounts[2],
                blocknum: bn
            });
        });

        it('should only be called by an active validator', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relay.reportBenign(accounts[2], bn, { from: accounts[1] }).should.be.fulfilled;
            await relay.reportBenign(accounts[1], bn + 1, { from: accounts[2] }).should.be.fulfilled;
            await relay.reportBenign(accounts[1], bn + 2, { from: accounts[4] }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
            await relay.reportBenign(accounts[2], bn + 3, { from: accounts[3] }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
        });

        it('should only be called on an active validator', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relay.reportBenign(accounts[2], bn, { from: accounts[1] }).should.be.fulfilled;
            await relay.reportBenign(accounts[1], bn + 1, { from: accounts[2] }).should.be.fulfilled;
            await relay.reportBenign(accounts[3], bn + 2, { from: accounts[1] }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
            await relay.reportBenign(accounts[4], bn + 3, { from: accounts[2] }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
        });

        it('should only be called on existing block number', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relay.reportBenign(accounts[2], bn - 1, { from: accounts[1] }).should.be.fulfilled;
            await relay.reportBenign(accounts[1], bn, { from: accounts[2] }).should.be.fulfilled;

            // works with BLOCKNUM_NOT_VALID_ERROR too in tests, but for some magical reason fails in solidity-coverage
            await relay.reportBenign(accounts[2], (await web3.eth.getBlockNumber()) + 1, { from: accounts[1] })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
            await relay.reportBenign(accounts[1], (await web3.eth.getBlockNumber()) + 100, { from: accounts[2] })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
        });

        it('should emit the event correctly', async function () {
            let bn = await web3.eth.getBlockNumber();
            await relay.reportBenign(accounts[1], bn, { from: accounts[2] })
                .should.be.fulfilled;
            await checkBenign({
                reporter: accounts[2],
                reported: accounts[1],
                blocknum: bn
            });

            bn = await web3.eth.getBlockNumber();
            await relay.reportBenign(accounts[2], bn, { from: accounts[1] })
                .should.be.fulfilled;
            await checkBenign({
                reporter: accounts[1],
                reported: accounts[2],
                blocknum: bn
            });
        });

        it('should not accept report on a pending-to-be-added validator', async function () {
            await relayed.addValidator(accounts[3], { from: owner }).should.be.fulfilled;
            let bn = await web3.eth.getBlockNumber();
            await relay.reportBenign(accounts[3], bn, { from: accounts[1] }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            bn = await web3.eth.getBlockNumber();
            await relay.reportBenign(accounts[3], bn, { from: accounts[2] }).should.be.fulfilled;
        });

        it('should accept report on a pending-to-be-removed validator', async function () {
            await relayed.removeValidator(accounts[2], { from: owner }).should.be.fulfilled;
            let bn = await web3.eth.getBlockNumber();
            await relay.reportBenign(accounts[2], bn, { from: accounts[2] }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            bn = await web3.eth.getBlockNumber();
            await relay.reportBenign(accounts[2], bn, { from: accounts[2] }).should.be.rejectedWith(REVERT_ERROR_MSG);
        });
    });
});

async function callBackWithEvent(_bHash, _vals, options) {
    const _result = await relayed.triggerRelayCallbackWithEvent(_bHash, _vals, options).should.be.fulfilled;
    _result.logs[0].event.should.be.equal("CallbackSuccess");
    return _result;
}
