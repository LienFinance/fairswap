const DECIMAL = 1000000000000000000;
const ZAddress = "0x0000000000000000000000000000000000000000";
const BoxExchange = artifacts.require("ETHBoxExchange");
const getETH = artifacts.require("TestGetETH");
const {
  BN, // Big Number support
  expectEvent, // Assertions for emitted events
  expectRevert,
  time, // Assertions for transactions that should fail
} = require("@openzeppelin/test-helpers");
let deploy = require("../../mine_on_interval/IDOLvsETH/deploy_contracts.js");
const initialShare = web3.utils.toWei("1", "ether");
contract("BoxExchange IDOL vs ETH", function (accounts) {
  describe("Test basic functions", function () {
    let tokenInstance;
    let exchangeInstance;
    let lientokenInstance;
    let oracleInstance;
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
      tokenInstance = instances.tokenInstance;
      exchangeInstance = instances.exchangeInstance;
      lientokenInstance = instances.lientokenInstance;
      oracleInstance = instances.oracleInstance;
    });
    describe("initialize exchange", function () {
      it("should initialize correctly", async () => {
        await exchangeInstance.initializeExchange(20000, initialShare, {
          from: LP1,
          value: web3.utils.toWei("1", "ether"),
        });
        let exchangeData = await exchangeInstance.getExchangeData.call();
        assert.equal(
          exchangeData[2],
          web3.utils.toWei("1", "ether"),
          "Eth Pool should be 1 ETH"
        );
        assert.equal(exchangeData[1], 20000, "Token Pool should be 20000");
        let totalShare = await exchangeInstance.totalSupply.call();
        assert.equal(
          totalShare.valueOf(),
          1 * DECIMAL,
          "TotalShares should be 1000"
        );
      });
    });
    describe("move liquidity", function () {
      it("should add and remove liquidity correctly", async () => {
        await exchangeInstance.initializeExchange(40000, initialShare, {
          from: LP1,
          value: web3.utils.toWei("2", "ether"),
        });

        const eth = web3.utils.toWei("1", "ether");
        const shareBurned = web3.utils.toWei("0.5", "ether");
        const minShares = web3.utils.toWei("0.5", "ether");
        await tokenInstance.approve(exchangeInstance.address, 20000, {
          from: LP2,
        });
        await exchangeInstance.removeLiquidity(100, 1000, 2000, shareBurned, {
          from: LP1,
        });
        let LP1Data = await exchangeInstance.balanceOf.call(LP1);
        assert.equal(LP1Data.valueOf(), 0.5 * DECIMAL, "LP1 burns 500 shares");

        await exchangeInstance.addLiquidity(100, minShares, {
          from: LP2,
          value: eth,
        });
        let LP2Data = await exchangeInstance.balanceOf.call(LP2);
        assert.equal(LP2Data.valueOf(), 0.5 * DECIMAL, "LP2 gets 100 shares");

        let totalshare = await exchangeInstance.totalSupply.call();
        assert.equal(totalshare.valueOf(), 1 * DECIMAL, "LP2 gets 100 shares");
      });

      it("should revert invalid minshares", async () => {
        const minShares = web3.utils.toWei("500", "ether");
        await exchangeInstance.initializeExchange(10000, initialShare, {
          from: LP1,
          value: 20000,
        });

        try {
          await exchangeInstance.addLiquidity(16, minShares, {
            from: LP2,
            value: 2000,
          });
        } catch (err) {
          assert(err.toString().includes("revert"), err.toString());
          return;
        }
        assert(false, "should revert");
      });

      it("should revert invalid min Base token", async () => {
        await exchangeInstance.initializeExchange(10000, initialShare, {
          from: LP1,
          value: 20000,
        });
        try {
          await exchangeInstance.removeLiquidity(16, 100000, 1500, 500, {
            from: LP1,
          });
        } catch (err) {
          assert(err.toString().includes("revert"), err.toString());
          return;
        }
        assert(false, "should revert");
      });

      it("should revert invalid min Settlement token", async () => {
        await exchangeInstance.initializeExchange(10000, initialShare, {
          from: LP1,
          value: 20000,
        });
        try {
          await exchangeInstance.removeLiquidity(16, 1000, 150000, 500, {
            from: LP1,
          });
        } catch (err) {
          assert(err.toString().includes("revert"), err.toString());
          return;
        }
        assert(false, "should revert");
      });

      it("should revert invalid share", async () => {
        const sharesBurned = web3.utils.toWei("1100", "ether");
        await exchangeInstance.initializeExchange(10000, initialShare, {
          from: LP1,
          value: 20000,
        });
        try {
          await exchangeInstance.removeLiquidity(16, 1000, 1500, sharesBurned, {
            from: LP1,
          });
        } catch (err) {
          assert(err.toString().includes("revert"), err.toString());
          return;
        }
        assert(false, "should revert");
      });

      it("should revert if eth amount is 0 in addLiquidity", async () => {
        await exchangeInstance.initializeExchange(10000, initialShare, {
          from: LP1,
          value: 20000,
        });
        await expectRevert.unspecified(
          exchangeInstance.addLiquidity(16, 10, {
            from: LP2,
            value: 0,
          })
        );
      });

      it("should revert if idol amount is 0 in orderTokenToEth", async () => {
        await exchangeInstance.initializeExchange(10000, initialShare, {
          from: LP1,
          value: 20000,
        });
        await expectRevert.unspecified(
          exchangeInstance.orderTokenToEth(0, ZAddress, 0, true, {
            from: seller2,
          })
        );
      });

      it("should revert if eth amount is 0 in orderEthToToken", async () => {
        await exchangeInstance.initializeExchange(10000, initialShare, {
          from: LP1,
          value: 20000,
        });
        await expectRevert.unspecified(
          exchangeInstance.orderEthToToken(16, ZAddress, false, {
            from: buyer1,
            value: 0,
          })
        );
      });

      it("should revert if timeout in addLiquidity", async () => {
        await exchangeInstance.initializeExchange(10000, initialShare, {
          from: LP1,
          value: 20000,
        });
        await exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer1,
          value: 100,
        });
        await time.advanceBlock();
        await time.advanceBlock();
        await expectRevert.unspecified(
          exchangeInstance.addLiquidity(0, 10, {
            from: LP2,
            value: 0,
          })
        );
      });

      it("should revert if timeout in removeLiquidity", async () => {
        await exchangeInstance.initializeExchange(10000, initialShare, {
          from: LP1,
          value: 20000,
        });
        await exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer1,
          value: 100,
        });
        await time.advanceBlock();
        await time.advanceBlock();
        await expectRevert.unspecified(
          exchangeInstance.removeLiquidity(0, 1, 1, 100, {
            from: LP1,
          })
        );
      });

      it("should revert if timeout", async () => {
        await exchangeInstance.initializeExchange(10000, initialShare, {
          from: LP1,
          value: 20000,
        });
        await exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer1,
          value: 100,
        });
        await time.advanceBlock();
        await time.advanceBlock();

        await expectRevert.unspecified(
          exchangeInstance.orderEthToToken(0, ZAddress, false, {
            from: buyer1,
            value: 100,
          })
        );
      });

      it("should revert if timeout", async () => {
        await exchangeInstance.initializeExchange(10000, initialShare, {
          from: LP1,
          value: 20000,
        });
        await exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer1,
          value: 100,
        });
        await time.advanceBlock();
        await time.advanceBlock();

        await expectRevert.unspecified(
          exchangeInstance.orderTokenToEth(0, ZAddress, 300, true, {
            from: seller2,
          })
        );
      });

      it("should revert if settlement token amount is 0", async () => {
        await exchangeInstance.initializeExchange(10000, initialShare, {
          from: LP1,
          value: 20000,
        });
        await expectRevert.unspecified(
          exchangeInstance.orderTokenToEth(0, ZAddress, 0, true, {
            from: seller2,
          })
        );
      });
    });
    describe("transfer market fee", function () {
      it("check market fee #1", async () => {
        await exchangeInstance.initializeExchange(6000000, initialShare, {
          from: LP1,
          value: 9000000,
        });
        await exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer1,
          value: 20000,
        });
        await exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer2,
          value: 20000,
        });
        await exchangeInstance.orderTokenToEth(16, ZAddress, 10000, false, {
          from: seller1,
        });
        await exchangeInstance.orderTokenToEth(16, ZAddress, 10000, false, {
          from: seller2,
        });
        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(5);
        await exchangeInstance.orderTokenToEth(16, ZAddress, 300, true, {
          from: seller2,
        });
        let ethAmount = await exchangeInstance.marketFeePool1.call();
        assert.equal(
          ethAmount,
          22,
          "Invalid amount of BaseToken for Lien token"
        );
        let tokenAmount = await exchangeInstance.marketFeePool0.call();
        assert.equal(
          tokenAmount,
          10,
          "Invalid amount of SettlementToken for Lien token"
        );
      });
      it("check market fee #2", async () => {
        await exchangeInstance.initializeExchange(1000000000, initialShare, {
          from: LP1,
          value: 1500000000,
        });

        await exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer1,
          value: 15000000,
        });
        await exchangeInstance.orderTokenToEth(16, ZAddress, 10000000, false, {
          from: seller1,
        });
        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(5);
        let tokenAmount = await exchangeInstance.marketFeePool0.call();
        assert.equal(
          tokenAmount,
          5982,
          "Invalid amount of BaseToken for Lien token"
        );
        let ethAmount = await exchangeInstance.marketFeePool1.call();
        assert.equal(
          ethAmount,
          8973,
          "Invalid amount of SettlementToken for Lien token"
        );
      });

      it("check market fee when there is only sell order", async () => {
        await exchangeInstance.initializeExchange(1000000000, initialShare, {
          from: LP1,
          value: 1500000000,
        });

        await exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer1,
          value: 15000000,
        });
        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(5);
        let tokenAmount = await exchangeInstance.marketFeePool0.call();
        assert.equal(
          tokenAmount,
          0,
          "Invalid amount of BaseToken for Lien token"
        );
        let ethAmount = await exchangeInstance.marketFeePool1.call();
        assert.equal(
          ethAmount,
          8973,
          "Invalid amount of SettlementToken for Lien token"
        );
      });

      it("check market fee when there is only buy order", async () => {
        await exchangeInstance.initializeExchange(1000000000, initialShare, {
          from: LP1,
          value: 1500000000,
        });
        await exchangeInstance.orderTokenToEth(16, ZAddress, 10000000, false, {
          from: seller1,
        });
        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(5);
        let tokenAmount = await exchangeInstance.marketFeePool0.call();
        assert.equal(
          tokenAmount,
          5982,
          "Invalid amount of BaseToken for Lien token"
        );
        let ethAmount = await exchangeInstance.marketFeePool1.call();
        assert.equal(
          ethAmount,
          0,
          "Invalid amount of SettlementToken for Lien token"
        );
      });

      it("transfer market fee to lien correctly", async () => {
        await exchangeInstance.initializeExchange(6000000, initialShare, {
          from: LP1,
          value: 9000000,
        });

        await exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer1,
          value: 20000,
        });
        await exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer2,
          value: 20000,
        });
        await exchangeInstance.orderTokenToEth(16, ZAddress, 10000, false, {
          from: seller1,
        });
        await exchangeInstance.orderTokenToEth(16, ZAddress, 10000, false, {
          from: seller2,
        });

        await time.advanceBlock();
        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(5);
        await exchangeInstance.sendMarketFeeToLien({from: factory});
        let ethBalance = await web3.eth.getBalance(lientokenInstance.address);
        assert.equal(
          ethBalance,
          22,
          "Invalid eth amount lientoken will receive"
        );
        let balance = await tokenInstance.balanceOf.call(
          lientokenInstance.address
        );
        assert.equal(balance, 10, "Invalid idol amount lientoken will receive");
      });

      it("call transfer market fee twice", async () => {
        await exchangeInstance.initializeExchange(6000000, initialShare, {
          from: LP1,
          value: 9000000,
        });

        await exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer1,
          value: 20000,
        });
        await exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer2,
          value: 20000,
        });
        await exchangeInstance.orderTokenToEth(16, ZAddress, 10000, false, {
          from: seller1,
        });
        await exchangeInstance.orderTokenToEth(16, ZAddress, 10000, false, {
          from: seller2,
        });

        await time.advanceBlock();
        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(5);
        await exchangeInstance.sendMarketFeeToLien({from: factory});

        await exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer1,
          value: 20000,
        });
        await exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer2,
          value: 20000,
        });
        await exchangeInstance.orderTokenToEth(16, ZAddress, 10000, false, {
          from: seller1,
        });
        await exchangeInstance.orderTokenToEth(16, ZAddress, 10000, false, {
          from: seller2,
        });
        await time.advanceBlock();
        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(5);
        await exchangeInstance.sendMarketFeeToLien({from: factory});

        let ethBalance = await web3.eth.getBalance(lientokenInstance.address);
        assert.equal(
          ethBalance,
          45,
          "Invalid eth amount lientoken will receive"
        );
        let balance = await tokenInstance.balanceOf.call(
          lientokenInstance.address
        );
        assert.equal(balance, 21, "Invalid idol amount lientoken will receive");
      });

      it("transfer market fee to lien, when there is no market fee", async () => {
        await exchangeInstance.initializeExchange(6000000, initialShare, {
          from: LP1,
          value: 9000000,
        });
        await time.advanceBlock();
        await time.advanceBlock();
        await exchangeInstance.sendMarketFeeToLien({from: factory});
        let ethBalance = await web3.eth.getBalance(lientokenInstance.address);
        assert.equal(
          ethBalance,
          0,
          "Invalid eth amount lientoken will receive"
        );
        let balance = await tokenInstance.balanceOf.call(
          lientokenInstance.address
        );
        assert.equal(balance, 0, "Invalid idol amount lientoken will receive");
      });
    });

    describe("eth transfer", function () {
      it("eth balance eth balance correct", async () => {
        await exchangeInstance.initializeExchange(1000000, initialShare, {
          from: LP1,
          value: 1000000,
        });

        await exchangeInstance.orderTokenToEth(10, ZAddress, 10000, false, {
          from: LP1,
        });

        await exchangeInstance.executeUnexecutedBox(2);
        let ethBalance = await exchangeInstance.getETHBalance.call(LP1);
        assert.equal(ethBalance.toString(), "9871");
      });

      it("should revert transfer eth if msg.sender has no receive function", async () => {
        await exchangeInstance.initializeExchange(60000, initialShare, {
          from: LP1,
          value: 90000,
        });
        let getETHInstance = await getETH.new();
        await getETHInstance.sendTransaction({
          from: factory,
          value: 90000,
        });
        await tokenInstance.transfer(getETHInstance.address, 60000);
        await getETHInstance.addLiquidityETH(
          tokenInstance.address,
          exchangeInstance.address
        );
        await expectRevert.unspecified(
          getETHInstance.removeLiquidityETH(exchangeInstance.address)
        );
      });
    });
  });
});
