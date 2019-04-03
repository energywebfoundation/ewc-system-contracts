const NodeControlLookUp = artifacts.require("nodeControl/NodeControlLookUp");

contract('NodeControlLookUp', (accounts) => {
  describe('#changeAddress', () => {
    it('must set the address at the correct index', async () => {
      const NodeControlLookUpInstance = await NodeControlLookUp.deployed();

      await NodeControlLookUpInstance.changeAddress(accounts[0], {
        from: accounts[0]
      })
      entry = await NodeControlLookUpInstance.nodeControlContract()
      assert(entry == accounts[0], "Should be the same")
    })

    it('must only be callable by the owner', async () => {
      const NodeControlLookUpInstance = await NodeControlLookUp.deployed();
      isFailed = false;
      try {
        await NodeControlLookUpInstance.changeAddress(accounts[0], {
          from: accounts[1]
        });
        isFailed = true;
      } catch (e) {
        assert(e.toString().includes("Sender is not owner."), "Should have thrown the right exception")
      }
      assert(!isFailed, "Should have thrown exception")
    })
  });
})
