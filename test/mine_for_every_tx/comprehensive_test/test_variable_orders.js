const simulator = require("./ExchangeSimulator");
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
  const FUNC_TYPE = {
    ORDER: 0,
    ADD: 1,
    REMOVE: 2,
  };
  const TOKEN_TYPE = {
    TOKEN0: 0,
    TOKEN1: 1,
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
    await token1.transfer(buyer1, tokenAmount);
    await token1.transfer(buyer2, tokenAmount);
    await token0.transfer(seller1, tokenAmount);
    await token0.transfer(seller2, tokenAmount);
    await token1.transfer(seller1, tokenAmount);
    await token1.transfer(seller2, tokenAmount);
    await token0.approve(boxExchange.address, tokenAmount, {from: buyer1});
    await token0.approve(boxExchange.address, tokenAmount, {from: buyer2});
    await token1.approve(boxExchange.address, tokenAmount, {from: buyer1});
    await token1.approve(boxExchange.address, tokenAmount, {from: buyer2});
    await token1.approve(boxExchange.address, tokenAmount, {from: seller1});
    await token1.approve(boxExchange.address, tokenAmount, {from: seller2});
    await token0.approve(boxExchange.address, tokenAmount, {from: seller1});
    await token0.approve(boxExchange.address, tokenAmount, {from: seller2});
  });
  describe("test various orders", () => {
    let data;
    const orderers = [buyer1, buyer2, seller1, seller2];
    let shares = [0, 0, 0, 0];
    let totalShare = 1000;
    let amounts = [
      [tokenAmount, 0],
      [tokenAmount, 0],
      [0, tokenAmount],
      [0, tokenAmount],
    ];
    let reserves = [initialReserve0, initialReserve1];
    let orderInfo = {
      total: [0, 0, 0, 0],
      each: [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    };
    const testCases = [
      {
        title: "FLEX_0_1",
        boxes: [
          [
            {
              funcType: FUNC_TYPE.ORDER,
              orderer: 0,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 10,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "STRICT_0_1",
        boxes: [
          [
            {
              funcType: FUNC_TYPE.ORDER,
              orderer: 0,
              type: ORDER_TYPE.STRICT_0_1,
              amount: 10,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "FLEX_1_0",
        boxes: [
          [
            {
              funcType: FUNC_TYPE.ORDER,
              orderer: 2,
              type: ORDER_TYPE.FLEX_1_0,
              amount: 10,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "STRICT_1_0",
        boxes: [
          [
            {
              funcType: FUNC_TYPE.ORDER,
              orderer: 2,
              type: ORDER_TYPE.STRICT_1_0,
              amount: 10,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "execute 6 orders with 2 times #1",
        boxes: [
          [
            {
              funcType: FUNC_TYPE.ORDER,
              orderer: 0,
              type: ORDER_TYPE.FLEX_0_1,
              amount: 10,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "add liquidity",
        boxes: [
          [
            {
              funcType: FUNC_TYPE.ADD,
              orderer: 0,
              type: TOKEN_TYPE.TOKEN0,
              amount: 200,
              recipient: ZeroAddress,
            },
          ],
        ],
        numOfExecute: [4],
      },
      {
        title: "remove liquidity",
        boxes: [
          [
            {
              funcType: FUNC_TYPE.ADD,
              orderer: 0,
              type: TOKEN_TYPE.TOKEN0,
              amount: 200000,
            },
            {
              funcType: FUNC_TYPE.REMOVE,
              orderer: 0,
              type: TOKEN_TYPE.TOKEN0,
              amount: 10,
            },
          ],
        ],
        numOfExecute: [4],
      },
    ];

    for (let i = 0; i < testCases.length; i++) {
      shares = [0, 0, 0, 0];
      totalShare = 1000;
      amounts = [
        [tokenAmount, tokenAmount],
        [tokenAmount, tokenAmount],
        [tokenAmount, tokenAmount],
        [tokenAmount, tokenAmount],
      ];
      reserves = [initialReserve0, initialReserve1];
      orderInfo = {
        total: [0, 0, 0, 0],
        each: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
      };
      it(testCases[i].title, async () => {
        for (let j = 0; j < testCases[i].boxes.length; j++) {
          //console.log(reserves)
          let orders = testCases[i].boxes[j];
          for (let k = 0; k < orders.length; k++) {
            if (orders[k].funcType == FUNC_TYPE.ORDER) {
              data = await simulator.addOrder(
                boxExchange,
                orderers,
                orders[k],
                orderInfo,
                amounts
              );
              orderInfo = data.orderInfo;
              amounts = data.amounts;
            } else if (orders[k].funcType == FUNC_TYPE.ADD) {
              data = await simulator.addLiquidity(
                boxExchange,
                orderers,
                orders[k],
                reserves,
                amounts,
                shares,
                totalShare
              );
              reserves = data.reserves;
              amounts = data.amounts;
              shares = data.shares;
              totalShare = data.totalShare;
            } else {
              data = await simulator.removeLiquidity(
                boxExchange,
                orderers,
                orders[k],
                reserves,
                amounts,
                shares,
                totalShare
              );
              reserves = data.reserves;
              amounts = data.amounts;
              shares = data.shares;
              totalShare = data.totalShare;
            }
          }
          await boxExchange.expireBox();
          await boxExchange.executeOrders(testCases[i].numOfExecute[j]);
          //[orderInfo, reserves, amounts]
          data = await simulator.update(orderInfo, reserves, amounts);
        }
        const token0Buyer1 = await token0.balanceOf.call(buyer1);
        const token1Buyer1 = await token1.balanceOf.call(buyer1);
        assert(
          token0Buyer1 < amounts[0][0] + 2 || token0Buyer1 > amounts[0][0] - 2,
          "token0 balance is incorrect"
        );
        assert(
          token1Buyer1 < amounts[0][1] + 2 || token1Buyer1 > amounts[0][1] - 2,
          "token1 balance is incorrect"
        );

        const token0Buyer2 = await token0.balanceOf.call(buyer2);
        const token1Buyer2 = await token1.balanceOf.call(buyer2);
        assert(
          token0Buyer2 < amounts[1][0] + 2 || token0Buyer2 > amounts[1][0] - 2,
          "token0 balance is incorrect"
        );
        assert(
          token1Buyer2 < amounts[1][1] + 2 || token1Buyer2 > amounts[1][1] - 2,
          "token1 balance is incorrect"
        );

        const token0Seller1 = await token0.balanceOf.call(seller1);
        const token1Seller1 = await token1.balanceOf.call(seller1);
        assert(
          token0Seller1 < amounts[2][0] + 2 ||
            token0Seller1 > amounts[2][0] - 2,
          "token0 balance is incorrect"
        );
        assert(
          token1Seller1 < amounts[2][1] + 2 ||
            token1Seller1 > amounts[2][1] - 2,
          "token1 balance is incorrect"
        );

        const token0Seller2 = await token0.balanceOf.call(seller2);
        const token1Seller2 = await token1.balanceOf.call(seller2);
        assert(
          token0Seller2 < amounts[3][0] + 2 ||
            token0Seller2 > amounts[3][0] - 2,
          "token0 balance is incorrect"
        );
        assert(
          token1Seller2 < amounts[3][1] + 2 ||
            token1Seller2 > amounts[3][1] - 2,
          "token1 balance is incorrect"
        );

        const _reserves = await boxExchange.getReserves.call();
        assert(
          _reserves[0] < reserves[0] + 2 || _reserves[0] > reserves[0] - 2,
          "reserve of token0 is incorrect"
        );
        assert(
          _reserves[1] < reserves[1] + 2 || _reserves[1] > reserves[1] - 2,
          "reserve of token1 is incorrect"
        );

        //const _reservesAll = (reserves._reserve0 * reserves._reserve1)
        //assert(reserveAll - 10 < _reservesAll || _reservesAll < reserveAll + 10, "mul of reserves are incorrect")
      });
    }
  });
});
