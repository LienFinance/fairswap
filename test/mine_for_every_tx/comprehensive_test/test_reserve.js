const Calculator = artifacts.require("PriceCalculator");
const BoxExchangeMock = artifacts.require("BoxExchangeMock");
const TestERC20 = artifacts.require("TestERC20");
const {expectEvent, expectRevert, BN} = require("@openzeppelin/test-helpers");

contract("BoxExchangeMock", function (accounts) {
  const factory = accounts[0];
  const buyer1 = accounts[1];
  const buyer2 = accounts[2];
  const seller1 = accounts[3];
  const seller2 = accounts[4];
  const marketFeeTaker = accounts[9];
  const spreadRate = "0"; //30%
  const initialReserve0 = 1000000;
  const initialReserve1 = 2000000;
  const reserveAll = 2000000000000;
  const tokenAmount = 2000000;
  const ZeroAddress = "0x0000000000000000000000000000000000000000";

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
    await boxExchange.init(initialReserve0, initialReserve1, initialShare);
    await token0.transfer(buyer1, tokenAmount);
    await token0.transfer(buyer2, tokenAmount);
    await token1.transfer(seller1, tokenAmount);
    await token1.transfer(seller2, tokenAmount);
    await token0.approve(boxExchange.address, tokenAmount, {from: buyer1});
    await token0.approve(boxExchange.address, tokenAmount, {from: buyer2});
    await token1.approve(boxExchange.address, tokenAmount, {from: seller1});
    await token1.approve(boxExchange.address, tokenAmount, {from: seller2});
  });
  describe("`reserve0 * reserve1` is always equal when no spread", () => {
    const testCases = [
      {
        title: "execute 4 orders in 1 times #1",
        boxes: [
          [
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "execute 3 orders in 1 times #1",
        boxes: [
          [
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "execute 3 orders in 1 times #1",
        boxes: [
          [
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "execute 3 orders in 1 times #1",
        boxes: [
          [
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "execute 3 orders in 1 times #1",
        boxes: [
          [
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "execute 2 orders in 1 times #1",
        boxes: [
          [
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "execute 2 orders in 1 times #2",
        boxes: [
          [
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "execute 2 orders in 1 times #3",
        boxes: [
          [
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "execute 2 orders in 1 times #4",
        boxes: [
          [
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "execute 2 orders in 1 times #5",
        boxes: [
          [
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "execute 2 orders in 1 times #6",
        boxes: [
          [
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "execute only FLEX_0_1",
        boxes: [
          [
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "execute only STRICT_0_1",
        boxes: [
          [
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "execute only FLEX_1_0",
        boxes: [
          [
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "execute only STRICT_1_0",
        boxes: [
          [
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "execute only FLEX_0_1, refund occurs",
        boxes: [
          [
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 1000000,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "execute only STRICT_0_1, refund occurs",
        boxes: [
          [
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 1000000,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "execute only FLEX_1_, refund occurs0",
        boxes: [
          [
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 1000000,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "execute only STRICT_1_0, refund occurs",
        boxes: [
          [
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 1000000,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "execute 4 orders and 1 order #1",
        boxes: [
          [
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
          [
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [0, 4],
      },
      {
        title: "execute 4 orders and 1 order #2",
        boxes: [
          [
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
          [
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [0, 4],
      },
      {
        title: "execute 4 orders and 1 order #3",
        boxes: [
          [
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
          [
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [0, 4],
      },
      {
        title:
          "execute 4 orders and 1 order, second box doesn't execute any order",
        boxes: [
          [
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
          [
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4, 1],
      },
      {
        title: "first box has 8 orders #1",
        boxes: [
          [
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer2,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer1,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller1,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
          [
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [0, 2],
      },
      {
        title: "first box has 8 orders #2",
        boxes: [
          [
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer2,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer1,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller1,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
          [
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [8, 1],
      },
      {
        title: "first box has 8 orders #3, refund STRICT0_1",
        boxes: [
          [
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100000,
              recipient: ZeroAddress,
            },
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
          [
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [0, 2],
      },
      {
        title: "first box has 8 orders #3, refund STRICT1_0",
        boxes: [
          [
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100000,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
          [
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [0, 2],
      },
      {
        title: "first box has 8 orders #3, refund FLEX0_1",
        boxes: [
          [
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 1000000,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
          [
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [0, 2],
      },
      {
        title: "first box has 8 orders #3, refund FLEX1_0",
        boxes: [
          [
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer1,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: buyer2,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 1000000,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
          [
            {
              orderer: seller1,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
            {
              orderer: seller2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 100,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [0, 2],
      },
    ];

    for (let i = 0; i < testCases.length; i++) {
      it(testCases[i].title, async () => {
        for (let j = 0; j < testCases[i].boxes.length; j++) {
          let orders = testCases[i].boxes[j];
          for (let k = 0; k < orders.length; k++) {
            await boxExchange.addOrder(
              orders[k].type,
              orders[k].amount,
              ZeroAddress,
              {from: orders[k].orderer}
            );
          }
          await boxExchange.expireBox();
          await boxExchange.executeOrders(testCases[i].numOfExecute[j]);
        }
        const reserves = await boxExchange.getReserves();
        const _reservesAll =
          reserves._reserve0.toNumber() * reserves._reserve1.toNumber();
        assert(
          reserveAll - 10 < _reservesAll || _reservesAll < reserveAll + 10,
          "mul of reserves are incorrect"
        );
      });
    }
  });
});
