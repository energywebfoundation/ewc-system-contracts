"use strict";

const SimpleRegistry = artifacts.require("./registry/SimpleRegistry.sol");

module.exports = deployer => {
  deployer.deploy(SimpleRegistry);
};