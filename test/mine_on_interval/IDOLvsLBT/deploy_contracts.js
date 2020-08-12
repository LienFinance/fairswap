const BoxExchange = artifacts.require("LBTBoxExchange");
const TestToken = artifacts.require("TestToken");
const Factory = artifacts.require("LBTExchangeFactory");
const Oracle = artifacts.require("TestOracle");
const Calculator = artifacts.require("PriceCalculator");
const SpreadCalculator = artifacts.require("SpreadCalculator");
const TestDeployer = artifacts.require("TestDeployer");
const BondMaker = artifacts.require("TestBondMaker");
const BondToken = artifacts.require("BondToken");
const ZAddress = "0x0000000000000000000000000000000000000000";

let settlementtokenInstance;
let basetokenInstance;
let lientokenInstance;
let oracleInstance;

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
  let deployerInstance = await TestDeployer.new();
  let tokenAddresses = await deployerInstance.getAddresses.call();
  oracleInstance = await Oracle.at(tokenAddresses[6]);
  let factoryInstance = await Factory.new(
    tokenAddresses[0],
    tokenAddresses[2],
    tokenAddresses[3],
    tokenAddresses[4],
    tokenAddresses[5],
    tokenAddresses[6]
  );
  basetokenInstance = await TestToken.at(tokenAddresses[0]);
  settlementtokenInstance = await TestToken.at(tokenAddresses[1]);
  lientokenInstance = await TestToken.at(tokenAddresses[4]);
  await basetokenInstance.mintToken(2000000000, {from: factory});
  await settlementtokenInstance.mintToken(2000000000, {from: factory});
  await basetokenInstance.transfer(buyer1, 200000000, {from: factory});
  await basetokenInstance.transfer(buyer2, 200000000, {from: factory});
  await basetokenInstance.transfer(LP1, 600000000, {from: factory});
  await basetokenInstance.transfer(LP2, 300000000, {from: factory});
  await basetokenInstance.approve(factoryInstance.address, 300000000, {
    from: LP1,
  });

  await settlementtokenInstance.transfer(seller1, 200000000, {
    from: factory,
  });
  await settlementtokenInstance.transfer(seller2, 200000000, {
    from: factory,
  });
  await settlementtokenInstance.transfer(LP1, 600000000, {from: factory});
  await settlementtokenInstance.transfer(LP2, 300000000, {from: factory});
  await settlementtokenInstance.approve(factoryInstance.address, 300000000, {
    from: LP1,
  });
  await oracleInstance.changeData(
    (300 * 10 ** 8).toFixed(),
    (1 * 10 ** 8).toFixed()
  );
  let volatileCalcAddress1 = tokenAddresses[5];
  let volatileCalcAddress2 = tokenAddresses[6];
  let bondMakerAddress = tokenAddresses[2];
  let bondMaker = await BondMaker.at(tokenAddresses[2]);
  let bond = await bondMaker.getBondGroup.call(0);
  let bondID = web3.utils.toHex("b");

  return {
    basetokenInstance,
    settlementtokenInstance,
    lientokenInstance,
    factoryInstance,
    oracleInstance,
    bondMakerAddress,
    volatileCalcAddress1,
    volatileCalcAddress2,
    bondID,
  };
};

let setbondtoken = async function (accounts) {
  const eth = web3.utils.toBN(1e19); // 10ETH
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
  let deployerInstance = await TestDeployer.new();
  let tokenAddresses = await deployerInstance.getAddresses.call();
  oracleInstance = await Oracle.at(tokenAddresses[6]);
  settlementtokenInstance = await BondToken.new("BondToken", "BND");
  let bondMakerInstance = await BondMaker.new(settlementtokenInstance.address);
  let factoryInstance = await Factory.new(
    tokenAddresses[0],
    bondMakerInstance.address,
    tokenAddresses[3],
    tokenAddresses[4],
    tokenAddresses[5],
    tokenAddresses[6]
  );
  basetokenInstance = await TestToken.at(tokenAddresses[0]);
  lientokenInstance = await TestToken.at(tokenAddresses[4]);
  await basetokenInstance.mintToken(2000000000, {from: factory});
  await settlementtokenInstance.mint(factory, 2000000000, {from: factory});
  await basetokenInstance.transfer(LP1, 600000000, {from: factory});
  await basetokenInstance.transfer(LP2, 300000000, {from: factory});
  await basetokenInstance.approve(factoryInstance.address, 300000000, {
    from: LP1,
  });
  await settlementtokenInstance.transfer(LP1, 600000000, {from: factory});
  await settlementtokenInstance.transfer(LP2, 300000000, {from: factory});
  await settlementtokenInstance.approve(factoryInstance.address, 300000000, {
    from: LP1,
  });
  await settlementtokenInstance.sendTransaction({
    from: factory,
    value: eth,
  });
  await oracleInstance.changeData(
    (300 * 10 ** 8).toFixed(),
    (1 * 10 ** 8).toFixed()
  );

  return {
    basetokenInstance,
    settlementtokenInstance,
    lientokenInstance,
    factoryInstance,
  };
};

let setFakeBondMaker = async function (accounts) {
  const eth = web3.utils.toBN(1e19); // 10ETH
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
  let deployerInstance = await TestDeployer.new();
  let tokenAddresses = await deployerInstance.getAddresses.call();
  oracleInstance = await Oracle.at(tokenAddresses[6]);
  settlementtokenInstance = await BondToken.new("BondToken", "BND");
  let bondMakerInstance = await BondMaker.new(ZAddress);
  let factoryInstance = await Factory.new(
    tokenAddresses[0],
    bondMakerInstance.address,
    tokenAddresses[3],
    tokenAddresses[4],
    tokenAddresses[5],
    tokenAddresses[6]
  );
  basetokenInstance = await TestToken.at(tokenAddresses[0]);
  lientokenInstance = await TestToken.at(tokenAddresses[4]);
  await basetokenInstance.mintToken(2000000000, {from: factory});
  await settlementtokenInstance.mint(factory, 2000000000, {from: factory});
  await basetokenInstance.transfer(LP1, 600000000, {from: factory});
  await basetokenInstance.transfer(LP2, 300000000, {from: factory});
  await basetokenInstance.approve(factoryInstance.address, 300000000, {
    from: LP1,
  });
  await settlementtokenInstance.transfer(LP1, 600000000, {from: factory});
  await settlementtokenInstance.transfer(LP2, 300000000, {from: factory});
  await settlementtokenInstance.approve(factoryInstance.address, 300000000, {
    from: LP1,
  });
  await settlementtokenInstance.sendTransaction({
    from: factory,
    value: eth,
  });
  await oracleInstance.changeData(
    (300 * 10 ** 8).toFixed(),
    (1 * 10 ** 8).toFixed()
  );

  return {
    basetokenInstance,
    settlementtokenInstance,
    lientokenInstance,
    factoryInstance,
  };
};

let approve = async function (exchangeAddress, accounts) {
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
  await settlementtokenInstance.approve(exchangeAddress, 300000000, {
    from: LP1,
  });
  await settlementtokenInstance.approve(exchangeAddress, 300000000, {
    from: LP2,
  });
  await settlementtokenInstance.approve(exchangeAddress, 200000000, {
    from: seller1,
  });
  await settlementtokenInstance.approve(exchangeAddress, 200000000, {
    from: seller2,
  });
  await basetokenInstance.approve(exchangeAddress, 300000000, {
    from: LP1,
  });
  await basetokenInstance.approve(exchangeAddress, 300000000, {
    from: LP2,
  });
  await basetokenInstance.approve(exchangeAddress, 200000000, {
    from: buyer1,
  });
  await basetokenInstance.approve(exchangeAddress, 200000000, {
    from: buyer2,
  });
};

module.exports = {
  setting: setting,
  setbondtoken: setbondtoken,
  approve: approve,
  setFakeBondMaker: setFakeBondMaker,
};
