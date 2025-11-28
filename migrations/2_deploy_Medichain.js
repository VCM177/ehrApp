const medichain = artifacts.require("Medichain");

module.exports = function(deployer) {
  deployer.deploy(medichain);
};