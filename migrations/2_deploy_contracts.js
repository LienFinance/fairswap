const TestToken = artifacts.require("TestToken");
const TestBondMaker = artifacts.require("TestBondMaker");
const PriceCalculator = artifacts.require("PriceCalculator");
const FeeCalculator = artifacts.require("FeeCalculator");
const TestOracle = artifacts.require("TestOracle");
const LienExchange = artifacts.require("LienBoxExchange");
const LBTFactory = artifacts.require("LBTExchangeFactory");
const ETHFactory = artifacts.require("ETHExchangeFactory");

module.exports = async (deployer, network) => {
  if (network === 'development') {
    await deployer.deploy(TestToken);
    let idol = await TestToken.new();
    let lien = await TestToken.new();
    let lbt = await TestToken.new();
    
    await deployer.deploy(TestOracle);

    await deployer.deploy(TestBondMaker, lbt.address);
    await deployer.deploy(PriceCalculator);
    await deployer.deploy(FeeCalculator);
    console.log(TestBondMaker.address)

    await deployer.deploy(LBTFactory, idol.address, TestBondMaker.address, PriceCalculator.address, lien.address, FeeCalculator.address, TestOracle.address); 
    await deployer.deploy(LienExchange, idol.address, PriceCalculator.address, lien.address, FeeCalculator.address, "SHARE-IDOL-LIEN"); 
    await deployer.deploy(ETHFactory, lien.address, PriceCalculator.address, FeeCalculator.address);
  } 
};