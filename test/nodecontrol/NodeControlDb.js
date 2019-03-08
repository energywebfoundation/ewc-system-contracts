const NodeControlSimple = artifacts.require("nodecontrol/NodeControlSimple");
const NodeControlDb = artifacts.require("nodecontrol/NodeControlDb");

contract('NodeControlDb', (accounts) => {

  it('must set the logic contract in the db', async () => {
    const NodeControlDbInstance = await NodeControlDb.deployed();
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();

    await NodeControlDbInstance.changeLogicContract(NodeControlSimpleInstance.address)
  })

  it('must set the new logic contract correctly', async () => {
    const NodeControlDbInstance = await NodeControlDb.deployed();

    await NodeControlDbInstance.changeLogicContract(accounts[1]);
    postState = await NodeControlDbInstance.nodeControlLogic();

    assert(postState == accounts[1], "Should be the accounts from the parameter");

    await NodeControlDbInstance.changeLogicContract(NodeControlSimple.address);
    postState = await NodeControlDbInstance.nodeControlLogic();

    assert(postState == NodeControlSimple.address, "Should be the logic instance address")
  })

  it('must set the new owner correctly', async () => {
    const NodeControlDbInstance = await NodeControlDb.deployed();

    await NodeControlDbInstance.setOwner(accounts[1]);
    postState = await NodeControlDbInstance.owner();

    assert(postState == accounts[1], "Should be the accounts from the parameter");

    await NodeControlDbInstance.setOwner(accounts[0], {
      from: accounts[1]
    });
    postState = await NodeControlDbInstance.owner();

    assert(postState == accounts[0], "Should be the logic instance address")
  })

  it("must only let the logic contract call setState", async () => {
    const NodeControlDbInstance = await NodeControlDb.deployed();
    isFailed = false;
    try {
      await NodeControlDbInstance.setState(accounts[1], '0x02', "dockerName123", '0x02', "chainSpecUrl123", true, {
        from: accounts[1]
      });
      isFailed = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown exception")
  })

  it("must only let the logic contract call setUpdateConfirmed", async () => {
    const NodeControlDbInstance = await NodeControlDb.deployed();
    isFailed = false;
    try {
      await NodeControlDbInstance.setUpdateConfirmed(accounts[1], '0x02', "dockerName123", '0x02', "chainSpecUrl123", true, {
        from: accounts[1]
      });
      isFailed = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown exception")
  })

  it("must only let the logic contract call getState", async () => {
    const NodeControlDbInstance = await NodeControlDb.deployed();
    isFailed = false;
    try {
      await NodeControlDbInstance.getState(accounts[1], {
        from: accounts[1]
      });
      isFailed = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown exception")
  })

  it("must only let the logic contract call getDockerSha", async () => {
    const NodeControlDbInstance = await NodeControlDb.deployed();
    isFailed = false;
    try {
      await NodeControlDbInstance.getDockerSha(accounts[1], {
        from: accounts[1]
      });
      isFailed = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown exception")
  })

  it("must only let the logic contract call getDockerName", async () => {
    const NodeControlDbInstance = await NodeControlDb.deployed();
    isFailed = false;
    try {
      await NodeControlDbInstance.getDockerName(accounts[1], {
        from: accounts[1]
      });
      isFailed = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown exception")
  })

  it("must only let the logic contract call getChainSpecSha", async () => {
    const NodeControlDbInstance = await NodeControlDb.deployed();
    isFailed = false;
    try {
      await NodeControlDbInstance.getChainSpecSha(accounts[1], {
        from: accounts[1]
      });
      isFailed = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown exception")
  })

  it("must only let the logic contract call getChainSpecUrl", async () => {
    const NodeControlDbInstance = await NodeControlDb.deployed();
    isFailed = false;
    try {
      await NodeControlDbInstance.getChainSpecUrl(accounts[1], {
        from: accounts[1]
      });
      isFailed = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown exception")
  })

  it("must only let the logic contract call getIsSigning", async () => {
    const NodeControlDbInstance = await NodeControlDb.deployed();
    isFailed = false;
    try {
      await NodeControlDbInstance.getIsSigning(accounts[1], {
        from: accounts[1]
      });
      isFailed = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown exception")
  })
});