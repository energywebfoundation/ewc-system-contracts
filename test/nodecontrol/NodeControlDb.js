const NodeControlSimple = artifacts.require("nodecontrol/NodeControlSimple");
const NodeControlDb = artifacts.require("nodecontrol/NodeControlDb");
const NodeControlLookUp = artifacts.require("nodecontrol/NodeControlLookUp");

contract('NodeControlDb', (accounts) => {
  describe('#changeLookUpContract', () => {
    it('must set the new lookup contract correctly', async () => {
      const NodeControlDbInstance = await NodeControlDb.deployed();

      await NodeControlDbInstance.changeLookUpContract(accounts[1]);
      postState = await NodeControlDbInstance.nodeControlLookUp();

      assert(postState == accounts[1], "Should be the accounts from the parameter");

      await NodeControlDbInstance.changeLookUpContract(NodeControlLookUp.address);
      postState = await NodeControlDbInstance.nodeControlLookUp();

      assert(postState == NodeControlLookUp.address, "Should be the logic instance address")
    })

    it("must not allow 0x0 as address for new logic contract", async () => {
      const NodeControlDbInstance = await NodeControlDb.deployed();
      isFailed = false;
      try {
        await NodeControlDbInstance.changeLookUpContract('0x0000000000000000000000000000000000000000', {
          from: accounts[0]
        });
        isFailed = true;
      } catch (e) {
        assert(e.toString().includes("Error: newLookUp is not allowed to be 0x0"), "Should have thrown the right exception")
      }
      assert(!isFailed, "Should have thrown exception")
    })

    it("must only allow owner to change logic contract", async () => {
      const NodeControlDbInstance = await NodeControlDb.deployed();
      isFailed = false;
      try {
        await NodeControlDbInstance.changeLookUpContract('0x0000000000000000000000000000000000000001', {
          from: accounts[1]
        });
        isFailed = true;
      } catch (e) {
        assert(e.toString().includes("Sender is not owner."), "Should have thrown the right exception")
      }
      assert(!isFailed, "Should have thrown exception")
    })
  });

  describe('#transferOwnership', () => {
    it('must set the new owner correctly', async () => {
      const NodeControlDbInstance = await NodeControlDb.deployed();

      await NodeControlDbInstance.transferOwnership(accounts[1]);
      postState = await NodeControlDbInstance.owner();

      assert(postState == accounts[1], "Should be the accounts from the parameter");

      await NodeControlDbInstance.transferOwnership(accounts[0], {
        from: accounts[1]
      });
      postState = await NodeControlDbInstance.owner();

      assert(postState == accounts[0], "Should be the logic instance address")
    })

    it("must not allow 0x0 as address for new owner", async () => {
      const NodeControlDbInstance = await NodeControlDb.deployed();
      isFailed = false;
      try {
        await NodeControlDbInstance.transferOwnership('0x0000000000000000000000000000000000000000', {
          from: accounts[0]
        });
        isFailed = true;
      } catch (e) {
        assert(e.toString().includes("New owner address cannot be 0x0"), "Should have thrown the right exception")
      }
      assert(!isFailed, "Should have thrown exception")
    })

    it("must only allow owner to change owner", async () => {
      const NodeControlDbInstance = await NodeControlDb.deployed();
      isFailed = false;
      try {
        await NodeControlDbInstance.transferOwnership('0x0000000000000000000000000000000000000001', {
          from: accounts[1]
        });
        isFailed = true;
      } catch (e) {
        assert(e.toString().includes("Sender is not owner."), "Should have thrown the right exception")
      }
      assert(!isFailed, "Should have thrown exception")
    })
  });

  describe('#setState', () => {
    it("must only let the logic contract call setState", async () => {
      const NodeControlDbInstance = await NodeControlDb.deployed();
      isFailed = false;
      try {
        await NodeControlDbInstance.setState(accounts[1], '0x02', "dockerName123", '0x02', "chainSpecUrl123", true, {
          from: accounts[1]
        });
        isFailed = true;
      } catch (e) {
        assert(e.toString().includes("Error: onlyLogic Db"), "Should have thrown the right exception")
      }
      assert(!isFailed, "Should have thrown exception")
    })
  });

  describe('#setUpdateConfirmed', () => {
    it("must only let the logic contract call setUpdateConfirmed", async () => {
      const NodeControlDbInstance = await NodeControlDb.deployed();
      isFailed = false;
      try {
        await NodeControlDbInstance.setUpdateConfirmed(accounts[1], {
          from: accounts[1]
        });
        isFailed = true;
      } catch (e) {
        assert(e.toString().includes("Error: onlyLogic Db"), "Should have thrown the right exception")
      }
      assert(!isFailed, "Should have thrown exception")
    })
  });

  describe('Get functions', () => {
    it("must only let the logic contract call getState", async () => {
      const NodeControlDbInstance = await NodeControlDb.deployed();
      isFailed = false;
      try {
        await NodeControlDbInstance.getState(accounts[1], {
          from: accounts[1]
        });
        isFailed = true;
      } catch (e) {
        assert(e.toString().includes("Error: onlyLogic Db"), "Should have thrown the right exception")
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
        assert(e.toString().includes("Error: onlyLogic Db"), "Should have thrown the right exception")
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
        assert(e.toString().includes("Error: onlyLogic Db"), "Should have thrown the right exception")
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
        assert(e.toString().includes("Error: onlyLogic Db"), "Should have thrown the right exception")
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
        assert(e.toString().includes("Error: onlyLogic Db"), "Should have thrown the right exception")
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
        assert(e.toString().includes("Error: onlyLogic Db"), "Should have thrown the right exception")
      }
      assert(!isFailed, "Should have thrown exception")
    })
  });
});
