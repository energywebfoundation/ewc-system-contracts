const NodeControlLookUp = artifacts.require("nodeControl/NodeControlLookUp");

contract('NodeControlLookUp', (accounts) => {

  it('must set the address at the correct index', async () => {
    const NodeControlLookUpInstance = await NodeControlLookUp.deployed();

    await NodeControlLookUpInstance.addAddress(0, accounts[0], {
      from: accounts[0]
    })
    entry = await NodeControlLookUpInstance.list(0)
    assert(entry == accounts[0], "Should be the same")
  })

})