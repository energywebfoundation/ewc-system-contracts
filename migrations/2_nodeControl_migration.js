const NodeControl = artifacts.require("nodecontrol/NodeControlSimple");
const NodeControlDb = artifacts.require("nodecontrol/NodeControlDb");
const NodeControlLookUp = artifacts.require("nodecontrol/NodeControlLookUp");

module.exports = function(deployer, name, accounts) {
  deployer.deploy(NodeControlLookUp, accounts[0]).then(function() {
    return deployer.deploy(NodeControlDb, NodeControlLookUp.address, accounts[0]);
  }).then(function() {
    return deployer.deploy(NodeControl, NodeControlDb.address, accounts[0]);
  });
};
