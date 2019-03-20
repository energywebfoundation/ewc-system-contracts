"use strict";

const SimpleRegistry = artifacts.require("./SimpleRegistry.sol");

contract("SimpleRegistry", accounts => {

  const address = accounts[0];
  const nameEntry = "awesome";
  const name = web3.utils.sha3(nameEntry);

  it("should only allow owner to reserve a new name", async () => {
    const simpleReg = await SimpleRegistry.deployed();
    let isFailed = false
    try {
      await simpleReg.reserve(name, {
        value: web3.utils.toWei("1", "ether"),
        from: accounts[1]
      })
      isFailed = true
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown exception")

  });

  it("should only allow to reserve a new name when fee is available", async () => {
    const simpleReg = await SimpleRegistry.deployed();
    let isFailed = false
    try {
      await simpleReg.reserve(name, {
        value: web3.utils.toWei("0.5", "ether"),
        from: accounts[1]
      })
      isFailed = true
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown exception")

  });

  it("should allow reserving a new name", async () => {
    const simpleReg = await SimpleRegistry.deployed();

    // reservation requires a fee of 1 ETH
    let txReturn = await simpleReg.reserve(name, {
      value: web3.utils.toWei("1", "ether")
    });

    // if successful the contract should emit a `Reserved` event
    assert(txReturn.logs[0].event == 'Reserved', "Should have thrown the event")
    // reserved should be true
    const reserved = await simpleReg.reserved(name);
    assert.equal(reserved, true);
  });

  it("should allow name owner to set new metadata for the name", async () => {
    const simpleReg = await SimpleRegistry.deployed();

    let isFailed = false
    try {
      await simpleReg.setData(name, "A", web3.utils.asciiToHex("dummy"), {
        from: accounts[1]
      });
      isFailed = true
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown exception")


    let txReturn = await simpleReg.setData(name, "A", web3.utils.asciiToHex("dummy"));

    assert(txReturn.logs[0].event == 'DataChanged', "Should have thrown the event")
    assert(txReturn.logs[0].args.key === "A");
    assert(txReturn.logs[0].args.plainKey === "A");

    let data = await simpleReg.getData(name, "A");
    assert.equal(web3.utils.hexToUtf8(data), "dummy");

    try {
      await simpleReg.setAddress(name, "A", address, {
        from: accounts[1]
      })
      isFailed = true
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown exception")

    txReturn = await simpleReg.setAddress(name, "A", address);
    assert(txReturn.logs[0].event == 'DataChanged', "Should have thrown the event")
    assert(txReturn.logs[0].args.name === name, "Should have the right name");
    assert(txReturn.logs[0].args.key === "A", "Should have the right key");
    //assert.equal(events[0].args.plainKey, "A");

    data = await simpleReg.getAddress(name, "A");
    assert.equal(data, address);

    try {
      await simpleReg.setUint(name, "A", 100, {
        from: accounts[1]
      })
      isFaield = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown an exception")

    txReturn = await simpleReg.setUint(name, "A", 100);
    assert(txReturn.logs[0].event == "DataChanged", "Should have thrown the event")
    assert(txReturn.logs[0].args.name === name, "Should have the right name");
    assert(txReturn.logs[0].args.key === "A", "Should have the right key");
    assert(txReturn.logs[0].args.plainKey === "A", "Should have the same plainKey");

    data = await simpleReg.getUint(name, "A");
    assert.equal(data, 100);
  });

  it("should allow owner to propose new reverse address", async () => {
    const simpleReg = await SimpleRegistry.deployed();
    let isFailed = false

    try {
      await simpleReg.proposeReverse(nameEntry, address, {
        from: accounts[1]
      })
      isFaield = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown an exception")

    let txReturn = await simpleReg.proposeReverse(nameEntry, address, {
      from: address
    });

    assert(txReturn.logs[0].event == "ReverseProposed", "Should have thrown the event1")
    assert(txReturn.logs[0].args.name === nameEntry, "Should have the right name");
    assert(txReturn.logs[0].args.reverse === address, "Should have the same reverse address");

    try {
      await simpleReg.confirmReverse(nameEntry, {
        from: accounts[1]
      })
      isFaield = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown an exception")

    txReturn = await simpleReg.confirmReverse(nameEntry);
    assert(txReturn.logs[0].event == "ReverseConfirmed", "Should have thrown the event2")
    assert(txReturn.logs[0].args.name === nameEntry, "Should have the right name");
    assert(txReturn.logs[0].args.reverse === address, "Should have the same reverse address");

    assert.equal(await simpleReg.canReverse(address), true);
    assert.equal(await simpleReg.hasReverse(name), true);
    assert.equal(await simpleReg.getReverse(name), address);
    assert.equal(await simpleReg.reverse(address), nameEntry);

    txReturn = await simpleReg.removeReverse();
    assert(txReturn.logs[0].event == "ReverseRemoved", "Should have thrown the event3")
    assert(txReturn.logs[0].args.name === nameEntry, "Should have the right name");
    assert(txReturn.logs[0].args.reverse === address, "Should have the same reverse address");
  });

  it("should allow re-registration of reverse address and owner forced confirmation", async () => {
    const simpleReg = await SimpleRegistry.deployed();

    await simpleReg.proposeReverse(nameEntry, address, {
      from: address
    });
    await simpleReg.confirmReverseAs(nameEntry, address);

    let txReturn = await simpleReg.proposeReverse(nameEntry, accounts[1]);
    assert(txReturn.logs[1].event == "ReverseProposed", "Should have thrown the event3")
    assert(txReturn.logs[1].args.name === nameEntry, "Should have the right name");
    assert(txReturn.logs[1].args.reverse === accounts[1], "Should have the same reverse address");

    assert(txReturn.logs[0].event == "ReverseRemoved", "Should have thrown the event2")
    assert(txReturn.logs[0].args.name === nameEntry, "Should have the right name");
    assert(txReturn.logs[0].args.reverse === address, "Should have the same reverse address");
  });

  it("should abort reservation if name is already reserved", async () => {
    const simpleReg = await SimpleRegistry.deployed();
    let isFailed = false

    try {
      await simpleReg.reserve(name, {
        value: web3.utils.toWei("1", "ether")
      })
      isFaield = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown an exception")
  });

  it("should abort reservation if the fee is not paid", async () => {
    const simpleReg = await SimpleRegistry.deployed();
    let isFailed = false

    try {
      await simpleReg.reserve("newname", {
        value: web3.utils.toWei("0.5", "ether")
      })
      isFaield = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown an exception")
  });

  it("should allow the owner of the contract to transfer ownership", async () => {
    const simpleReg = await SimpleRegistry.deployed();
    let isFailed = false

    try {
      await simpleReg.transfer(name, accounts[1], {
        from: accounts[1]
      })
      isFaield = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown an exception")

    let owner = await simpleReg.getOwner(name);
    assert.equal(owner, accounts[0]);

    let txReturn = await simpleReg.transfer(name, accounts[1]);
    owner = await simpleReg.getOwner(name);
    assert.equal(owner, accounts[1]);

    assert(txReturn.logs[0].event == "Transferred", "Should have thrown the event")
    assert(txReturn.logs[0].args.name === name, "Should have the right name");
    assert(txReturn.logs[0].args.oldOwner === accounts[0], "Should have the right oldOwner");
    assert(txReturn.logs[0].args.newOwner === accounts[1], "Should have the right newOwner");

    // the old owner can no longer set a new owner
    try {
      await simpleReg.transfer(name, accounts[0], {
        from: accounts[0]
      })
      isFaield = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown an exception")
  });

  it("should allow the contract owner to set the registration fee", async () => {
    const simpleReg = await SimpleRegistry.deployed();
    let isFailed = false
    // only the contract owner can set a new fee
    try {
      await simpleReg.setFee(10, {
        from: accounts[1]
      })
      isFaield = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown an exception")

    await simpleReg.setFee(10, {
      from: accounts[0]
    });
    const fee = await simpleReg.fee();

    assert.equal(fee, 10);
  });

  it("should allow the contract owner to drop a name", async () => {
    const simpleReg = await SimpleRegistry.deployed();
    let isFailed = false
    // only the contract owner can unregister badges
    // at this moment, `name` is transferred to `accounts[1]`
    try {
      await simpleReg.drop(name, {
        from: accounts[0]
      })
      isFaield = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown an exception")

    let txReturn = await simpleReg.drop(name, {
      from: accounts[1]
    });

    assert(txReturn.logs[0].event == "Dropped", "Should have thrown the event")
    assert(txReturn.logs[0].args.name === name, "Should have the right name");
    assert(txReturn.logs[0].args.owner === accounts[1], "Should have the right oldOwner");
  });

  it("should allow the contract owner to drain all the ether from the contract", async () => {
    const simpleReg = await SimpleRegistry.deployed();
    let isFailed = false
    // only the contract owner can drain the contract
    try {
      await simpleReg.drain({
        from: accounts[1]
      })
      isFaield = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown an exception")

    const balance = await web3.eth.getBalance(accounts[0]);
    await simpleReg.drain({
      from: accounts[0]
    });

    const newBalance = await web3.eth.getBalance(accounts[0]);
    const expectedBalance = web3.utils.toBN(balance).add(web3.utils.toBN(web3.utils.toWei("0.99", "ether")));

    // accounts[1]'s balance should have increased by at least 0.99 ETH (to account for gas costs)
    assert(web3.utils.toBN(newBalance).cmp(web3.utils.toBN(expectedBalance)) === 1, "new balance should be higher then old");
  });

  it("should not allow interactions with dropped names", async () => {
    const simpleReg = await SimpleRegistry.deployed();
    let isFailed = false

    try {
      await simpleReg.getData(name, "A")
      isFaield = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown an exception")

    try {
      await simpleReg.getAddress(name, "A")
      isFaield = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown an exception")

    try {
      await simpleReg.getUint(name, "A")
      isFaield = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown an exception")

    try {
      await simpleReg.getOwner(name)
      isFaield = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown an exception")

    try {
      await simpleReg.setData(name, "A", "dummy")
      isFaield = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown an exception")

    try {
      await simpleReg.setAddress(name, "A", accounts[0])
      isFaield = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown an exception")

    try {
      await simpleReg.setUint(name, "A", 100)
      isFaield = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown an exception")

    try {
      await simpleReg.transfer(name, accounts[1])
      isFaield = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown an exception")

    try {
      await simpleReg.dropn(name)
      isFaield = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown an exception")

    try {
      await simpleReg.confirmReverse(nameEntry)
      isFaield = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown an exception")
  });

  it("should set a new owner", async () => {
    const simpleReg = await SimpleRegistry.deployed();
    let isFailed = false

    let txReturn = await simpleReg.setOwner(accounts[1], {
      from: accounts[0]
    });

    assert(txReturn.logs[0].event == "NewOwner", "Should have thrown the event")
    assert(txReturn.logs[0].args.old === accounts[0], "Should have the old owner");
    assert(txReturn.logs[0].args.current === accounts[1], "Should have a new owner");
  });
});