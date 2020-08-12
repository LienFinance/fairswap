const Calculator = artifacts.require("PriceCalculator");
const BoxExchangeMock = artifacts.require("BoxExchangeMock");
const TestERC20 = artifacts.require("TestERC20");
const {expectRevert} = require("@openzeppelin/test-helpers");

contract("BoxExchangeMock", function (accounts) {
  const factory = accounts[0];
  const marketFeeTaker = accounts[9];
  const spreadRate = "0";
  const initialReserve0 = 10000;
  const initialReserve1 = 20000;
  const ORDER_TYPE = {
    FLEX_0_1: 0,
    FLEX_1_0: 1,
    STRICT_0_1: 2,
    STRICT_1_0: 3,
  };
  var boxExchange;
  var token0;
  var token1;
  var initialShare;
  const lp = accounts[0];
  const buyer1 = accounts[1];
  const buyer2 = accounts[2];
  const seller1 = accounts[3];
  const seller2 = accounts[4];
  const ZeroAddress = "0x0000000000000000000000000000000000000000";
  beforeEach(async () => {
    token0 = await TestERC20.new(factory, 10000000000);
    token1 = await TestERC20.new(factory, 10000000000);
    calculator = await Calculator.new();
    boxExchange = await BoxExchangeMock.new(
      token0.address,
      token1.address,
      calculator.address,
      spreadRate,
      marketFeeTaker
    );
    initialShare = 1000;
    await token0.transfer(buyer1, 100000, {from: lp});
    await token0.transfer(buyer2, 100000, {from: lp});
    await token1.transfer(seller1, 100000, {from: lp});
    await token1.transfer(seller2, 100000, {from: lp});

    await token0.approve(boxExchange.address, 1000000, {
      from: lp,
    });
    await token1.approve(boxExchange.address, 1000000, {
      from: lp,
    });
    await token0.approve(boxExchange.address, 100000, {
      from: buyer1,
    });
    await token0.approve(boxExchange.address, 100000, {
      from: buyer2,
    });
    await token1.approve(boxExchange.address, 100000, {
      from: seller1,
    });
    await token1.approve(boxExchange.address, 100000, {
      from: seller2,
    });
    await boxExchange.init(initialReserve0, initialReserve1, 1000);
  });
  const testCases = [
    {
      title: "add multiple orders starting with FLEX_0_1",
      input: {
        order1: [buyer1, ORDER_TYPE.FLEX_0_1, 10000, ZeroAddress],
        order2: [buyer2, ORDER_TYPE.STRICT_0_1, 15000, ZeroAddress],
        order3: [seller1, ORDER_TYPE.FLEX_1_0, 20000, ZeroAddress],
        order4: [seller2, ORDER_TYPE.STRICT_1_0, 25000, ZeroAddress],
      },
      output: {
        sum1: 10000,
        sum2: 15000,
        sum3: 20000,
        sum4: 25000,
        amount1: 10000,
        amount2: 15000,
        amount3: 20000,
        amount4: 25000,
      },
    },
  ];
  for (let i = 0; i < testCases.length; i++) {
    it(testCases[i].title, async () => {
      await boxExchange.addOrder(
        testCases[i].input.order1[1],
        testCases[i].input.order1[2],
        testCases[i].input.order1[3],
        {from: testCases[i].input.order1[0]}
      );
      const process = [
        boxExchange.addOrder(
          testCases[i].input.order2[1],
          testCases[i].input.order2[2],
          testCases[i].input.order2[3],
          {from: testCases[i].input.order2[0]}
        ),
        boxExchange.addOrder(
          testCases[i].input.order3[1],
          testCases[i].input.order3[2],
          testCases[i].input.order3[3],
          {from: testCases[i].input.order3[0]}
        ),
        boxExchange.addOrder(
          testCases[i].input.order4[1],
          testCases[i].input.order4[2],
          testCases[i].input.order4[3],
          {from: testCases[i].input.order4[0]}
        ),
      ];
      await Promise.all(process);
      let exchangeData = await boxExchange.getBoxSummary.call(0);
      assert.equal(
        exchangeData[1],
        testCases[i].output.sum1,
        "invalid sum of FLEX_0_1"
      );
      assert.equal(
        exchangeData[2],
        testCases[i].output.sum2,
        "invalid sum of STRICT_0_1"
      );
      assert.equal(
        exchangeData[3],
        testCases[i].output.sum3,
        "invalid sum of FLEX_1_0"
      );
      assert.equal(
        exchangeData[4],
        testCases[i].output.sum4,
        "invalid sum of STRICT_0_1"
      );

      let amount = await boxExchange.getOrderAmount.call(
        testCases[i].input.order1[0],
        testCases[i].input.order1[1]
      );
      assert.equal(
        amount,
        testCases[i].output.amount1,
        "invalid amount about " + testCases[i].input.order1[0]
      );
      amount = await boxExchange.getOrderAmount.call(
        testCases[i].input.order2[0],
        testCases[i].input.order2[1]
      );
      assert.equal(
        amount,
        testCases[i].output.amount2,
        "invalid amount about " + testCases[i].input.order2[0]
      );
      amount = await boxExchange.getOrderAmount.call(
        testCases[i].input.order3[0],
        testCases[i].input.order3[1]
      );
      assert.equal(
        amount,
        testCases[i].output.amount3,
        "invalid amount about " + testCases[i].input.order3[0]
      );
      amount = await boxExchange.getOrderAmount.call(
        testCases[i].input.order4[0],
        testCases[i].input.order4[1]
      );
      assert.equal(
        amount,
        testCases[i].output.amount4,
        "invalid amount about " + testCases[i].input.order4[0]
      );
    });
  }
});
