const Calculator = artifacts.require("PriceCalculator");
const SpreadCalculator = artifacts.require("SpreadCalculator");
const TestDeployer = artifacts.require("TestDeployer");
const Oracle = artifacts.require("TestOracle");
const ZAddress = "0x0000000000000000000000000000000000000000";
const {expectEvent, expectRevert, BN} = require("@openzeppelin/test-helpers");

contract("Calculator", function (accounts) {
  describe("Calculator with unvolatile oracle", function () {
    let calculatorInstance;
    let spreadCalculatorInstance;
    let oracle;
    const strikePrice = web3.utils.toBN(100e18).toString();
    before(async () => {
      calculatorInstance = await Calculator.new();
      spreadCalculatorInstance = await SpreadCalculator.new();
      oracle = await Oracle.new();
    });
    it("price is inner tolerance rate", async () => {
      let result = await calculatorInstance.calculatePrice.call(
        200,
        200,
        150,
        150,
        200000,
        100000
      );
      assert.equal(result[0].toString(), "500499001996007984", "Invalid price");
      assert.equal(result[1], 0, "Invalid refundRate of buy order");
      assert.equal(result[2], 0, "Invalid refundRate of buy limit order");
    });

    it("over tolerance rate, buy limit order is refunded partially", async () => {
      let result = await calculatorInstance.calculatePrice.call(
        150,
        700,
        150,
        100,
        200000,
        100000
      );
      assert.equal(result[0].toString(), "499500499500499500", "Invalid price");
      assert.equal(result[1], 1, "invalid refund status");
      assert.equal(
        result[2].toString(),
        "214285714285714285",
        "invalid refund rate"
      );
      assert.equal(result[3], 700, "Invalid 0to1 execution amount");
      assert.equal(result[4], 250, "Invalid 1to0 execution amount");
    });

    it("over tolerance, buy limit order is refunded all", async () => {
      let result = await calculatorInstance.calculatePrice.call(
        750,
        400,
        100,
        150,
        200000,
        100000
      );
      assert.equal(result[0].toString(), "499377334993773349", "Invalid price");
      assert.equal(result[1], 1, "invalid refund status");
      assert.equal(
        result[2].toString(),
        "1000000000000000000",
        "invalid refund rate"
      );
      assert.equal(result[3], 750, "Invalid 0to1 execution amount");
      assert.equal(result[4], 250, "Invalid 1to0 execution amount");
    });

    it("over tolerance, sell limit order is refunded partially", async () => {
      let result = await calculatorInstance.calculatePrice.call(
        150,
        100,
        150,
        150,
        200000,
        100000
      );
      assert.equal(result[0].toString(), "500500000000000000", "Invalid price");
      assert.equal(result[1], 3, "invalid refund status");
      assert.equal(
        result[2].toString(),
        "500000000000000000",
        "invalid refund rate"
      );
      assert.equal(result[3], 250, "Invalid 0to1 execution amount");
      assert.equal(result[4], 225, "Invalid 1to0 execution amount");
    });

    it("over tolerance, sell limit order is refunded all", async () => {
      let result = await calculatorInstance.calculatePrice.call(
        150,
        100,
        350,
        150,
        200000,
        100000
      );
      assert.equal(result[0].toString(), "501123595505617977", "Invalid price");
      assert.equal(result[1], 3, "invalid refund status");
      assert.equal(
        result[2].toString(),
        "1000000000000000000",
        "invalid refund rate"
      );
      assert.equal(result[3], 250, "Invalid 0to1 execution amount");
      assert.equal(result[4], 350, "Invalid 1to0 execution amount");
    });

    it("over secure rete, sell non-limit order refunded partially", async () => {
      let result = await calculatorInstance.calculatePrice.call(
        150,
        100,
        750,
        150,
        20000,
        10000
      );
      assert.equal(result[0].toString(), "525000000000000000", "Invalid price");
      assert.equal(result[1], 4, "invalid refund status");
      assert.equal(
        result[2].toString(),
        "158666666666666666",
        "invalid refund rate"
      );
      assert.equal(result[3], 250, "Invalid 0to1 execution amount");
      assert.equal(result[4], 631, "Invalid 1to0 execution amount");
    });

    it("over secure rete, buy non-limit order refunded partially", async () => {
      let result = await calculatorInstance.calculatePrice.call(
        1800,
        400,
        100,
        150,
        20000,
        10000
      );
      assert.equal(result[0].toString(), "476190476190476190", "Invalid price");
      assert.equal(result[1], 2, "invalid refund status");
      assert.equal(
        result[2].toString(),
        "152777777777777777",
        "invalid refund rate"
      );
      assert.equal(result[3], 1525, "Invalid 0to1 execution amount");
      assert.equal(result[4], 250, "Invalid 1to0 execution amount");
    });

    it("buy limit order refunded totally2", async () => {
      let result = await calculatorInstance.calculatePrice.call(
        1500,
        400,
        100,
        150,
        20000,
        10000
      );
      assert.equal(result[0].toString(), "476744186046511627", "Invalid price");
      assert.equal(result[1], 1, "invalid refund status");
      assert.equal(
        result[2].toString(),
        "1000000000000000000",
        "invalid refund rate"
      );
      assert.equal(result[3], 1500, "Invalid 0to1 execution amount");
      assert.equal(result[4], 250, "Invalid 1to0 execution amount");
    });

    it("sell limit order refunded totally2", async () => {
      let result = await calculatorInstance.calculatePrice.call(
        150,
        100,
        500,
        150,
        20000,
        10000
      );
      assert.equal(result[0].toString(), "518518518518518518", "Invalid price");
      assert.equal(result[1], 3, "invalid refund status");
      assert.equal(
        result[2].toString(),
        "1000000000000000000",
        "invalid refund rate"
      );
      assert.equal(result[3], 250, "Invalid 0to1 execution amount");
      assert.equal(result[4], 500, "Invalid 1to0 execution amount");
    });

    it("should revert if reserve0 is 0", async () => {
      await expectRevert.unspecified(
        calculatorInstance.calculatePrice.call(150, 100, 500, 150, 0, 10000)
      );
    });

    it("should revert if reserve1 is 0", async () => {
      await expectRevert.unspecified(
        calculatorInstance.calculatePrice.call(150, 100, 500, 150, 10000, 0)
      );
    });

    it("when immortal options are less volatile", async () => {
      await oracle.changeData(
        (250 * 10 ** 8).toFixed(),
        (1 * 10 ** 8).toFixed()
      );
      const currentNumber = await web3.eth.getBlockNumber();
      const block = await web3.eth.getBlock(currentNumber);
      let result = await spreadCalculatorInstance.calculateCurrentSpread.call(
        block.timestamp + 300000,
        strikePrice,
        oracle.address
      );
      assert.equal(
        result,
        3000000000000000,
        "Spread rate must be default value"
      );
    });
    it("when immortal options are a little volatile", async () => {
      await oracle.changeData(
        (239 * 10 ** 8).toFixed(),
        (1 * 10 ** 8).toFixed()
      );
      const currentNumber = await web3.eth.getBlockNumber();
      const block = await web3.eth.getBlock(currentNumber);
      let result = await spreadCalculatorInstance.calculateCurrentSpread.call(
        block.timestamp + 10000,
        strikePrice,
        oracle.address
      );
      assert.equal(
        result,
        3000000000000000,
        "Spread rate must be default value"
      );
    });

    it("when immortal options are middle volatile", async () => {
      await oracle.changeData(
        (200 * 10 ** 8).toFixed(),
        (1 * 10 ** 8).toFixed()
      );
      const currentNumber = await web3.eth.getBlockNumber();
      const block = await web3.eth.getBlock(currentNumber);
      let result = await spreadCalculatorInstance.calculateCurrentSpread.call(
        block.timestamp + 10000,
        strikePrice,
        oracle.address
      );
      assert.equal(
        result,
        4816866704493217,
        "Spread rate must be approxiamately 0.48%"
      );
    });
  });

  describe("Calculator with volatile oracle", function () {
    let spreadCalculatorInstance;
    const strikePrice = web3.utils.toBN(100e18).toString();
    let oracle;
    before(async () => {
      spreadCalculatorInstance = await SpreadCalculator.new();
      oracle = await Oracle.new();
      await oracle.changeData(
        (100 * 10 ** 8).toFixed(),
        (1 * 10 ** 8).toFixed()
      );
    });
    it("when immortal options are volatile", async () => {
      const currentNumber = await web3.eth.getBlockNumber();
      const block = await web3.eth.getBlock(currentNumber);
      let result = await spreadCalculatorInstance.calculateCurrentSpread.call(
        block.timestamp + 300000,
        strikePrice,
        oracle.address
      );
      assert.equal(
        result,
        16479139919633868,
        "Spread rate must be approxiamately 1.6%"
      );
    });
  });

  describe("Calculator with highly volatile oracle", function () {
    const strikePrice = web3.utils.toBN(100e18).toString();
    let calculatorInstance;
    let oracle;
    before(async () => {
      calculatorInstance = await SpreadCalculator.new();
      oracle = await Oracle.new();
      await oracle.changeData(
        (50 * 10 ** 8).toFixed(),
        (1 * 10 ** 8).toFixed()
      );
    });
    it("when immortal options are less volatile", async () => {
      const currentNumber = await web3.eth.getBlockNumber();
      const block = await web3.eth.getBlock(currentNumber);
      let result = await calculatorInstance.calculateCurrentSpread.call(
        block.timestamp + 300000,
        strikePrice,
        oracle.address
      );
      assert.equal(
        result,
        127199680192586300,
        "Spread rate must be approxiamately 12.7%"
      );
    });
  });

  describe("Calculate spread Rate For ETH", function () {
    let spreadCalculatorInstance;
    let oracle;
    before(async () => {
      oracle = await Oracle.new();
      spreadCalculatorInstance = await SpreadCalculator.new();
    });

    it("return default value if oracle is ZERO address", async () => {
      const currentNumber = await web3.eth.getBlockNumber();
      const block = await web3.eth.getBlock(currentNumber);
      let result = await spreadCalculatorInstance.calculateCurrentSpread.call(
        block.timestamp + 300000,
        100,
        ZAddress
      );
      assert.equal(
        result,
        3000000000000000,
        "Spread rate must be default value"
      );
    });

    it("when ETH are less volatile", async () => {
      const currentNumber = await web3.eth.getBlockNumber();
      let result = await spreadCalculatorInstance.calculateSpreadByAssetVolatility.call(
        oracle.address
      );
      assert.equal(result, 3000000000000000, "Spread rate must be 0.3%");
    });

    it("when ETH are highly volatile", async () => {
      const currentNumber = await web3.eth.getBlockNumber();
      await oracle.changeData(
        (100 * 10 ** 8).toFixed(),
        (3 * 10 ** 8).toFixed()
      );
      let result = await spreadCalculatorInstance.calculateSpreadByAssetVolatility.call(
        oracle.address
      );
      assert.equal(result, 4500000000000000, "Spread rate must be 0.45%");
    });

    it("return default value if oracle is ZERO address when ETH are highly volatile", async () => {
      await oracle.changeData(
        (100 * 10 ** 8).toFixed(),
        (3 * 10 ** 8).toFixed()
      );
      const currentNumber = await web3.eth.getBlockNumber();
      const block = await web3.eth.getBlock(currentNumber);
      let result = await spreadCalculatorInstance.calculateCurrentSpread.call(
        block.timestamp + 300000,
        100,
        ZAddress
      );
      assert.equal(
        result,
        3000000000000000,
        "Spread rate must be default value"
      );
    });

    it("when ETH are extremely volatile", async () => {
      const currentNumber = await web3.eth.getBlockNumber();
      await oracle.changeData(
        (100 * 10 ** 8).toFixed(),
        (110 * 10 ** 8).toFixed()
      );
      let result = await spreadCalculatorInstance.calculateSpreadByAssetVolatility.call(
        oracle.address
      );
      assert.equal(result, 150000000000000000, "Spread rate must be 15%");
    });

    it("return default value if oracle is ZERO address, when ETH are extremely volatile", async () => {
      const currentNumber = await web3.eth.getBlockNumber();
      await oracle.changeData(
        (100 * 10 ** 8).toFixed(),
        (110 * 10 ** 8).toFixed()
      );
      const block = await web3.eth.getBlock(currentNumber);
      let result = await spreadCalculatorInstance.calculateCurrentSpread.call(
        block.timestamp + 300000,
        100,
        ZAddress
      );
      assert.equal(
        result,
        3000000000000000,
        "Spread rate must be default value"
      );
    });

    it("return default value if ETH price is irrational", async () => {
      const currentNumber = await web3.eth.getBlockNumber();
      await oracle.changeData(
        "1000000000000000000000000",
        (100 * 10 ** 8).toFixed()
      );
      const block = await web3.eth.getBlock(currentNumber);
      let result = await spreadCalculatorInstance.calculateCurrentSpread.call(
        block.timestamp + 300000,
        100,
        ZAddress
      );
      assert.equal(
        result,
        3000000000000000,
        "Spread rate must be default value"
      );
    });

    it("return default value if ETH volatility is irrational", async () => {
      const currentNumber = await web3.eth.getBlockNumber();
      await oracle.changeData(
        (110 * 10 ** 8).toFixed(),
        "1000000000000000000000000"
      );
      const block = await web3.eth.getBlock(currentNumber);
      let result = await spreadCalculatorInstance.calculateCurrentSpread.call(
        block.timestamp + 300000,
        100,
        ZAddress
      );
      assert.equal(
        result,
        3000000000000000,
        "Spread rate must be default value"
      );
    });
  });
});
