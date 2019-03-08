const NodeControl = artifacts.require("nodecontrol/NodeControlSimple");
const NodeControlDb = artifacts.require("nodecontrol/NodeControlDb");
const NodeControlProxy = artifacts.require("nodecontrol/NodeControlProxy")
var db,
  logic;
module.exports = function(deployer) {
  deployer.deploy(NodeControlDb).then(function() {
    return deployer.deploy(NodeControl, NodeControlDb.address);
  }).then(function() {
    return deployer.deploy(NodeControlProxy, NodeControl.address);
  });
};

