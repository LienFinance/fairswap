const BoxExchange = artifacts.require("LBTBoxExchange");
const TestToken = artifacts.require("TestToken");
const Factory = artifacts.require("LBTExchangeFactory");
const Oracle = artifacts.require("TestOracle");
const TestDeployer = artifacts.require("TestDeployer");
const BondMaker0 = artifacts.require("TestBondMaker");
const BondMaker1 = artifacts.require("TestBondMakerLBT");
const BondMaker2 = artifacts.require("TestBondMakerMultiple");
contract("Factory of BoxExchange IDOL vs LBT", function (accounts) {
  describe("Test isNormalLBT()", function () {
    let settlementtokenInstance;
    let basetokenInstance;
    let exchangeInstance;
    let calculatorAddress;
    let lientokenAddress;
    let factoryInstance;
    let bondMaker;
    const [factory] = accounts;

    beforeEach(async () => {
      let deployerInstance = await TestDeployer.new();
      let tokenAddresses = await deployerInstance.getAddresses.call();
      calculatorAddress = tokenAddresses[3];
      lientokenAddress = tokenAddresses[4];
      bondMaker = await BondMaker0.at(tokenAddresses[2]);
      basetokenInstance = await TestToken.at(tokenAddresses[0]);
      settlementtokenInstance = await TestToken.at(tokenAddresses[1]);
      await basetokenInstance.mintToken(2000000000, {from: factory});
      await settlementtokenInstance.mintToken(2000000000, {
        from: factory,
      });
      factoryInstance = await Factory.new(
        basetokenInstance.address,
        tokenAddresses[2],
        tokenAddresses[3],
        tokenAddresses[4],
        tokenAddresses[5],
        tokenAddresses[6]
      );
      await basetokenInstance.approve(factoryInstance.address, 300000000, {
        from: factory,
      });
      await settlementtokenInstance.approve(
        factoryInstance.address,
        300000000,
        {
          from: factory,
        }
      );
    });
    it("with normal LBT", async () => {
      let _receipt = await factoryInstance.launchExchange(1, 1, 1000, 10000, {
        from: factory,
      });
      exchangeInstance = await BoxExchange.at(_receipt.logs[0].args.exchange);
      let strikePrice = await exchangeInstance.strikePrice.call();
      assert.equal(
        strikePrice.toNumber(),
        1000000,
        "Could not get strike price"
      );
      let maturity = await exchangeInstance.maturity.call();

      assert(maturity.toNumber() > 0, "Could not get maturity");
      let isNormal = await exchangeInstance.isNormalLBT.call();
      assert(isNormal, "This bond should be Normal LBT");
    });

    it("with LBT that has too long maturity", async () => {
      await bondMaker.changeMaturity(web3.utils.toBN(10 ** 17));
      let _receipt = await factoryInstance.launchExchange(1, 1, 1000, 10000, {
        from: factory,
      });
      exchangeInstance = await BoxExchange.at(_receipt.logs[0].args.exchange);
      let strikePrice = await exchangeInstance.strikePrice.call();
      assert.equal(
        strikePrice.toNumber(),
        1000000,
        "Could not get strike price"
      );
      let maturity = await exchangeInstance.maturity.call();
      assert(maturity > 0, "Could not get maturity");
      let isNormal = await exchangeInstance.isNormalLBT.call();
      assert(!isNormal, "This bond should be Normal LBT");
    });

    it("with SBT", async () => {
      let _receipt = await factoryInstance.launchExchange(1, 0, 1000, 10000, {
        from: factory,
      });
      exchangeInstance = await BoxExchange.at(_receipt.logs[0].args.exchange);
      let strikePrice = await exchangeInstance.strikePrice.call();
      assert.equal(
        strikePrice.toNumber(),
        1000000,
        "Could not get strike price"
      );
      let maturity = await exchangeInstance.maturity.call();
      assert(maturity.toNumber() > 0, "Could not get maturity");
      let isNormal = await exchangeInstance.isNormalLBT.call();

      assert(!isNormal, "This bond should be LBT");
    });
  });

  describe("Test Strike Price with all LBT bondgroup", function () {
    let settlementtokenInstance;
    let basetokenInstance;
    let exchangeInstance;
    let factoryInstance;
    const [factory] = accounts;

    beforeEach(async () => {
      let deployerInstance = await TestDeployer.new();
      let tokenAddresses = await deployerInstance.getAddresses.call();

      basetokenInstance = await TestToken.at(tokenAddresses[0]);
      settlementtokenInstance = await TestToken.at(tokenAddresses[1]);
      await basetokenInstance.mintToken(2000000000, {from: factory});
      await settlementtokenInstance.mintToken(2000000000, {
        from: factory,
      });
      let makerInstance = await BondMaker1.new(settlementtokenInstance.address);
      console.log(makerInstance.address);
      factoryInstance = await Factory.new(
        basetokenInstance.address,
        makerInstance.address,
        tokenAddresses[3],
        tokenAddresses[4],
        tokenAddresses[5],
        tokenAddresses[6]
      );
      await basetokenInstance.approve(factoryInstance.address, 300000000, {
        from: factory,
      });
      await settlementtokenInstance.approve(
        factoryInstance.address,
        300000000,
        {
          from: factory,
        }
      );
    });
    it("with bondgroup which has no SBT", async () => {
      let _receipt = await factoryInstance.launchExchange(0, 0, 1000, 10000, {
        from: factory,
      });
      exchangeInstance = await BoxExchange.at(_receipt.logs[0].args.exchange);
      let strikePrice = await exchangeInstance.strikePrice.call();
      assert.equal(strikePrice.toNumber(), 0, "Could not get strike price");
      let maturity = await exchangeInstance.maturity.call();
      assert(maturity.toNumber() > 0, "Could not get maturity");
      let isNormal = await exchangeInstance.isNormalLBT.call();
      assert(!isNormal, "This bond should be Normal LBT");
    });
  });

  describe("Test Strike Price with bondgroup which has more than 3 bonds", function () {
    let settlementtokenInstance;
    let basetokenInstance;
    let exchangeInstance;
    let factoryInstance;
    const [factory] = accounts;

    beforeEach(async () => {
      let deployerInstance = await TestDeployer.new();
      let tokenAddresses = await deployerInstance.getAddresses.call();

      basetokenInstance = await TestToken.at(tokenAddresses[0]);
      settlementtokenInstance = await TestToken.at(tokenAddresses[1]);
      await basetokenInstance.mintToken(2000000000, {from: factory});
      await settlementtokenInstance.mintToken(2000000000, {
        from: factory,
      });
      let makerInstance = await BondMaker2.new(settlementtokenInstance.address);
      console.log(makerInstance.address);
      factoryInstance = await Factory.new(
        basetokenInstance.address,
        makerInstance.address,
        tokenAddresses[3],
        tokenAddresses[4],
        tokenAddresses[5],
        tokenAddresses[6]
      );
      await basetokenInstance.approve(factoryInstance.address, 300000000, {
        from: factory,
      });
      await settlementtokenInstance.approve(
        factoryInstance.address,
        300000000,
        {
          from: factory,
        }
      );
    });
    it("with bondgroup which has more than 3 bonds", async () => {
      let _receipt = await factoryInstance.launchExchange(1, 1, 1000, 10000, {
        from: factory,
      });
      exchangeInstance = await BoxExchange.at(_receipt.logs[0].args.exchange);
      let strikePrice = await exchangeInstance.strikePrice.call();
      assert.equal(strikePrice.toNumber(), 0, "Could not get strike price");
      let maturity = await exchangeInstance.maturity.call();
      assert(maturity.toNumber() > 0, "Could not get maturity");
      let isNormal = await exchangeInstance.isNormalLBT.call();
      assert(!isNormal, "This bond should be Normal LBT");
    });
  });
});
