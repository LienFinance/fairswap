const BoxExchange = artifacts.require("LienBoxExchange");
const TestToken = artifacts.require("TestToken");
const LienToken = artifacts.require("LienToken");
const Calculator = artifacts.require("PriceCalculator");
const SpreadCalculator = artifacts.require("SpreadCalculator");
const TestOracle = artifacts.require("TestOracle");
let setting = async function (accounts) {
  const [factory, LP1, LP2] = accounts;

  let basetokenInstance = await TestToken.new();
  let lientokenInstance = await LienToken.new(1000, 1000, 10000000, {
    from: factory,
  });
  let othertokenInstance = await TestToken.new();
  let oracleInterface = await TestOracle.new();
  let calcInterface = await Calculator.new();
  let spreadCalc = await SpreadCalculator.new();
  let exchangeInstance = await BoxExchange.new(
    basetokenInstance.address,
    calcInterface.address,
    lientokenInstance.address,
    spreadCalc.address,
    "SHARE",
    {
      from: LP1,
    }
  );

  await basetokenInstance.mintToken(2000000000, {from: factory});
  await othertokenInstance.mintToken(2000000000, {from: factory});

  await basetokenInstance.transfer(LP1, 600000000, {from: factory});
  await basetokenInstance.transfer(LP2, 600000000, {from: factory});
  await basetokenInstance.approve(exchangeInstance.address, 300000000, {
    from: LP1,
  });
  await basetokenInstance.approve(exchangeInstance.address, 300000000, {
    from: LP2,
  });

  await lientokenInstance.transfer(LP1, 5000000, {from: factory});

  await lientokenInstance.transfer(LP2, 2500000, {from: factory});
  await lientokenInstance.approve(exchangeInstance.address, 2500000, {
    from: LP1,
  });

  await lientokenInstance.approve(exchangeInstance.address, 2500000, {
    from: LP2,
  });

  return {
    exchangeInstance,
    basetokenInstance,
    lientokenInstance,

    othertokenInstance,
  };
};

module.exports = {
  setting: setting,
};
