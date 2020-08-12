const Calculator = artifacts.require("PriceCalculator");
const BoxExchangeMock = artifacts.require("BoxExchangeMock");
const TestERC20 = artifacts.require("TestERC20");
const {expectEvent, expectRevert, BN} = require("@openzeppelin/test-helpers");
const ZAddress = "0x0000000000000000000000000000000000000000";
contract("BoxExchangeMock", function (accounts) {
  const [
    factory,
    buyer1,
    buyer2,
    buyer3,
    buyer4,
    seller1,
    seller2,
    seller3,
    seller4,
  ] = accounts;
  const marketFeeTaker = accounts[9];
  const spreadRate = "300000000000000000"; //30%
  const initialReserve0 = 1000000;
  const initialReserve1 = 2000000;
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
  const inAmount = 5000;
  const inAmountS = 500;
  async function execution(orderInfo) {
    for (let k = 0; k < orderInfo.orderInBox.length; k++) {
      await boxExchange.addOrder(
        orderInfo.orderInBox[k].type,
        10000,
        ZAddress,
        {from: orderInfo.orderInBox[k].orderer}
      );
      //testCases[i].input.numOfExecute[k], {from: accounts[0]})
    }
    await boxExchange.expireBox();
    await boxExchange.executeOrders(orderInfo.numOfOrder);
  }
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
    await token0.approve(boxExchange.address, initialReserve0);
    await token1.approve(boxExchange.address, initialReserve1);
    await token0.transfer(buyer1, 100000);
    await token0.transfer(buyer2, 100000);
    await token0.transfer(buyer3, 100000);
    await token0.transfer(buyer4, 100000);
    await token0.approve(boxExchange.address, 100000, {from: buyer1});
    await token0.approve(boxExchange.address, 100000, {from: buyer2});
    await token0.approve(boxExchange.address, 100000, {from: buyer3});
    await token0.approve(boxExchange.address, 100000, {from: buyer4});
    await token1.transfer(seller1, 100000);
    await token1.transfer(seller2, 100000);
    await token1.transfer(seller3, 100000);
    await token1.transfer(seller4, 100000);
    await token1.approve(boxExchange.address, 100000, {from: seller1});
    await token1.approve(boxExchange.address, 100000, {from: seller2});
    await token1.approve(boxExchange.address, 100000, {from: seller3});
    await token1.approve(boxExchange.address, 100000, {from: seller4});
    await boxExchange.init(initialReserve0, initialReserve1, initialShare);
  });

  const testCases = [
    {
      title: "target unexecuted order is in the same box, execute 1 orders",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer3,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
            ],
            numOfOrder: 1,
          },
        ],
      },
      targetOrder: {
        boxNumber: 0,
        orderer: buyer1,
        isBuy: true,
        isLimit: true,
      },
      output: {
        isExecuted: false,
        boxCount: 1,
        indexCount: 5,
      },
    },
    {
      title: "target unexecuted order is in the same box, execute 2 orders",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer3,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
            ],
            numOfOrder: 2,
          },
        ],
      },
      targetOrder: {
        boxNumber: 0,
        orderer: buyer1,
        isBuy: true,
        isLimit: true,
      },
      output: {
        isExecuted: false,
        boxCount: 1,
        indexCount: 4,
      },
    },
    {
      title: "target unexecuted order is in the same box, execute 3 orders",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer3,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
            ],
            numOfOrder: 3,
          },
        ],
      },
      targetOrder: {
        boxNumber: 0,
        orderer: buyer1,
        isBuy: true,
        isLimit: true,
      },
      output: {
        isExecuted: false,
        boxCount: 1,
        indexCount: 3,
      },
    },
    {
      title: "target unexecuted order is in the same box, execute 4 orders",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer3,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
            ],
            numOfOrder: 4,
          },
        ],
      },
      targetOrder: {
        boxNumber: 0,
        orderer: buyer1,
        isBuy: true,
        isLimit: true,
      },
      output: {
        isExecuted: false,
        boxCount: 1,
        indexCount: 2,
      },
    },
    {
      title: "target unexecuted order is in the same box, execute 5 orders",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer3,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
            ],
            numOfOrder: 5,
          },
        ],
      },
      targetOrder: {
        boxNumber: 0,
        orderer: buyer1,
        isBuy: true,
        isLimit: true,
      },
      output: {
        isExecuted: false,
        boxCount: 1,
        indexCount: 1,
      },
    },
    {
      title: "target unexecuted order is in the same box, execute 1 orders",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer3,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
            ],
            numOfOrder: 6,
          },
        ],
      },
      targetOrder: {
        boxNumber: 0,
        orderer: buyer1,
        isBuy: true,
        isLimit: true,
      },
      output: {
        isExecuted: true,
        boxCount: 0,
        indexCount: 0,
      },
    },
    {
      title: "execute all FLEX_0_1 in box 0 #1",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: seller2,
                type: ORDER_TYPE.STRICT_1_0,
              },
            ],
            numOfOrder: 2,
          },
        ],
      },
      targetOrder: {
        boxNumber: 0,
        orderer: buyer2,
        isBuy: true,
        isLimit: false,
      },
      output: {
        isExecuted: true,
        boxCount: 0,
        indexCount: 0,
      },
    },
    {
      title: "execute all FLEX_0_1 in box 0 #2",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: seller2,
                type: ORDER_TYPE.STRICT_1_0,
              },
            ],
            numOfOrder: 2,
          },
        ],
      },
      targetOrder: {
        boxNumber: 0,
        orderer: seller1,
        isBuy: false,
        isLimit: false,
      },
      output: {
        isExecuted: false,
        boxCount: 1,
        indexCount: 1,
      },
    },
    {
      title: "execute all FLEX_0_1 in box 0 #3",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: seller2,
                type: ORDER_TYPE.STRICT_1_0,
              },
            ],
            numOfOrder: 2,
          },
        ],
      },
      targetOrder: {
        boxNumber: 0,
        orderer: buyer1,
        isBuy: true,
        isLimit: true,
      },
      output: {
        isExecuted: false,
        boxCount: 1,
        indexCount: 2,
      },
    },
    {
      title: "execute all FLEX_0_1 in box 0 #4",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: seller2,
                type: ORDER_TYPE.STRICT_1_0,
              },
            ],
            numOfOrder: 2,
          },
        ],
      },
      targetOrder: {
        boxNumber: 0,
        orderer: seller1,
        isBuy: false,
        isLimit: true,
      },
      output: {
        isExecuted: false,
        boxCount: 1,
        indexCount: 3,
      },
    },
    {
      title: "execute all FLEX_1_0 in box 0 #1",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: seller2,
                type: ORDER_TYPE.STRICT_1_0,
              },
            ],
            numOfOrder: 3,
          },
        ],
      },
      targetOrder: {
        boxNumber: 0,
        orderer: buyer2,
        isBuy: true,
        isLimit: false,
      },
      output: {
        isExecuted: true,
        boxCount: 0,
        indexCount: 0,
      },
    },
    {
      title: "execute all FLEX_1_0 in box 0 #2",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: seller2,
                type: ORDER_TYPE.STRICT_1_0,
              },
            ],
            numOfOrder: 3,
          },
        ],
      },
      targetOrder: {
        boxNumber: 0,
        orderer: seller1,
        isBuy: false,
        isLimit: false,
      },
      output: {
        isExecuted: true,
        boxCount: 0,
        indexCount: 0,
      },
    },
    {
      title: "execute all FLEX_1_0 in box 0 #3",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: seller2,
                type: ORDER_TYPE.STRICT_1_0,
              },
            ],
            numOfOrder: 3,
          },
        ],
      },
      targetOrder: {
        boxNumber: 0,
        orderer: buyer1,
        isBuy: true,
        isLimit: true,
      },
      output: {
        isExecuted: false,
        boxCount: 1,
        indexCount: 1,
      },
    },
    {
      title: "execute all FLEX_1_0 in box 0 #4",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: seller2,
                type: ORDER_TYPE.STRICT_1_0,
              },
            ],
            numOfOrder: 3,
          },
        ],
      },
      targetOrder: {
        boxNumber: 0,
        orderer: seller1,
        isBuy: false,
        isLimit: true,
      },
      output: {
        isExecuted: false,
        boxCount: 1,
        indexCount: 2,
      },
    },
    {
      title: "execute all STRICT_0_1 in box 0 #1",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: seller2,
                type: ORDER_TYPE.STRICT_1_0,
              },
            ],
            numOfOrder: 4,
          },
        ],
      },
      targetOrder: {
        boxNumber: 0,
        orderer: buyer2,
        isBuy: true,
        isLimit: false,
      },
      output: {
        isExecuted: true,
        boxCount: 0,
        indexCount: 0,
      },
    },
    {
      title: "execute all STRICT_0_1 in box 0 #2",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: seller2,
                type: ORDER_TYPE.STRICT_1_0,
              },
            ],
            numOfOrder: 4,
          },
        ],
      },
      targetOrder: {
        boxNumber: 0,
        orderer: seller1,
        isBuy: false,
        isLimit: false,
      },
      output: {
        isExecuted: true,
        boxCount: 0,
        indexCount: 0,
      },
    },
    {
      title: "execute all STRICT_0_1 in box 0 #3",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: seller2,
                type: ORDER_TYPE.STRICT_1_0,
              },
            ],
            numOfOrder: 4,
          },
        ],
      },
      targetOrder: {
        boxNumber: 0,
        orderer: buyer1,
        isBuy: true,
        isLimit: true,
      },
      output: {
        isExecuted: true,
        boxCount: 0,
        indexCount: 0,
      },
    },
    {
      title: "execute all STRICT_0_1 in box 0 #4",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: seller2,
                type: ORDER_TYPE.STRICT_1_0,
              },
            ],
            numOfOrder: 4,
          },
        ],
      },
      targetOrder: {
        boxNumber: 0,
        orderer: seller1,
        isBuy: false,
        isLimit: true,
      },
      output: {
        isExecuted: false,
        boxCount: 1,
        indexCount: 1,
      },
    },
    {
      title: "execute one STRICT_1_0 in box 0 #1",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: seller2,
                type: ORDER_TYPE.STRICT_1_0,
              },
            ],
            numOfOrder: 5,
          },
        ],
      },
      targetOrder: {
        boxNumber: 0,
        orderer: buyer2,
        isBuy: true,
        isLimit: false,
      },
      output: {
        isExecuted: true,
        boxCount: 0,
        indexCount: 0,
      },
    },
    {
      title: "execute one STRICT_1_0 in box 0 #2",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: seller2,
                type: ORDER_TYPE.STRICT_1_0,
              },
            ],
            numOfOrder: 5,
          },
        ],
      },
      targetOrder: {
        boxNumber: 0,
        orderer: seller1,
        isBuy: false,
        isLimit: false,
      },
      output: {
        isExecuted: true,
        boxCount: 0,
        indexCount: 0,
      },
    },
    {
      title: "execute one STRICT_1_0 in box 0 #3",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: seller2,
                type: ORDER_TYPE.STRICT_1_0,
              },
            ],
            numOfOrder: 5,
          },
        ],
      },
      targetOrder: {
        boxNumber: 0,
        orderer: buyer1,
        isBuy: true,
        isLimit: true,
      },
      output: {
        isExecuted: true,
        boxCount: 0,
        indexCount: 0,
      },
    },
    {
      title: "execute one STRICT_1_0 in box 0 #4",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: seller2,
                type: ORDER_TYPE.STRICT_1_0,
              },
            ],
            numOfOrder: 5,
          },
        ],
      },
      targetOrder: {
        boxNumber: 0,
        orderer: seller2,
        isBuy: false,
        isLimit: true,
      },
      output: {
        isExecuted: false,
        boxCount: 1,
        indexCount: 1,
      },
    },

    {
      title:
        "current boxId is 1 and target unexecuted order is in box 2 after execute only one order",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer3,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
            ],
            numOfOrder: 1,
          },
          {
            orderInBox: [
              {
                orderer: seller2,
                type: ORDER_TYPE.FLEX_1_0,
              },
            ],
            numOfOrder: 0,
          },
        ],
      },
      targetOrder: {
        boxNumber: 1,
        orderer: seller2,
        isBuy: false,
        isLimit: false,
      },
      output: {
        isExecuted: false,
        boxCount: 1,
        indexCount: 1,
      },
    },
    {
      title:
        "current boxId is 1 and target unexecuted order is in box 2 after execute 6 orders",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer3,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
            ],
            numOfOrder: 6,
          },
          {
            orderInBox: [
              {
                orderer: seller2,
                type: ORDER_TYPE.FLEX_1_0,
              },
            ],
            numOfOrder: 0,
          },
        ],
      },
      targetOrder: {
        boxNumber: 1,
        orderer: seller2,
        isBuy: false,
        isLimit: false,
      },
      output: {
        isExecuted: false,
        boxCount: 1,
        indexCount: 1,
      },
    },
    {
      title:
        "target unexecuted order is in box 2 after execute 6 orders then addOrder",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer3,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
            ],
            numOfOrder: 6,
          },
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller2,
                type: ORDER_TYPE.FLEX_1_0,
              },
            ],
            numOfOrder: 0,
          },
        ],
      },
      targetOrder: {
        boxNumber: 1,
        orderer: seller2,
        isBuy: false,
        isLimit: false,
      },
      output: {
        isExecuted: false,
        boxCount: 1,
        indexCount: 2,
      },
    },

    {
      title: "target order is three box before the current box",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer3,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer4,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: seller2,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: seller3,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: buyer3,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: buyer4,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: seller2,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: seller3,
                type: ORDER_TYPE.STRICT_1_0,
              },
            ],
            numOfOrder: 0,
          },
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
            ],
            numOfOrder: 0,
          },
          {
            orderInBox: [
              {
                orderer: buyer4,
                type: ORDER_TYPE.STRICT_0_1,
              },
            ],
            numOfOrder: 0,
          },
        ],
      },
      targetOrder: {
        boxNumber: 2,
        orderer: buyer4,
        isBuy: true,
        isLimit: true,
      },
      output: {
        isExecuted: false,
        boxCount: 3,
        indexCount: 1,
      },
    },

    {
      title: "target order is one box before the current box",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer3,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer4,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: seller2,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: seller3,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: buyer3,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: buyer4,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: seller2,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: seller3,
                type: ORDER_TYPE.STRICT_1_0,
              },
            ],
            numOfOrder: 0,
          },
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
            ],
            numOfOrder: 0,
          },
          {
            orderInBox: [
              {
                orderer: buyer4,
                type: ORDER_TYPE.STRICT_0_1,
              },
            ],
            numOfOrder: 0,
          },
        ],
      },
      targetOrder: {
        boxNumber: 1,
        orderer: buyer1,
        isBuy: true,
        isLimit: false,
      },
      output: {
        isExecuted: false,
        boxCount: 2,
        indexCount: 1,
      },
    },
    {
      title: "target order is three box before the current box",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer3,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer4,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: seller2,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: seller3,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: seller4,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: buyer3,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: buyer4,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: seller2,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: seller3,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: seller4,
                type: ORDER_TYPE.STRICT_1_0,
              },
            ],
            numOfOrder: 0,
          },
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
            ],
            numOfOrder: 0,
          },
          {
            orderInBox: [
              {
                orderer: seller4,
                type: ORDER_TYPE.STRICT_1_0,
              },
              {
                orderer: buyer4,
                type: ORDER_TYPE.STRICT_0_1,
              },
            ],
            numOfOrder: 0,
          },
        ],
      },
      targetOrder: {
        boxNumber: 2,
        orderer: seller4,
        isBuy: false,
        isLimit: true,
      },
      output: {
        isExecuted: false,
        boxCount: 3,
        indexCount: 2,
      },
    },

    {
      title: "return (false, 0, 0) to unexisting order",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer3,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
            ],
            numOfOrder: 3,
          },
        ],
      },
      targetOrder: {
        boxNumber: 0,
        orderer: buyer1,
        isBuy: false,
        isLimit: true,
      },
      output: {
        isExecuted: false,
        boxCount: 0,
        indexCount: 0,
      },
    },
    {
      title: "return (false, 0, 0) to invalid box number",
      input: {
        orders: [
          {
            orderInBox: [
              {
                orderer: buyer1,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: buyer3,
                type: ORDER_TYPE.FLEX_0_1,
              },
              {
                orderer: seller1,
                type: ORDER_TYPE.FLEX_1_0,
              },
              {
                orderer: buyer2,
                type: ORDER_TYPE.STRICT_0_1,
              },
              {
                orderer: buyer1,
                type: ORDER_TYPE.STRICT_0_1,
              },
            ],
            numOfOrder: 6,
          },
        ],
      },
      targetOrder: {
        boxNumber: 2,
        orderer: buyer1,
        isBuy: true,
        isLimit: true,
      },
      output: {
        isExecuted: false,
        boxCount: 0,
        indexCount: 0,
      },
    },
  ];

  describe("Check whenToExecute()", function () {
    for (let i = 0; i < testCases.length; i++) {
      it(testCases[i].title, async () => {
        for (let j = 0; j < testCases[i].input.orders.length; j++) {
          await execution(testCases[i].input.orders[j]);
        }
        let result = await boxExchange.whenToExecute.call(
          testCases[i].targetOrder.orderer,
          testCases[i].targetOrder.boxNumber,
          testCases[i].targetOrder.isBuy,
          testCases[i].targetOrder.isLimit
        );
        assert(
          result[0] == testCases[i].output.isExecuted,
          "isExecuted of this order should be " + testCases[i].output.isExecuted
        );
        assert.equal(
          result[1],
          testCases[i].output.boxCount,
          "box count should be " + testCases[i].output.boxCount
        );
        assert.equal(
          result[2],
          testCases[i].output.indexCount,
          "There should be " + testCases[i].output.indexCount + " orders left"
        );
      });
    }
  });
});
