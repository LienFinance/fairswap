const Calculator = artifacts.require("PriceCalculator");
const SpreadCalculator = artifacts.require("SpreadCalculator");
const Oracle = artifacts.require("TestOracle");
const calc = require("./CalculatorMock.js");
const BigNumber = require("bignumber.js");
const maxEthSupply = web3.utils.toBN(10 ** 10);
const FixedIdolDecimal = web3.utils.toBN(10 ** 4);
const OracleDecimal = web3.utils.toBN(10 ** 8);
const edgeTokensAmount = [
  1,
  web3.utils
    .toBN(2 ** 64)
    .mul(maxEthSupply)
    .mul(FixedIdolDecimal),
];
const edgeETHPrice = [
  1,
  web3.utils.toBN(10e18),
  web3.utils.toBN(2 ** 64).mul(OracleDecimal),
];
const edgeMaturity = [1, web3.utils.toBN(10e10), web3.utils.toBN(10e18)];
const edgeVolatility = [1, web3.utils.toBN(10e5), web3.utils.toBN(10e11)];
contract("Calculator", function () {
  describe("Calculate spread", function () {
    async function verifySpreadRate(
      volatility,
      ethPrice,
      duration,
      strikePrice
    ) {
      const currentNumber = await web3.eth.getBlockNumber();
      const block = await web3.eth.getBlock(currentNumber);

      await oracle.changeData(
        (ethPrice * 10 ** 8).toFixed(),
        (volatility * 10 ** 8).toFixed()
      );
      let spread = calc.spread(
        ethPrice,
        volatility,
        block.timestamp + duration,
        strikePrice,
        block.timestamp
      );
      let lowestSpread = web3.utils.toBN((spread * 10 ** 18 - 10000).toFixed());
      let highestSpread = web3.utils.toBN(
        (spread * 10 ** 18 + 10000).toFixed()
      );

      console.log(
        "strike Price: " +
          strikePrice +
          " ethPrice: " +
          ethPrice +
          " volatility: " +
          volatility +
          " duration: " +
          duration
      );

      let result = await calculatorInstance.calculateCurrentSpread.call(
        block.timestamp + duration,
        web3.utils.toBN(strikePrice.toFixed()).mul(web3.utils.toBN(10 ** 18)),
        oracle.address
      );
      assert(
        lowestSpread <= result <= highestSpread,
        "Invalid spread rate. Calculated spread rate is: " +
          result +
          " but should be " +
          spread
      );
    }

    function getETHPrice(iterator) {
      return iterator ** 10;
    }

    function getVolatility(iterator) {
      return iterator * 0.1;
    }

    function getDuration(iterator) {
      if (iterator == 0) {
        return 1;
      }
      return iterator ** 15;
    }

    function getStrikePrice(iterator) {
      if (iterator == 0) {
        return 1;
      }
      return iterator ** 7;
    }

    let calculatorInstance;
    let oracle;
    before(async () => {
      oracle = await Oracle.new();
      calculatorInstance = await SpreadCalculator.new();
    });

    const length = 5;
    let counter = 0;

    for (let v = 0; v < length; v++) {
      volatility = getVolatility(v);
      for (let p = 0; p < length; p++) {
        ethPrice = getETHPrice(p);
        for (let d = 1; d < length + 1; d++) {
          duration = getDuration(d);
          for (let s = 1; s < length + 1; s++) {
            strikePrice = getStrikePrice(s);
            counter++;
            it("test calculate spread: No." + counter, async () => {
              await verifySpreadRate(
                volatility,
                ethPrice,
                duration,
                strikePrice
              );
            });
          }
        }
      }
    }

    const _length = 3;
    counter = 0;
    for (let v = 0; v < _length; v++) {
      for (let p = 0; p < _length; p++) {
        for (let d = 0; d < _length; d++) {
          for (let s = 0; s < _length; s++) {
            counter++;
            it(
              "test calculate spread of edge argument: No." + counter,
              async () => {
                await oracle.changeData(edgeETHPrice[p], edgeVolatility[v]);
                await calculatorInstance.calculateCurrentSpread.call(
                  edgeMaturity[d],
                  edgeETHPrice[s],
                  oracle.address
                );
              }
            );
          }
        }
      }
    }
  });

  describe("Calculate price", function () {
    async function verifyPrice(
      AmountSTRICT_0_1,
      AmountFLEX_0_1,
      AmountSTRICT_1_0,
      AmountFLEX_1_0,
      reserve0,
      reserve1
    ) {
      let executionData = calc.price(
        AmountSTRICT_0_1,
        AmountFLEX_0_1,
        AmountSTRICT_1_0,
        AmountFLEX_1_0,
        reserve0,
        reserve1
      );
      let multiplyer = new BigNumber(10 ** 18);
      let difference = new BigNumber(10 ** 7);
      let price = new BigNumber(executionData[0]);
      let lowestPrice = price.multipliedBy(multiplyer).minus(difference);
      let highestPrice = price.multipliedBy(multiplyer).plus(difference);

      let refundRate = new BigNumber(executionData[2]);
      let lowestRefundRate = refundRate
        .multipliedBy(multiplyer)
        .minus(difference);
      let highestRefundRate = refundRate
        .multipliedBy(multiplyer)
        .plus(difference);

      let buyAmount = new BigNumber(executionData[3]);
      let lowestBuyAmount = buyAmount
        .multipliedBy(multiplyer)
        .minus(difference);
      let highestSellAmount = buyAmount
        .multipliedBy(multiplyer)
        .plus(difference);

      let sellAmount = new BigNumber(executionData[4]);
      let lowestSellAmount = sellAmount
        .multipliedBy(multiplyer)
        .minus(difference);
      let highestBuyAmount = sellAmount
        .multipliedBy(multiplyer)
        .plus(difference);

      let result = await calculatorInstance.calculatePrice.call(
        web3.utils.toBN(AmountSTRICT_0_1).mul(web3.utils.toBN(10 ** 18)),
        web3.utils.toBN(AmountFLEX_0_1).mul(web3.utils.toBN(10 ** 18)),
        web3.utils.toBN(AmountSTRICT_1_0).mul(web3.utils.toBN(10 ** 18)),
        web3.utils.toBN(AmountFLEX_1_0).mul(web3.utils.toBN(10 ** 18)),
        web3.utils.toBN(reserve0).mul(web3.utils.toBN(10 ** 18)),
        web3.utils.toBN(reserve1).mul(web3.utils.toBN(10 ** 18))
      );

      console.log(
        "STRICT_0_1: " +
          AmountSTRICT_0_1 +
          " FLEX_0_1 : " +
          AmountFLEX_0_1 +
          " AmountSTRICT_1_0: " +
          AmountSTRICT_1_0 +
          " AmountFLEX_1_0: " +
          AmountFLEX_1_0 +
          " reserve0: " +
          reserve0,
        " reserve1: " + reserve1
      );
      assert(
        lowestPrice <= result[0] <= highestPrice,
        "Invalid price. Calculated price in the contract is: " +
          result[0] +
          " but should be " +
          executionData[2]
      );
      assert(
        lowestRefundRate <= result[2] <= highestRefundRate,
        "Invalid refund rate. Calculated refund rate in the contract is: " +
          result[3] +
          " but should be " +
          executionData[0]
      );
      assert(
        lowestBuyAmount <= result[3] <= highestBuyAmount,
        "Invalid buy amount. Calculated buy amount in the contract is: " +
          result[0] +
          " but should be " +
          executionData[0]
      );
      assert(
        lowestSellAmount <= result[4] <= highestSellAmount,
        "Invalid sell amount Calculated sell amount in the contract is: " +
          result[0] +
          " but should be " +
          executionData[0]
      );
      assert.equal(
        executionData[1],
        result[1],
        "refund category should be equal to " + executionData[1]
      );
    }

    function getAmount(iterator) {
      return iterator ** 10;
    }

    function getReserve(iterator) {
      return iterator ** 20;
    }

    let calculatorInstance;
    let oracle;
    before(async () => {
      oracle = await Oracle.new();
      calculatorInstance = await Calculator.new(oracle.address);
    });

    const length = 5;
    let counter = 0;

    let reserve0;
    let reserve1;
    let AmountSTRICT_0_1;
    let AmountFLEX_0_1;
    let AmountSTRICT_1_0;
    let AmountFLEX_1_0;
    for (let v = 0; v < length; v++) {
      AmountSTRICT_0_1 = getAmount(v);
      for (let p = 0; p < length; p++) {
        AmountFLEX_0_1 = getAmount(p);
        for (let d = 0; d < length; d++) {
          AmountSTRICT_1_0 = getAmount(d);
          for (let s = 0; s < length; s++) {
            AmountFLEX_1_0 = getAmount(s);
            for (let bp = 1; bp < length + 1; bp++) {
              reserve0 = getReserve(bp);
              for (let sp = 1; sp < length + 1; sp++) {
                reserve1 = getReserve(sp);
                counter++;
                it("edge test calculate spread: No." + counter, async () => {
                  await verifyPrice(
                    AmountSTRICT_0_1.toFixed(),
                    AmountFLEX_0_1.toFixed(),
                    AmountSTRICT_1_0.toFixed(),
                    AmountFLEX_1_0.toFixed(),
                    reserve0.toFixed(),
                    reserve1.toFixed()
                  );
                });
              }
            }
          }
        }
      }
    }
    const _length = 2;
    counter = 0;
    for (let v = 0; v < _length; v++) {
      for (let p = 0; p < _length; p++) {
        for (let d = 0; d < _length; d++) {
          for (let s = 0; s < _length; s++) {
            for (let bp = 0; bp < _length; bp++) {
              for (let sp = 0; sp < _length; sp++) {
                counter++;
                it(
                  "not revert when argument is too big No. " + counter,
                  async () => {
                    await calculatorInstance.calculatePrice.call(
                      edgeTokensAmount[v],
                      edgeTokensAmount[p],
                      edgeTokensAmount[d],
                      edgeTokensAmount[s],
                      edgeTokensAmount[bp],
                      edgeTokensAmount[sp]
                    );
                  }
                );
              }
            }
          }
        }
      }
    }
  });
});
