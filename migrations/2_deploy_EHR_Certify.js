const EHR_Certify = artifacts.require("EHR_Certify");

module.exports = function(deployer) {
  deployer.deploy(EHR_Certify);
};