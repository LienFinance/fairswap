const calc = require("../../greedy_test/CalculatorMock.js");
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

function another(type) {
  if (type == 0) {
    return 1;
  } else {
    return 0;
  }
}

function getTokenType(type) {
  if (type == 0 || type == 2) {
    return 0;
  } else {
    return 1;
  }
}

function getRefundRates(rates) {
  if (rates[1] == 0) {
    return [0, 0, 0, 0];
  } else if (rates[1] == 1) {
    return [0, 0, rates[2], 0];
  } else if (rates[1] == 2) {
    return [rates[2], 0, 1, 0];
  } else if (rates[1] == 3) {
    return [0, 0, 0, rates[2]];
  } else {
    return [0, rates[2], 0, 1];
  }
}

function amount(amount, type, rate) {
  if (type == 0) {
    return amount * rate;
  } else {
    return amount / rate;
  }
}

async function addOrder(boxExchange, orderers, order, orderInfo, amounts) {
  orderInfo.total[order.type] += order.amount;
  orderInfo.each[order.orderer][order.type] += order.amount;
  amounts[order.orderer][getTokenType(order.type)] -= order.amount;
  return {orderInfo, amounts};
}

async function addLiquidity(
  boxExchange,
  orderers,
  order,
  reserves,
  amounts,
  shares,
  totalShare
) {
  let share = (totalShare * order.amount) / reserves[order.type];
  let anotherAmount = (share / totalShare) * reserves[another(order.type)];
  shares[order.orderer] += share;
  totalShare += share;
  reserves[order.type] += order.amount;
  reserves[another(order.type)] += anotherAmount;
  amounts[order.orderer][order.type] -= order.amount;
  amounts[order.orderer][another(order.type)] -= anotherAmount;
  return {reserves, amounts, shares, totalShare};
}

async function removeLiquidity(
  boxExchange,
  orderers,
  order,
  reserves,
  amounts,
  shares,
  totalShare
) {
  token0Amount = (reserves[0] * order.amount) / totalShare;
  token1Amount = (reserves[1] * order.amount) / totalShare;
  totalShare -= order.amount;
  shares[order.orderer] -= order.amount;
  reserves[0] -= token0Amount;
  reserves[1] -= token1Amount;
  amounts[order.orderer][0] += token0Amount;
  amounts[order.orderer][1] += token1Amount;
  return {reserves, amounts, shares, totalShare};
}

async function update(orderInfo, reserves, amounts) {
  let tokenType;
  let refundAmount;
  let traded;
  console.log("before: " + amounts);
  let rates = calc.price(
    orderInfo.total[0] / 1.003,
    orderInfo.total[2] / 1.003,
    orderInfo.total[1] / 1.003,
    orderInfo.total[3] / 1.003,
    reserves[0],
    reserves[1]
  );
  reserves[0] += rates[3] * 1.0024 - rates[4] / rates[0];
  reserves[1] += rates[4] * 1.0024 - rates[3] * rates[0];
  let refundRates = getRefundRates(rates);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let tokenType = getTokenType(j);
      let refundAmount = refundRates[j] * orderInfo.each[i][j];
      let inAmount = (orderInfo.each[i][j] - refundAmount) / 1.003;
      let traded = amount(inAmount, tokenType, rates[0]);
      amounts[i][another(tokenType)] += traded;
      amounts[i][tokenType] += refundAmount;
    }
  }
  console.log("after: " + amounts);
  const emptyOrderInfo = {
    total: [0, 0, 0, 0],
    each: [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  };
  return {emptyOrderInfo, reserves, amounts};
}

module.exports = {
  addOrder: addOrder,
  addLiquidity: addLiquidity,
  removeLiquidity: removeLiquidity,
  update: update,
};
