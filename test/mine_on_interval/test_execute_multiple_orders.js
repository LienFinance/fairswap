const Calculator = artifacts.require("PriceCalculator");
const BoxExchangeMock = artifacts.require("TestBoxExchange");
const TestERC20 = artifacts.require("TestERC20");
const {
  expectRevert,
  time, // Assertions for transactions that should fail
} = require("@openzeppelin/test-helpers");

contract("testBoxExchange", function (accounts) {
  const factory = accounts[0];
  const marketFeeTaker = accounts[9];
  const spreadRate = "0";
  const initialReserve0 = 2000000000000;
  const initialReserve1 = 2000000000000;
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

  function getToken(index) {
    if (index == 0) {
      return token0;
    } else {
      return token1;
    }
  }
  async function execution(times, numOfExecute) {
    for (let k = 0; k < times; k++) {
      await boxExchange.executeOrders(numOfExecute[k]);
      //testCases[i].input.numOfExecute[k], {from: accounts[0]})
    }
  }

  beforeEach(async () => {
    token0 = await TestERC20.new(factory, 10000000000000);
    token1 = await TestERC20.new(factory, 10000000000000);
    calculator = await Calculator.new();
    boxExchange = await BoxExchangeMock.new(
      token0.address,
      token1.address,
      calculator.address,
      spreadRate,
      marketFeeTaker
    );
    initialShare = (await boxExchange.INITIAL_SHARE()).toNumber();
    await token0.transfer(buyer1, 100000, {from: lp});
    await token0.transfer(buyer2, 100000, {from: lp});
    await token1.transfer(seller1, 100000, {from: lp});
    await token1.transfer(seller2, 100000, {from: lp});

    await token0.approve(boxExchange.address, 2000000000000, {
      from: lp,
    });
    await token1.approve(boxExchange.address, 2000000000000, {
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
      title: "execute 6 orders with 2 times #1",
      input: {
        orders: [
          {
            orderer: buyer1,
            type: ORDER_TYPE.FLEX_0_1,
            amount: 10,
            recipient: ZeroAddress,
          },
          {
            orderer: buyer2,
            type: ORDER_TYPE.FLEX_0_1,
            amount: 10,
            recipient: ZeroAddress,
          },
          {
            orderer: seller1,
            type: ORDER_TYPE.FLEX_1_0,
            amount: 10,
            recipient: ZeroAddress,
          },
          {
            orderer: seller2,
            type: ORDER_TYPE.FLEX_1_0,
            amount: 10,
            recipient: ZeroAddress,
          },
          {
            orderer: buyer2,
            type: ORDER_TYPE.STRICT_0_1,
            amount: 10,
            recipient: ZeroAddress,
          },
          {
            orderer: seller1,
            type: ORDER_TYPE.STRICT_1_0,
            amount: 10000,
            recipient: ZeroAddress,
          },
        ],
        numOfExecute: [5, 5],
      },
      output: {
        targetAccounts: [
          {
            target: seller1,
            isLarger: true,
            token: 0,
          },
        ],
        threshhold: 1000,
      },
    },
    {
      title: "execute 5 orders with 1 times, STRICT_0_1 will be executed #2",
      input: {
        orders: [
          {
            orderer: buyer1,
            type: ORDER_TYPE.FLEX_0_1,
            amount: 10,
            recipient: ZeroAddress,
          },
          {
            orderer: buyer2,
            type: ORDER_TYPE.FLEX_0_1,
            amount: 10,
            recipient: ZeroAddress,
          },
          {
            orderer: seller1,
            type: ORDER_TYPE.FLEX_1_0,
            amount: 10,
            recipient: ZeroAddress,
          },
          {
            orderer: seller2,
            type: ORDER_TYPE.FLEX_1_0,
            amount: 10,
            recipient: ZeroAddress,
          },
          {
            orderer: seller1,
            type: ORDER_TYPE.STRICT_1_0,
            amount: 10000,
            recipient: ZeroAddress,
          },
          {
            orderer: buyer2,
            type: ORDER_TYPE.STRICT_0_1,
            amount: 10000,
            recipient: ZeroAddress,
          },
        ],
        numOfExecute: [5],
      },
      output: {
        targetAccounts: [
          {
            target: seller1,
            isLarger: false,
            token: 0,
          },
        ],
        threshhold: 1000,
      },
    },
    {
      title: "execute 6 orders with 1 times, STRICT_1_0 won't be executed #2",
      input: {
        orders: [
          {
            orderer: buyer1,
            type: ORDER_TYPE.FLEX_0_1,
            amount: 10,
            recipient: ZeroAddress,
          },
          {
            orderer: buyer2,
            type: ORDER_TYPE.FLEX_0_1,
            amount: 10,
            recipient: ZeroAddress,
          },
          {
            orderer: seller1,
            type: ORDER_TYPE.FLEX_1_0,
            amount: 10,
            recipient: ZeroAddress,
          },
          {
            orderer: seller2,
            type: ORDER_TYPE.FLEX_1_0,
            amount: 10,
            recipient: ZeroAddress,
          },
          {
            orderer: buyer2,
            type: ORDER_TYPE.STRICT_0_1,
            amount: 10000,
            recipient: ZeroAddress,
          },
          {
            orderer: seller1,
            type: ORDER_TYPE.STRICT_1_0,
            amount: 10000,
            recipient: ZeroAddress,
          },
        ],
        numOfExecute: [5],
      },
      output: {
        targetAccounts: [
          {
            target: buyer2,
            isLarger: true,
            token: 0,
          },
        ],
        threshhold: 1000,
      },
    },
    {
      title: "execute 3 orders with 1 times #3",
      input: {
        orders: [
          {
            orderer: buyer1,
            type: ORDER_TYPE.FLEX_0_1,
            amount: 10000,
            recipient: ZeroAddress,
          },
          {
            orderer: buyer2,
            type: ORDER_TYPE.FLEX_0_1,
            amount: 10000,
            recipient: ZeroAddress,
          },
          {
            orderer: seller1,
            type: ORDER_TYPE.FLEX_1_0,
            amount: 10000,
            recipient: ZeroAddress,
          },
          {
            orderer: seller2,
            type: ORDER_TYPE.FLEX_1_0,
            amount: 10000,
            recipient: ZeroAddress,
          },
          {
            orderer: buyer2,
            type: ORDER_TYPE.STRICT_0_1,
            amount: 10000,
            recipient: ZeroAddress,
          },
          {
            orderer: seller1,
            type: ORDER_TYPE.STRICT_1_0,
            amount: 10000,
            recipient: ZeroAddress,
          },
        ],
        numOfExecute: [3],
      },
      output: {
        targetAccounts: [
          {
            target: seller2,
            isLarger: false,
            token: 0,
          },
        ],
        threshhold: 1000,
      },
    },
  ];
  for (let i = 0; i < testCases.length; i++) {
    it(testCases[i].title, async () => {
      let process = [];
      for (let j = 0; j < testCases[i].input.orders.length; j++) {
        process.push(
          boxExchange.addOrder(
            testCases[i].input.orders[j].type,
            testCases[i].input.orders[j].amount,
            testCases[i].input.orders[j].recipient,
            {from: testCases[i].input.orders[j].orderer}
          )
        );
      }
      await Promise.all(process);
      await time.advanceBlock();
      await time.advanceBlock();
      await execution(
        testCases[i].input.numOfExecute.length,
        testCases[i].input.numOfExecute
      );

      for (let l = 0; l < testCases[i].output.targetAccounts.length; l++) {
        let token = getToken(testCases[i].output.targetAccounts[l].token);
        let balance = await token.balanceOf.call(
          testCases[i].output.targetAccounts[l].target
        );
        assert.equal(
          testCases[i].output.threshhold < balance,
          testCases[i].output.targetAccounts[l].isLarger,
          "Invalid num of execution of " + l + " order"
        );
      }
    });
  }
});
