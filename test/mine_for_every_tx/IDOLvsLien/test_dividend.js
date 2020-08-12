// start local chain with $ ganache-cli -b 3 to process "Promise.all(process)"
const {
  time, // Assertions for transactions that should fail
} = require("@openzeppelin/test-helpers");
const {toBN} = web3.utils;
let deploy = require("./combine_test/deploy_contracts.js");
const ZAddress = "0x0000000000000000000000000000000000000000";

contract("BoxExchange IDOL vs Lien", function (accounts) {
  describe("Combined test for dividend redistribution", function () {
    let lientokenInstance;
    let basetokenInstance;
    let exchangeInstance;
    let othertokenInstance;
    const [factory, LP1, LP2] = accounts;

    beforeEach(async () => {
      let instances = await deploy.setting(accounts);
      exchangeInstance = instances.exchangeInstance;
      basetokenInstance = instances.basetokenInstance;
      lientokenInstance = instances.lientokenInstance;
      othertokenInstance = instances.othertokenInstance;
      await exchangeInstance.initializeExchange(2000000, 2500000, 1000, {
        from: LP1,
      });
      //await othertokenInstance.transfer(lientokenInstance.address, 200000000, { from: factory });
    });

    it("withdraw dividend for multiple address", async () => {
      await increaseTerm(100000000000000000, 1000, 0);
      await exchangeInstance.addLiquidity(1685175020, 1500000, 1000000000, 50, {
        from: LP2,
      });
      await increaseTerm(500000000000000000, 5000, 0);
      let receipt = await exchangeInstance.receiveDividendEth({
        from: LP1,
      });
      assert.equal(receipt.logs[0].args.amount, 150000000000000000);
      receipt = await exchangeInstance.receiveDividendToken(
        basetokenInstance.address,
        {
          from: LP1,
        }
      );
      assert.equal(receipt.logs[1].args.amount.toNumber(), 1499);
      receipt = await exchangeInstance.receiveDividendEth({
        from: LP2,
      });
      assert.equal(receipt.logs[0].args.amount, 93750000000000000);
      receipt = await exchangeInstance.receiveDividendToken(
        basetokenInstance.address,
        {
          from: LP2,
        }
      );
      assert.equal(receipt.logs[0].args.amount.toNumber(), 937);
    });

    it("get dividend after removing liquidity", async () => {
      await increaseTerm(100000000000000000, 1000, 0);
      await exchangeInstance.addLiquidity(16, 1500000, 1000000000, 50, {
        from: LP2,
      });
      await increaseTerm(500000000000000000, 5000, 0);
      await exchangeInstance.removeLiquidity(16, 50000, 50000, 600, {
        from: LP2,
      });
      await increaseTerm(300000000000000000, 3000, 0);
      let receipt = await exchangeInstance.receiveDividendEth({
        from: LP2,
      });
      assert.equal(receipt.logs[0].args.amount, 105000000000000000);
      receipt = await exchangeInstance.receiveDividendToken(
        basetokenInstance.address,
        {
          from: LP2,
        }
      );
      assert.equal(receipt.logs[1].args.amount.valueOf(), 1049);
    });

    it("get dividend after transfer share token", async () => {
      await exchangeInstance.transfer(LP2, 1000, {from: LP1});
      await increaseTerm(100000000000000000, 1000, 0);

      let receipt = await exchangeInstance.receiveDividendEth({
        from: LP2,
      });
      assert.equal(receipt.logs[0].args.amount.toString(), 25000000000000000);
      receipt = await exchangeInstance.receiveDividendToken(
        basetokenInstance.address,
        {
          from: LP2,
        }
      );
      assert.equal(receipt.logs[1].args.amount.toString(), 250);
    });

    it("get dividend for multiple times", async () => {
      await increaseTerm(100000000000000000, 1000, 0);
      await time.advanceBlock();
      await exchangeInstance.receiveDividendEth({from: LP1});
      await exchangeInstance.receiveDividendToken(basetokenInstance.address, {
        from: LP1,
      });
      await increaseTerm(500000000000000000, 5000, 0);
      await time.advanceBlock();
      await increaseTerm(300000000000000000, 3000, 0); //increase term after getDividend()
      let receipt = await exchangeInstance.receiveDividendEth({from: LP1});
      assert.equal(receipt.logs[0].args.amount, 200000000000000000);
      receipt = await exchangeInstance.receiveDividendToken(
        basetokenInstance.address,
        {from: LP1}
      );
      assert.equal(receipt.logs[1].args.amount, 2000);
    });

    it("get other ERC20 token dividend", async () => {
      await increaseTerm(0, 0, 4000);
      await time.advanceBlock();
      let receipt = await exchangeInstance.receiveDividendToken(
        othertokenInstance.address,
        {from: LP1}
      );
      assert.equal(
        receipt.logs[1].args.amount,
        1000,
        "LP should withdraw other token "
      );
    });

    it("withdraw other ERC20 token dividend for multiple address", async () => {
      //LP1 has share from term 0
      await increaseTerm(0, 0, 1000);
      await exchangeInstance.addLiquidity(1685175020, 1500000, 1000000000, 50, {
        from: LP2,
      }); //LP2 has share from term 1
      await increaseTerm(0, 0, 5000); //Current term is 2

      let receipt = await exchangeInstance.receiveDividendToken(
        othertokenInstance.address,
        {from: LP1}
      );
      assert.equal(
        receipt.logs[1].args.amount,
        1499,
        "should distribute other token"
      );
      receipt = await exchangeInstance.receiveDividendToken(
        othertokenInstance.address,
        {from: LP2}
      );
      assert.equal(receipt.logs[0].args.amount, 937, "should distribute iDol");
    });

    it("withdraw other ERC20 token dividend after removing liquidity", async () => {
      await increaseTerm(0, 0, 1000); //term1
      await exchangeInstance.addLiquidity(1685175020, 1500000, 1000000000, 50, {
        from: LP2,
      });
      await increaseTerm(0, 0, 5000); //term2
      await exchangeInstance.removeLiquidity(1685175020, 50000, 50000, 600, {
        from: LP2,
      });
      await increaseTerm(0, 0, 3000); //term3
      let receipt = await exchangeInstance.receiveDividendToken(
        othertokenInstance.address,
        {from: LP2}
      );
      assert.equal(
        receipt.logs[1].args.amount,
        1049,
        "LP should withdraw other token "
      );
    });

    it("withdraw other ERC20 token dividend for multiple times", async () => {
      await increaseTerm(0, 0, 1000);
      await time.advanceBlock();

      await exchangeInstance.receiveDividendToken(othertokenInstance.address, {
        from: LP1,
      });
      await increaseTerm(0, 0, 5000);
      await time.advanceBlock();
      await increaseTerm(0, 0, 3000); //increase term after withdrawDividend()

      let receipt = await exchangeInstance.receiveDividendToken(
        othertokenInstance.address,
        {from: LP1}
      );
      assert.equal(
        receipt.logs[1].args.amount,
        2000,
        "LP should withdraw other token "
      );
    });

    it("withdraw dividend after triggered by other account", async () => {
      await increaseTerm(400000000000000000, 4000, 0);

      await time.advanceBlock();
      await lientokenInstance.receiveDividend(
        basetokenInstance.address,
        exchangeInstance.address,
        {from: factory}
      );
      await lientokenInstance.receiveDividend(ZAddress, exchangeInstance.address, {
        from: factory,
      });
      let receipt = await exchangeInstance.receiveDividendEth({
        from: LP1,
      });
      assert.equal(
        receipt.logs[0].args.amount,
        100000000000000000,
        "should distribute ETH to LP"
      );
      receipt = await exchangeInstance.receiveDividendToken(
        basetokenInstance.address,
        {
          from: LP1,
        }
      );

      assert.equal(
        receipt.logs[1].args.amount,
        1000,
        "should distribute iDol to LP"
      );
    });

    async function increaseTerm(ethAmount, baseAmount, otherAmount) {
      await lientokenInstance.sendTransaction({
        from: factory,
        value: ethAmount,
      });
      await basetokenInstance.transfer(lientokenInstance.address, baseAmount, {
        from: factory,
      });
      await othertokenInstance.transfer(
        lientokenInstance.address,
        otherAmount,
        {from: factory}
      );
      await lientokenInstance.settleProfit(basetokenInstance.address, {
        from: factory,
      });
      await lientokenInstance.settleProfit(othertokenInstance.address, {
        from: factory,
      });
      await lientokenInstance.settleProfit(ZAddress, {from: factory});
      await time.increase(1000);
    }
  });
});
