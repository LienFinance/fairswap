const BoxExchange = artifacts.require("IDOLvsETHBoxExchange");
const TestToken = artifacts.require("TestToken");
const Factory = artifacts.require("ETHExchangeFactory");
const Calculator = artifacts.require("PriceCalculator");
const SpreadCalculator = artifacts.require("SpreadCalculator");
const TestOracle = artifacts.require("TestOracle");
const BigNumber = require("bignumber.js");

let tokenInstance;
let setting = async function (accounts) {
  const [
    factory,
    buyer1,
    buyer2,
    seller1,
    seller2,
    LP1,
    LP2,
    buyer3,
    seller3,
    seller4,
  ] = accounts;
  tokenInstance = await TestToken.new();
  let lientokenInstance = await TestToken.new();
  let oracleInstance = await TestOracle.new();
  let calcInterface = await Calculator.new();
  let spreadCalcInterface = await SpreadCalculator.new();
  let exchangeInstance = await BoxExchange.new(
    tokenInstance.address,
    calcInterface.address,
    lientokenInstance.address,
    spreadCalcInterface.address,
    oracleInstance.address,
    "SHARE",
    {from: LP1}
  );
  await tokenInstance.mintToken(20000000000, {from: factory});
  await tokenInstance.transfer(seller1, 20000000, {from: factory});
  await tokenInstance.transfer(seller2, 20000000, {from: factory});
  await tokenInstance.transfer(LP1, 10000000000, {from: factory});
  await tokenInstance.transfer(LP2, 3000000, {from: factory});

  await tokenInstance.approve(exchangeInstance.address, 10000000000, {
    from: LP1,
  });
  await tokenInstance.approve(exchangeInstance.address, 3000000, {
    from: LP2,
  });
  await tokenInstance.approve(exchangeInstance.address, 20000000, {
    from: seller1,
  });
  await tokenInstance.approve(exchangeInstance.address, 20000000, {
    from: seller2,
  });

  return {
    tokenInstance,
    lientokenInstance,
    exchangeInstance,
    oracleInstance,
  };
};

module.exports = {
  setting: setting,
};
