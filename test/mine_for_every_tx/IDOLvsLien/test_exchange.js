// start local chain with $ ganache-cli -b 3 to process "Promise.all(process)"
const {
  time,
  expectRevert, // Assertions for transactions that should fail
} = require("@openzeppelin/test-helpers");
let deploy = require("../../mine_on_interval/IDOLvsLien/deploy_contracts.js");
const ZAddress = "0x0000000000000000000000000000000000000000";
contract("BoxExchange IDOL vs Lien", function (accounts) {
  describe("Check basic functions", function () {
    let lientokenInstance;
    let basetokenInstance;
    let exchangeInstance;
    const [
      factory,
      buyer1,
      buyer2,
      seller1,
      seller2,
      LP1,
      LP2,
      buyer3,
      seller3,
      seller4,
    ] = accounts;

    beforeEach(async () => {
      let instances = await deploy.setting(accounts);
      exchangeInstance = instances.exchangeInstance;
      basetokenInstance = instances.basetokenInstance;
      lientokenInstance = instances.lientokenInstance;
    });
    describe("initialize exchange", function () {
      it("should initialize correctly", async () => {
        let receipt = await exchangeInstance.initializeExchange(
          20000,
          10000,
          1000,
          {
            from: LP1,
          }
        );
        await web3.eth.getTransaction(receipt.tx);
        let exchangeData = await exchangeInstance.getExchangeData.call();
        assert.equal(exchangeData[1], 20000, "iDOL Pool should be 20000");
        assert.equal(exchangeData[2], 10000, "Lien Token Pool should be 20000");

        assert.equal(exchangeData[3], 1000, "totalShares is not 1000");
      });
    });
    describe("move liquidity", function () {
      it("should execute remove liquidity correctly", async () => {
        await exchangeInstance.initializeExchange(20000, 30000, 1000, {
          from: LP1,
        });
        await exchangeInstance.removeLiquidity(1685175020, 1000, 1500, 500, {
          from: LP1,
        });
        await time.advanceBlock();
        let LP1Data = await exchangeInstance.balanceOf.call(LP1);
        assert.equal(LP1Data.valueOf(), 500, "LP1 burns 500 shares");
        let exchangeData = await exchangeInstance.getExchangeData.call();
        assert.equal(exchangeData[3], 500, "totalShares is not 500");
        assert.equal(exchangeData[1], 10000, "iDOL Pool should be 10000");
        assert.equal(exchangeData[2], 15000, "Lien Token Pool should be 15000");
      });

      it("should execute invest liquidity correctly", async () => {
        await exchangeInstance.initializeExchange(20000, 30000, 1000, {
          from: LP1,
        });
        await exchangeInstance.addLiquidity(1685175020, 2000, 3000, 50, {
          from: LP2,
        });
        await time.advanceBlock();
        let LP2Data = await exchangeInstance.balanceOf.call(LP2);
        assert.equal(LP2Data.valueOf(), 100, "LP2 gets 100 shares");
        let exchangeData = await exchangeInstance.getExchangeData.call();
        assert.equal(exchangeData[3], 1100, "totalShares is not 1100");
        assert.equal(exchangeData[1], 22000, "iDOL Pool should be 22000");
        assert.equal(exchangeData[2], 33000, "Lien Token Pool should be 33000");
      });

      it("should execute invest liquidity correctly when IDOL is under value", async () => {
        await exchangeInstance.initializeExchange(20000, 30000, 1000, {
          from: LP1,
        });
        await exchangeInstance.addLiquidity(1685175020, 2000, 3300, 50, {
          from: LP2,
        });
        await time.advanceBlock();
        let LP2Data = await exchangeInstance.balanceOf.call(LP2);
        assert.equal(LP2Data.valueOf(), 100, "LP2 gets 100 shares");
        let exchangeData = await exchangeInstance.getExchangeData.call();
        assert.equal(exchangeData[3], 1100, "totalShares is not 1100");
        assert.equal(exchangeData[1], 22000, "iDOL Pool should be 22000");
        assert.equal(exchangeData[2], 33000, "Lien Token Pool should be 33000");
      });

      it("should execute invest liquidity correctly when Lien is under value", async () => {
        await exchangeInstance.initializeExchange(20000, 30000, 1000, {
          from: LP1,
        });
        await exchangeInstance.addLiquidity(1685175020, 2200, 3000, 50, {
          from: LP2,
        });
        await time.advanceBlock();
        let LP2Data = await exchangeInstance.balanceOf.call(LP2);
        assert.equal(LP2Data.valueOf(), 100, "LP2 gets 100 shares");
        let exchangeData = await exchangeInstance.getExchangeData.call();
        assert.equal(exchangeData[3], 1100, "totalShares is not 1100");
        assert.equal(exchangeData[1], 22000, "iDOL Pool should be 22000");
        assert.equal(exchangeData[2], 33000, "Lien Token Pool should be 33000");
      });

      it("should revert if idol amount is 0", async () => {
        await exchangeInstance.initializeExchange(20000, 30000, 1000, {
          from: LP1,
        });
        await expectRevert.unspecified(
          exchangeInstance.orderBaseToSettlement(10, ZAddress, 0, false, {
            from: LP1,
          })
        );
      });

      it("should revert if timeout", async () => {
        await exchangeInstance.initializeExchange(20000, 30000, 1000, {
          from: LP1,
        });
        await exchangeInstance.orderBaseToSettlement(10, ZAddress, 100, false, {
          from: LP2,
        });
        await time.advanceBlock();
        await time.advanceBlock();

        await expectRevert.unspecified(
          exchangeInstance.orderBaseToSettlement(0, ZAddress, 100, false, {
            from: LP1,
          })
        );
      });

      it("should revert if timeout", async () => {
        await exchangeInstance.initializeExchange(20000, 30000, 1000, {
          from: LP1,
        });
        await exchangeInstance.orderBaseToSettlement(10, ZAddress, 100, false, {
          from: LP2,
        });
        await time.advanceBlock();
        await time.advanceBlock();

        await expectRevert.unspecified(
          exchangeInstance.orderSettlementToBase(0, ZAddress, 100, false, {
            from: LP1,
          })
        );
      });

      it("should revert if settlement token amount is 0", async () => {
        await exchangeInstance.initializeExchange(20000, 30000, 1000, {
          from: LP1,
        });
        await expectRevert.unspecified(
          exchangeInstance.orderSettlementToBase(10, ZAddress, 0, false, {
            from: LP1,
          })
        );
      });
    });
    describe("transfer market fee", function () {
      it("check market fee for lien token", async () => {
        await exchangeInstance.initializeExchange(30000000, 20000000, 1000, {
          from: LP1,
        });
        await exchangeInstance.orderBaseToSettlement(
          1685175020,
          ZAddress,
          150000,
          false,
          {from: buyer1}
        );
        await exchangeInstance.orderSettlementToBase(
          1685175020,
          ZAddress,
          100000,
          false,
          {from: seller1}
        );
        await exchangeInstance.orderBaseToSettlement(
          1685175020,
          ZAddress,
          150000,
          false,
          {from: buyer2}
        );
        await exchangeInstance.orderSettlementToBase(
          1685175020,
          ZAddress,
          100000,
          false,
          {from: seller2}
        );

        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(4);
        let tokensForLien = await exchangeInstance.marketFeePool0.call();
        assert.equal(
          tokensForLien,
          355,
          "Invalid amount of BaseToken for lien"
        );
      });

      it("check market fee for lien token", async () => {
        await exchangeInstance.initializeExchange(30000000, 20000000, 1000, {
          from: LP1,
        });

        await exchangeInstance.orderBaseToSettlement(
          1685175020,
          ZAddress,
          3000000,
          false,
          {from: buyer1}
        );
        await exchangeInstance.orderSettlementToBase(
          1685175020,
          ZAddress,
          2000000,
          false,
          {from: seller2}
        );

        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(4);
        await exchangeInstance.orderSettlementToBase(
          1685175020,
          ZAddress,
          300,
          1,
          {from: seller2}
        );
        let idolForLien = await exchangeInstance.marketFeePool0.call();
        assert.equal(idolForLien, 1756, "Invalid amount of IDOL for lien");
        let tokenForLien = await exchangeInstance.marketFeePool1.call();
        assert.equal(tokenForLien, 0, "Invalid amount of Lien token for lien");
      });

      it("distribute market fee to lien token", async () => {
        await exchangeInstance.initializeExchange(30000000, 20000000, 1000, {
          from: LP1,
        });
        await exchangeInstance.orderBaseToSettlement(
          1685175020,
          ZAddress,
          150000,
          false,
          {from: buyer1}
        );
        await exchangeInstance.orderSettlementToBase(
          1685175020,
          ZAddress,
          100000,
          false,
          {from: seller1}
        );
        await exchangeInstance.orderBaseToSettlement(
          1685175020,
          ZAddress,
          150000,
          false,
          {from: buyer2}
        );
        await exchangeInstance.orderSettlementToBase(
          1685175020,
          ZAddress,
          100000,
          false,
          {from: seller2}
        );

        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(4);

        await exchangeInstance.sendMarketFeeToLien({from: factory});

        await time.advanceBlock();
        let balance = await basetokenInstance.balanceOf.call(
          lientokenInstance.address
        );
        assert.equal(balance, 200000355, "IDOL sent to Lien token is invalid");
        let lienBalance = await lientokenInstance.balanceOf.call(
          lientokenInstance.address
        );
        assert.equal(lienBalance, 0, "Invalid amount of Lien token for lien");
      });
      it("distribute market fee to lien token", async () => {
        await exchangeInstance.initializeExchange(30000000, 20000000, 1000, {
          from: LP1,
        });

        await time.advanceBlock();

        await exchangeInstance.sendMarketFeeToLien({from: factory});

        await time.advanceBlock();
        let balance = await basetokenInstance.balanceOf.call(
          lientokenInstance.address
        );
        assert.equal(balance, 200000000, "IDOL sent to Lien token is invalid");
        let lienBalance = await lientokenInstance.balanceOf.call(
          lientokenInstance.address
        );
        assert.equal(lienBalance, 0, "Invalid amount of Lien token for lien");
      });
    });
  });
});
