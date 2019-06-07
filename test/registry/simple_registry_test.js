"use strict";

const SimpleRegistry = artifacts.require("../../contracts/registry/SimpleRegistry.sol");
const {
    assertThrowsAsync,
    DEFAULT_ADDRESS
} = require(__dirname + "/../utils.js");

contract("SimpleRegistry", accounts => {

    const address = accounts[0];
    const nameEntry = "awesome";
    const name = web3.utils.sha3(nameEntry);
    let simpleReg;

    before(async () => {
        simpleReg = await SimpleRegistry.new(accounts[0], { from: accounts[0] });
    });

    it("should only allow owner to reserve a new name", async () => {
        let isFailed = false;
        try {
            await simpleReg.reserve(name, { from: accounts[1] });
            isFailed = true;
        } catch (e) {
            assert(true, "Should have thrown an exception");
        }
        assert(!isFailed, "Should have thrown exception");
    });

    it("should allow reserving a new name", async () => {
        let txReturn = await simpleReg.reserve(name);

        // if successful the contract should emit a `Reserved` event
        assert(txReturn.logs[0].event == 'Reserved', "Should have thrown the event");
        // reserved should be true
        const reserved = await simpleReg.reserved(name);
        assert.equal(reserved, true);
    });

    it("should allow name owner to set new metadata for the name", async () => {
        let isFailed = false;
        try {
            await simpleReg.setData(name, "A", web3.utils.asciiToHex("dummy"), {
                from: accounts[1]
            });
            isFailed = true;
        } catch (e) {
            assert(true, "Should have thrown an exception");
        }
        assert(!isFailed, "Should have thrown exception");


        let txReturn = await simpleReg.setData(name, "A", web3.utils.asciiToHex("dummy"));

        assert(txReturn.logs[0].event == 'DataChanged', "Should have thrown the event");
        assert(txReturn.logs[0].args.key === "A");
        assert(txReturn.logs[0].args.plainKey === "A");

        let data = await simpleReg.getData(name, "A");
        assert.equal(web3.utils.hexToUtf8(data), "dummy");

        try {
            await simpleReg.setAddress(name, "A", address, { from: accounts[1] });
            isFailed = true;
        } catch (e) {
            assert(true, "Should have thrown an exception");
        }
        assert(!isFailed, "Should have thrown exception");

        txReturn = await simpleReg.setAddress(name, "A", address);
        assert(txReturn.logs[0].event == 'DataChanged', "Should have thrown the event");
        assert(txReturn.logs[0].args.name === name, "Should have the right name");
        assert(txReturn.logs[0].args.key === "A", "Should have the right key");
        //assert.equal(events[0].args.plainKey, "A");

        data = await simpleReg.getAddress(name, "A");
        assert.equal(data, address);

        try {
            await simpleReg.setUint(name, "A", 100, { from: accounts[1] });
            isFailed = true;
        } catch (e) {
            assert(true, "Should have thrown an exception");
        }
        assert(!isFailed, "Should have thrown an exception");

        txReturn = await simpleReg.setUint(name, "A", 100);
        assert(txReturn.logs[0].event == "DataChanged", "Should have thrown the event");
        assert(txReturn.logs[0].args.name === name, "Should have the right name");
        assert(txReturn.logs[0].args.key === "A", "Should have the right key");
        assert(txReturn.logs[0].args.plainKey === "A", "Should have the same plainKey");

        data = await simpleReg.getUint(name, "A");
        assert.equal(data, 100);
    });

    it("should allow owner to propose new reverse address", async () => {
        let isFailed = false;

        try {
            await simpleReg.proposeReverse(nameEntry, address, { from: accounts[1] });
            isFailed = true;
        } catch (e) {
            assert(true, "Should have thrown an exception");
        }
        assert(!isFailed, "Should have thrown an exception");

        let txReturn = await simpleReg.proposeReverse(nameEntry, address, {
            from: address
        });

        assert(txReturn.logs[0].event == "ReverseProposed", "Should have thrown the event1");
        assert(txReturn.logs[0].args.name === nameEntry, "Should have the right name");
        assert(txReturn.logs[0].args.reverse === address, "Should have the same reverse address");

        try {
            await simpleReg.confirmReverse(nameEntry, { from: accounts[1] });
            isFailed = true;
        } catch (e) {
            assert(true, "Should have thrown an exception");
        }
        assert(!isFailed, "Should have thrown an exception");

        txReturn = await simpleReg.confirmReverse(nameEntry);
        assert(txReturn.logs[0].event == "ReverseConfirmed", "Should have thrown the event2");
        assert(txReturn.logs[0].args.name === nameEntry, "Should have the right name");
        assert(txReturn.logs[0].args.reverse === address, "Should have the same reverse address");

        assert.equal(await simpleReg.canReverse(address), true);
        assert.equal(await simpleReg.hasReverse(name), true);
        assert.equal(await simpleReg.getReverse(name), address);
        assert.equal(await simpleReg.reverse(address), nameEntry);

        txReturn = await simpleReg.removeReverse();
        assert(txReturn.logs[0].event == "ReverseRemoved", "Should have thrown the event3");
        assert(txReturn.logs[0].args.name === nameEntry, "Should have the right name");
        assert(txReturn.logs[0].args.reverse === address, "Should have the same reverse address");
    });

    it("should allow re-registration of reverse address and owner forced confirmation", async () => {
        await simpleReg.proposeReverse(nameEntry, address, { from: address });

        await simpleReg.confirmReverseAs(nameEntry, address);

        let txReturn = await simpleReg.proposeReverse(nameEntry, accounts[1]);
        assert(txReturn.logs[1].event == "ReverseProposed", "Should have thrown the event3");
        assert(txReturn.logs[1].args.name === nameEntry, "Should have the right name");
        assert(txReturn.logs[1].args.reverse === accounts[1], "Should have the same reverse address");

        assert(txReturn.logs[0].event == "ReverseRemoved", "Should have thrown the event2");
        assert(txReturn.logs[0].args.name === nameEntry, "Should have the right name");
        assert(txReturn.logs[0].args.reverse === address, "Should have the same reverse address");
    });

    it("should abort reservation if name is already reserved", async () => {
        let isFailed = false;

        try {
            await simpleReg.reserve(name);
            isFailed = true;
        } catch (e) {
            assert(true, "Should have thrown an exception");
        }
        assert(!isFailed, "Should have thrown an exception");
    });

    it("should allow the owner of the contract to transfer ownership", async () => {
        let isFailed = false;

        try {
            await simpleReg.transfer(name, accounts[1], { from: accounts[1] });
            isFailed = true;
        } catch (e) {
            assert(true, "Should have thrown an exception");
        }
        assert(!isFailed, "Should have thrown an exception");

        let owner = await simpleReg.getOwner(name);
        assert.equal(owner, accounts[0]);

        let txReturn = await simpleReg.transfer(name, accounts[1]);
        owner = await simpleReg.getOwner(name);
        assert.equal(owner, accounts[1]);

        assert(txReturn.logs[0].event == "Transferred", "Should have thrown the event");
        assert(txReturn.logs[0].args.name === name, "Should have the right name");
        assert(txReturn.logs[0].args.oldOwner === accounts[0], "Should have the right oldOwner");
        assert(txReturn.logs[0].args.newOwner === accounts[1], "Should have the right newOwner");

        // the old owner can no longer set a new owner
        try {
            await simpleReg.transfer(name, accounts[0], { from: accounts[0] });
            isFailed = true;
        } catch (e) {
            assert(true, "Should have thrown an exception");
        }
        assert(!isFailed, "Should have thrown an exception");
    });

    it("should not allow to transfer to address 0x0", async () => {
        let isFailed = false;

        try {
            await simpleReg.transfer(name, DEFAULT_ADDRESS, { from: accounts[1] });
            isFailed = true;
        } catch (e) {
            assert(true, "Should have thrown an exception");
        }
        assert(!isFailed, "Should have thrown an exception");

        let owner = await simpleReg.getOwner(name);
        assert.equal(owner, accounts[1]);
    });

    it("should allow the contract owner to drop a name", async () => {
        let isFailed = false;
        // only the contract owner can unregister badges
        // at this moment, `name` is transferred to `accounts[1]`
        try {
            await simpleReg.drop(name, { from: accounts[0] });
            isFailed = true;
        } catch (e) {
            assert(true, "Should have thrown an exception");
        }
        assert(!isFailed, "Should have thrown an exception");

        let txReturn = await simpleReg.drop(name, { from: accounts[1] });

        assert(txReturn.logs[0].event == "Dropped", "Should have thrown the event");
        assert(txReturn.logs[0].args.name === name, "Should have the right name");
        assert(txReturn.logs[0].args.owner === accounts[1], "Should have the right oldOwner");
    });

    it("should allow to re-reserve a dropped name", async () => {
        const testReg = await SimpleRegistry.new(address, { from: address });
        await testReg.reserve(name, { from: address });
        await testReg.drop(name, { from: address });
        await testReg.reserve(name, { from: address });
    });

    it("should not try to delete unconfirmed reverse entry on a drop", async () => {
        const testReg = await SimpleRegistry.new(address, { from: address });

        // the victim
        await testReg.reserve(name, { from: address });
        await testReg.proposeReverse(nameEntry, address, { from: address });
        await testReg.confirmReverse(nameEntry, { from: address });

        // the "attacker"
        let attackerNameEntry = "prankmaster69";
        let attackerName = web3.utils.sha3(attackerNameEntry);

        await testReg.reserve(attackerName, { from: address });
        await testReg.proposeReverse(attackerNameEntry, address, { from: address });
        await testReg.drop(attackerName, { from: address });

        assert.equal(await testReg.getReverse(name), address);

        await testReg.proposeReverse(nameEntry, accounts[3], { from: address });
        await testReg.confirmReverse(nameEntry, { from: accounts[3] });

        // a new attacker
        attackerNameEntry = "prankmaster70";
        attackerName = web3.utils.sha3(attackerNameEntry);

        await testReg.reserve(attackerName, { from: address });
        await testReg.proposeReverse(attackerNameEntry, accounts[3], { from: address });

        await testReg.drop(attackerName, { from: address });

        assert.equal(await testReg.getReverse(name), accounts[3]);
    });

    it("should delete confirmed reverse entry on a drop", async () => {
        const testReg = await SimpleRegistry.new(address, { from: address });

        await testReg.reserve(name, { from: address });
        await testReg.proposeReverse(nameEntry, address, { from: address });
        await testReg.confirmReverse(nameEntry, { from: address });

        let txReturn = await testReg.drop(name, { from: address });

        assert(txReturn.logs[0].event == "ReverseRemoved", "Should have thrown the event");
        assert(txReturn.logs[0].args.name === nameEntry, "Should have the right name");
        assert(txReturn.logs[0].args.reverse === address, "Should have the right oldOwner");

        assert(txReturn.logs[1].event == "Dropped", "Should have thrown the event");
        assert(txReturn.logs[1].args.name === name, "Should have the right name");
        assert(txReturn.logs[1].args.owner === address, "Should have the right oldOwner");

        await assertThrowsAsync(() => testReg.getReverse(name), "Only when entry raw");
    });

    it("should not allow interactions with dropped names", async () => {
        let isFailed = false;

        try {
            await simpleReg.getData(name, "A");
            isFailed = true;
        } catch (e) {
            assert(true, "Should have thrown an exception");
        }
        assert(!isFailed, "Should have thrown an exception");

        try {
            await simpleReg.getAddress(name, "A");
            isFailed = true;
        } catch (e) {
            assert(true, "Should have thrown an exception");
        }
        assert(!isFailed, "Should have thrown an exception");

        try {
            await simpleReg.getUint(name, "A");
            isFailed = true;
        } catch (e) {
            assert(true, "Should have thrown an exception");
        }
        assert(!isFailed, "Should have thrown an exception");

        try {
            await simpleReg.getOwner(name);
            isFailed = true;
        } catch (e) {
            assert(true, "Should have thrown an exception");
        }
        assert(!isFailed, "Should have thrown an exception");

        try {
            await simpleReg.setData(name, "A", "dummy");
            isFailed = true;
        } catch (e) {
            assert(true, "Should have thrown an exception");
        }
        assert(!isFailed, "Should have thrown an exception");

        try {
            await simpleReg.setAddress(name, "A", accounts[0]);
            isFailed = true;
        } catch (e) {
            assert(true, "Should have thrown an exception");
        }
        assert(!isFailed, "Should have thrown an exception");

        try {
            await simpleReg.setUint(name, "A", 100);
            isFailed = true;
        } catch (e) {
            assert(true, "Should have thrown an exception");
        }
        assert(!isFailed, "Should have thrown an exception");

        try {
            await simpleReg.transfer(name, accounts[1]);
            isFailed = true;
        } catch (e) {
            assert(true, "Should have thrown an exception");
        }
        assert(!isFailed, "Should have thrown an exception");

        try {
            await simpleReg.drop(name);
            isFailed = true;
        } catch (e) {
            assert(true, "Should have thrown an exception");
        }
        assert(!isFailed, "Should have thrown an exception");

        try {
            await simpleReg.confirmReverse(nameEntry);
            isFailed = true;
        } catch (e) {
            assert(true, "Should have thrown an exception");
        }
        assert(!isFailed, "Should have thrown an exception");
    });

    it("should set a new owner", async () => {
        let isFailed = false;

        let txReturn = await simpleReg.transferOwnership(accounts[1], {
            from: accounts[0]
        });

        assert(txReturn.logs[0].event == "OwnershipTransferred", "Should have thrown the event");
        assert(txReturn.logs[0].args.previousOwner === accounts[0], "Should have the old owner");
        assert(txReturn.logs[0].args.newOwner === accounts[1], "Should have a new owner");
    });
});
