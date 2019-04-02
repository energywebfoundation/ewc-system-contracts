"use strict";

const SimpleRegistry = artifacts.require("./registry/SimpleRegistry.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(SimpleRegistry, accounts[0]);
};