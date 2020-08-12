const SPREAD_RATE = 0.003; //= 0.3%
const SECURE_RATE = 0.05; //5% max slippage for all orders
const DECIMAL = 1;
const TOLERANCE_RATE = 1000000000000000; //= 0.1%

// parameters of approximate expression of oToken volatility
const ALPHA1 = 6.085926862470381;
const ALPHA2 = 2.9318752575854687;
const ALPHA3 = -3.1918697336735526;
const MAX_EXECUTE_ACCOUNT = 5;
const BETA1 = 1.4068742374168284;
const BETA2 = 1.7564305040939976;
const BETA3 = 2.434962998012975;

const COEF1 = 226.69897374117446;
const COEF2 = 14.14362138870212;
const COEF3 = 3.1918697336735526;
const COEFSIG1 = 1332.90652470981;
const COEFSIG2 = 39.31019606604141;
const COEFSIG3 = 7.201026361442427;
const INTERCEPT1 = 327.99787010665386;
const INTERCEPT2 = 28.959220856904096;
const INTERCEPT3 = 9.723230176749988;
const ROOTEDYEARINSECOND = 5615;
const TimeYear = 60 * 60 * 24 * 365;

function calculateZ(coef, coefsig, intercept, ratio, sigTime) {
  let z = intercept - ratio * coef - sigTime * coefsig;
  if (z <= 2) {
    return 1;
  } else if (z > 100) {
    return 50;
  } else {
    return z / 2;
  }
}

function calcE0_1(
  settlementTokenPool,
  allSell,
  limitBuyPrice01,
  baseTokenPool
) {
  let eA = (settlementTokenPool + allSell) / limitBuyPrice01;
  if (eA > baseTokenPool) {
    return eA - baseTokenPool;
  } else {
    return 0;
  }
}

function calcE1_0(
  settlementTokenPool,
  allSell,
  limitBuyPrice01,
  baseTokenPool
) {
  let eA = (settlementTokenPool + allSell) * limitBuyPrice01;
  if (eA > baseTokenPool) {
    return eA - baseTokenPool;
  } else {
    return 0;
  }
}

let calculateCurrentSpread = function (
  ethPrice,
  ethVolatility,
  maturity,
  strikePrice,
  now
) {
  let ratio = ethPrice / strikePrice;
  let duration = (maturity - now) / TimeYear;
  let sigTime = ethVolatility * duration ** 0.5;

  if (ratio <= BETA1 - ALPHA1 * sigTime) {
    return (
      SPREAD_RATE * calculateZ(COEF1, COEFSIG1, INTERCEPT1, ratio, sigTime)
    );
  } else if (ratio <= BETA2 - ALPHA2 * sigTime) {
    return (
      SPREAD_RATE * calculateZ(COEF2, COEFSIG2, INTERCEPT2, ratio, sigTime)
    );
  } else if (ratio <= BETA3 - ALPHA3 * sigTime) {
    return (
      SPREAD_RATE * calculateZ(COEF3, COEFSIG3, INTERCEPT3, ratio, sigTime)
    );
  } else {
    return SPREAD_RATE;
  }
};

let calculatePrice = function (
  buyAmount,
  buyAmountLimit,
  sellAmount,
  sellAmountLimit,
  baseTokenPool,
  settlementTokenPool
) {
  let allBuy = buyAmount + buyAmountLimit;
  let allSell = sellAmount + sellAmountLimit;
  let ratio = settlementTokenPool / baseTokenPool;

  let firstPrice = (settlementTokenPool + allSell) / (baseTokenPool + allBuy);
  let limitBuyPrice01 = ratio / 1.001;
  let limitSellPrice01 = ratio * 1.001;

  if (firstPrice > limitBuyPrice01 && firstPrice < limitSellPrice01) {
    return [firstPrice, 0, 0, allBuy, allSell];
  } else if (firstPrice <= limitBuyPrice01) {
    let executeBuyAmount01 = calcE0_1(
      ettlementTokenPool,
      allSell,
      limitBuyPrice01,
      baseTokenPool
    );
    if (executeBuyAmount01 >= buyAmount) {
      let refundRate = (allBuy - executeBuyAmount01) / buyAmountLimit;

      return [limitBuyPrice01, 1, refundRate, executeBuyAmount01, allSell];
    } else {
      let limitBuyPrice5 = ratio / 1.05;
      let newPrice =
        (settlementTokenPool + allSell) / (baseTokenPool + buyAmount);
      if (newPrice < limitBuyPrice5) {
        let executeBuyAmount5 = calcE0_1(
          settlementTokenPool,
          allSell,
          limitBuyPrice5,
          baseTokenPool
        );
        if (executeBuyAmount5 < buyAmount) {
          let refundRate = (buyAmount - executeBuyAmount5) / buyAmount;
          return [limitBuyPrice5, 2, refundRate, executeBuyAmount5, allSell];
        }
      } else {
        return [newPrice, 1, 1, buyAmount, allSell];
      }
    }
  } else {
    let executeSellAmount01 = calcE1_0(
      baseTokenPool,
      allBuy,
      limitSellPrice01,
      settlementTokenPool
    );
    if (executeSellAmount01 >= sellAmount) {
      let refundRate = (allSell - executeSellAmount01) / sellAmountLimit;

      return [limitSellPrice01, 3, refundRate, allBuy, executeSellAmount01];
    } else {
      let limitSellPrice5 = ratio * 1.05;
      let newPrice =
        (settlementTokenPool + sellAmount) / (baseTokenPool + allBuy);
      if (newPrice > limitSellPrice5) {
        let executeSellAmount5 = calcE1_0(
          baseTokenPool,
          allBuy,
          limitSellPrice5,
          settlementTokenPool
        );
        if (executeSellAmount5 < sellAmount) {
          let refundRate = (sellAmount - executeSellAmount5) / sellAmount;
          return [limitSellPrice5, 4, refundRate, allBuy, executeSellAmount5];
        }
      } else {
        return [newPrice, 3, 1, allBuy, sellAmount];
      }
    }
  }
};

module.exports = {
  spread: calculateCurrentSpread,
  price: calculatePrice,
};
