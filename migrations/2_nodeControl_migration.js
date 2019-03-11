const NodeControl = artifacts.require("nodecontrol/NodeControlSimple");
const NodeControlDb = artifacts.require("nodecontrol/NodeControlDb");
const NodeControlLookUp = artifacts.require("nodecontrol/NodeControlLookUp")

module.exports = function(deployer) {
  deployer.deploy(NodeControlDb).then(function() {
    return deployer.deploy(NodeControl, NodeControlDb.address);
  }).then(function() {
    return deployer.deploy(NodeControlLookUp);
  });
};

