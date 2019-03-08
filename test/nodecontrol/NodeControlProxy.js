const NodeControlSimple = artifacts.require("NodeControlSimple");
const NodeControlDb = artifacts.require("NodeControlDb");
const NodeControlProxy = artifacts.require("NodeControlProxy");

contract('NodeControlProxy', (accounts) => {

  it('must set the logic contract in the db', async () => {
    const NodeControlDbInstance = await NodeControlDb.deployed();
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();

    await NodeControlDbInstance.changeLogicContract(NodeControlSimpleInstance.address)
  })

  it("must set NodeControlLogic correctly", async () => {
    const NodeControlProxyInstance = await NodeControlProxy.deployed();
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();

    await NodeControlProxyInstance.setNodeControlLogic(accounts[1]);
    postState = await NodeControlProxyInstance.nodeControlLogic();

    assert(postState == accounts[1], "Should be the same");

    await NodeControlProxyInstance.setNodeControlLogic(NodeControlSimpleInstance.address);
    postState = await NodeControlProxyInstance.nodeControlLogic();

    assert(postState == NodeControlSimpleInstance.address, "Should be the same");
  })

  it("must set the owner correctly", async () => {
    const NodeControlProxyInstance = await NodeControlProxy.deployed();

    await NodeControlProxyInstance.setOwner(accounts[1]);
    postState = await NodeControlProxyInstance.owner();

    assert(postState == accounts[1], "Should be the same");

    await NodeControlProxyInstance.setOwner(accounts[0], {
      from: accounts[1]
    });
    postState = await NodeControlProxyInstance.owner();

    assert(postState == accounts[0], "Should be the same");
  })
})