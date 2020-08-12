// start local chain with $ ganache-cli -b 3 to process "Promise.all(process)"
const {time, expectRevert} = require("@openzeppelin/test-helpers");
const BoxExchange = artifacts.require("LBTBoxExchange");
const BondToken = artifacts.require("BondToken");
const getETH = artifacts.require("TestGetETH");
let deploy = require("../../mine_on_interval/IDOLvsLBT/deploy_contracts.js");
const ZAddress = "0x0000000000000000000000000000000000000000";
contract("BoxExchange IDOL vs LBT", function (accounts) {
  describe("After LBT expired", function () {
    let settlementtokenInstance;
    let basetokenInstance;
    let factoryInstance;
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
      basetokenInstance = instances.basetokenInstance;
      settlementtokenInstance = instances.settlementtokenInstance;
      lientokenInstance = instances.lientokenInstance;
      factoryInstance = instances.factoryInstance;
    });
    //if transfer ETH to settlemntTokenInstance, LBT has value of this amount.

    it("check spread for lien token", async () => {
      let _receipt = await factoryInstance.launchExchange(
        1,
        1,
        30000000,
        20000000,
        {
          from: LP1,
        }
      );
      let exchangeInstance = await BoxExchange.at(
        _receipt.logs[0].args.exchange
      );
      await deploy.approve(exchangeInstance.address, accounts);
      let process = [
        exchangeInstance.orderBaseToSettlement(16, ZAddress, 50000, false, {
          from: buyer1,
        }),
        exchangeInstance.orderBaseToSettlement(16, ZAddress, 50000, false, {
          from: buyer2,
        }),
        exchangeInstance.orderSettlementToBase(16, ZAddress, 20000, false, {
          from: seller1,
        }),
        exchangeInstance.orderSettlementToBase(16, ZAddress, 20000, false, {
          from: seller2,
        }),
      ];
      await Promise.all(process);

      await time.advanceBlock();

      await exchangeInstance.orderSettlementToBase(16, ZAddress, 300, 1, {
        from: seller2,
      });
      let tokensForLien = await exchangeInstance.marketFeePool0.call();
      assert.equal(tokensForLien, 59, "Invalid amount of idol for lien");
      tokensForLien = await exchangeInstance.marketFeePool1.call();
      assert.equal(
        tokensForLien,
        23,
        "Invalid amount of SettlementToken for lien"
      );
    });

    describe("remove liquidity after maturity", () => {
      let exchangeInstance;
      beforeEach(async () => {
        let _receipt = await factoryInstance.launchExchange(
          1,
          1,
          3000000,
          2000000,
          {
            from: LP1,
          }
        );
        exchangeInstance = await BoxExchange.at(_receipt.logs[0].args.exchange);
        await deploy.approve(exchangeInstance.address, accounts);
        await settlementtokenInstance.sendTransaction({
          from: factory,
          value: 2000000000,
        });
        await time.increase(10000000);
      });

      it("With no move of liquidity", async () => {
        let receipt = await exchangeInstance.removeAfterMaturity({
          from: LP1,
        });
        assert.equal(
          receipt.logs[2].args.ethAmount,
          2000000,
          "Invalid ETH Amount"
        );
        assert.equal(
          receipt.logs[2].args.baseTokenAmount,
          3000000,
          "Invalid iDOL Amount"
        );
        let LP1Data = await exchangeInstance.balanceOf.call(LP1);
        assert.equal(LP1Data.valueOf(), 0, "LP1 has no shares");
      });

      it("After remove liquidity partially", async () => {
        await exchangeInstance.removeLiquidity(10, 100, 100, 1500000, {
          from: LP1,
        });
        let receipt = await exchangeInstance.removeAfterMaturity({
          from: LP1,
        });
        assert.equal(
          receipt.logs[2].args.ethAmount,
          1000000,
          "Invalid ETH Amount"
        );
        assert.equal(
          receipt.logs[2].args.baseTokenAmount,
          1500000,
          "Invalid iDOL Amount"
        );
        let LP1Data = await exchangeInstance.balanceOf.call(LP1);
        assert.equal(LP1Data.valueOf(), 0, "LP1 has no shares");
      });

      it("After add liquidity", async () => {
        await exchangeInstance.addLiquidity(10, 3000000, 2000000, 100, {
          from: LP1,
        });
        let receipt = await exchangeInstance.removeAfterMaturity({
          from: LP1,
        });
        assert.equal(
          receipt.logs[2].args.ethAmount,
          4000000,
          "Invalid ETH Amount"
        );
        assert.equal(
          receipt.logs[2].args.baseTokenAmount,
          6000000,
          "Invalid iDOL Amount"
        );
        let LP1Data = await exchangeInstance.balanceOf.call(LP1);
        assert.equal(LP1Data.valueOf(), 0, "LP1 has no shares");
      });

      it("After add liquidity by other liquidity provider", async () => {
        await exchangeInstance.addLiquidity(10, 1500000, 1000000, 100, {
          from: LP2,
        });
        let receipt = await exchangeInstance.removeAfterMaturity({
          from: LP1,
        });
        assert.equal(
          receipt.logs[2].args.ethAmount,
          2000000,
          "Invalid ETH Amount"
        );
        assert.equal(
          receipt.logs[2].args.baseTokenAmount,
          3000000,
          "Invalid iDOL Amount"
        );

        receipt = await exchangeInstance.removeAfterMaturity({
          from: LP2,
        });
        assert.equal(
          receipt.logs[2].args.ethAmount,
          999000,
          "Invalid ETH Amount"
        );
        assert.equal(
          receipt.logs[2].args.baseTokenAmount,
          1500000,
          "Invalid iDOL Amount"
        );
      });

      it("should revert if LBT not expired", async () => {
        await settlementtokenInstance.changeExpiredFlag();
        await expectRevert.unspecified(
          exchangeInstance.removeAfterMaturity({
            from: LP1,
          })
        );
      });
    });

    describe("transfer spread to Lien Token", () => {
      let exchangeInstance;
      beforeEach(async () => {
        let _receipt = await factoryInstance.launchExchange(
          1,
          1,
          30000000,
          20000000,
          {
            from: LP1,
          }
        );
        exchangeInstance = await BoxExchange.at(_receipt.logs[0].args.exchange);
        await deploy.approve(exchangeInstance.address, accounts);

        await settlementtokenInstance.sendTransaction({
          from: factory,
          value: 2000000000,
        });
      });

      it("Exchange has market fee in both token", async () => {
        await exchangeInstance.orderBaseToSettlement(
          16,
          ZAddress,
          150000,
          false,
          {
            from: buyer1,
          }
        );
        await exchangeInstance.orderBaseToSettlement(
          16,
          ZAddress,
          150000,
          false,
          {
            from: buyer2,
          }
        );
        await exchangeInstance.orderSettlementToBase(
          16,
          ZAddress,
          100000,
          false,
          {
            from: seller1,
          }
        );
        await exchangeInstance.orderSettlementToBase(
          16,
          ZAddress,
          100000,
          false,
          {
            from: seller2,
          }
        );
        await time.increase(10000000);
        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(4);
        await exchangeInstance.sendMarketFeeToLien({from: factory});

        await time.advanceBlock();
        let ethBalance = await web3.eth.getBalance(lientokenInstance.address);
        assert.equal(ethBalance, 119, "ETH send to Lien token is invalid");
        let balance = await basetokenInstance.balanceOf.call(
          lientokenInstance.address
        );
        assert.equal(balance, 179, "baseToken send to Lien token is invalid");
      });

      it("call send market fee twice", async () => {
        await exchangeInstance.orderBaseToSettlement(
          16,
          ZAddress,
          300000,
          false,
          {
            from: buyer1,
          }
        );
        await exchangeInstance.orderSettlementToBase(
          16,
          ZAddress,
          200000,
          false,
          {
            from: seller1,
          }
        );
        await time.increase(10000000);
        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(4);
        await exchangeInstance.sendMarketFeeToLien({from: factory});

        await exchangeInstance.orderBaseToSettlement(
          16,
          ZAddress,
          300000,
          false,
          {
            from: buyer1,
          }
        );
        await exchangeInstance.orderSettlementToBase(
          16,
          ZAddress,
          200000,
          false,
          {
            from: seller1,
          }
        );
        await time.increase(10000000);
        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(4);
        await exchangeInstance.sendMarketFeeToLien({from: factory});

        await time.advanceBlock();
        let ethBalance = await web3.eth.getBalance(lientokenInstance.address);
        assert.equal(ethBalance, 237, "ETH send to Lien token is invalid");
        let balance = await basetokenInstance.balanceOf.call(
          lientokenInstance.address
        );
        assert.equal(balance, 358, "idol send to Lien token is invalid");
      });

      it("Exchange has no market fee", async () => {
        await time.increase(10000000);
        await exchangeInstance.sendMarketFeeToLien({from: factory});

        await time.advanceBlock();
        let ethBalance = await web3.eth.getBalance(lientokenInstance.address);
        assert.equal(ethBalance, 0, "ETH send to Lien token is invalid");
        let balance = await basetokenInstance.balanceOf.call(
          lientokenInstance.address
        );
        assert.equal(balance, 0, "idol send to Lien token is invalid");
      });

      it("Exchange has market fee only in iDOL", async () => {
        await exchangeInstance.orderBaseToSettlement(
          16,
          ZAddress,
          150000,
          false,
          {
            from: buyer1,
          }
        );
        await exchangeInstance.orderBaseToSettlement(
          16,
          ZAddress,
          150000,
          false,
          {
            from: buyer2,
          }
        );
        await time.advanceBlock();
        await time.advanceBlock();
        await time.increase(10000000);
        await exchangeInstance.executeUnexecutedBox(4);
        await exchangeInstance.sendMarketFeeToLien({from: factory});

        await time.advanceBlock();
        let ethBalance = await web3.eth.getBalance(lientokenInstance.address);
        assert.equal(ethBalance, 0, "ETH send to Lien token is invalid");
        let balance = await basetokenInstance.balanceOf.call(
          lientokenInstance.address
        );
        assert.equal(balance, 179, "idol send to Lien token is invalid");
      });
      it("Exchange has market fee only in LBT", async () => {
        await exchangeInstance.orderSettlementToBase(
          16,
          ZAddress,
          100000,
          false,
          {
            from: seller1,
          }
        ),
          await exchangeInstance.orderSettlementToBase(
            16,
            ZAddress,
            100000,
            false,
            {
              from: seller2,
            }
          ),
          await time.increase(10000000);
        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(4);
        await exchangeInstance.sendMarketFeeToLien({from: factory});
        let ethBalance = await web3.eth.getBalance(lientokenInstance.address);
        assert.equal(ethBalance, 119, "ETH send to Lien token is invalid");
        let balance = await basetokenInstance.balanceOf.call(
          lientokenInstance.address
        );
        assert.equal(balance, 0, "idol send to Lien token is invalid");
      });
    });

    describe("If LBT has no value", () => {
      it("receive only iDOL if LBT has no value", async () => {
        let _receipt = await factoryInstance.launchExchange(
          1,
          1,
          3000000,
          2000000,
          {
            from: LP1,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);

        await time.increase(10000000);
        let receipt = await exchangeInstance.removeAfterMaturity({
          from: LP1,
        });
        assert.equal(receipt.logs[2].args.ethAmount, 0, "Invalid ETH Amount");
        assert.equal(
          receipt.logs[2].args.baseTokenAmount,
          3000000,
          "Invalid iDOL Amount"
        );
        let LP1Data = await exchangeInstance.balanceOf.call(LP1);
        assert.equal(LP1Data.valueOf(), 0, "LP1 should have no shares");
      });

      it("Transfer spread", async () => {
        let _receipt = await factoryInstance.launchExchange(
          1,
          1,
          30000000,
          20000000,
          {
            from: LP1,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);

        await time.increase(10000000);

        await exchangeInstance.orderBaseToSettlement(
          16,
          ZAddress,
          150000,
          false,
          {
            from: buyer1,
          }
        );
        await exchangeInstance.orderBaseToSettlement(
          16,
          ZAddress,
          150000,
          false,
          {
            from: buyer2,
          }
        );
        await exchangeInstance.orderSettlementToBase(
          16,
          ZAddress,
          100000,
          false,
          {
            from: seller1,
          }
        );
        await exchangeInstance.orderSettlementToBase(
          16,
          ZAddress,
          100000,
          false,
          {
            from: seller2,
          }
        );

        await time.advanceBlock();
        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(5);
        await exchangeInstance.sendMarketFeeToLien({from: factory});

        let ethBalance = await web3.eth.getBalance(lientokenInstance.address);
        assert.equal(ethBalance, 0, "ETH send to Lien token is invalid");
        let balance = await basetokenInstance.balanceOf.call(
          lientokenInstance.address
        );
        assert.equal(balance, 179, "idol send to Lien token is invalid");
      });
    });

    it("should revert if send spread before maturity", async () => {
      let _receipt = await factoryInstance.launchExchange(
        1,
        1,
        3000000,
        2000000,
        {
          from: LP1,
        }
      );
      let exchangeInstance = await BoxExchange.at(
        _receipt.logs[0].args.exchange
      );
      await deploy.approve(exchangeInstance.address, accounts);

      await settlementtokenInstance.sendTransaction({
        from: factory,
        value: 1000000000,
      });

      await exchangeInstance.orderBaseToSettlement(
        16,
        ZAddress,
        150000,
        false,
        {
          from: buyer1,
        }
      );
      await exchangeInstance.orderBaseToSettlement(
        16,
        ZAddress,
        150000,
        false,
        {
          from: buyer2,
        }
      );
      await exchangeInstance.orderSettlementToBase(
        16,
        ZAddress,
        100000,
        false,
        {
          from: seller1,
        }
      );
      await exchangeInstance.orderSettlementToBase(
        16,
        ZAddress,
        100000,
        false,
        {
          from: seller2,
        }
      );
      await time.advanceBlock();
      await exchangeInstance.executeUnexecutedBox(5);

      await expectRevert.unspecified(
        exchangeInstance.sendMarketFeeToLien({from: factory})
      );
    });

    it("should revert removeaftermaturity if msg.sender has no receive function", async () => {
      let _receipt = await factoryInstance.launchExchange(1, 1, 30000, 20000, {
        from: LP1,
      });
      let exchangeInstance = await BoxExchange.at(
        _receipt.logs[0].args.exchange
      );
      let getETHInstance = await getETH.new();
      await settlementtokenInstance.transfer(getETHInstance.address, 20000);
      await basetokenInstance.transfer(getETHInstance.address, 30000);
      await getETHInstance.addLiquidityLBT(
        basetokenInstance.address,
        settlementtokenInstance.address,
        exchangeInstance.address
      );
      await expectRevert.unspecified(
        getETHInstance.removeAfterMaturityLBT(exchangeInstance.address)
      );
    });

    it("should revert if sender is not settlement token", async () => {
      let _receipt = await factoryInstance.launchExchange(1, 1, 30000, 20000, {
        from: LP1,
      });
      let exchangeInstance = await BoxExchange.at(
        _receipt.logs[0].args.exchange
      );
      await deploy.approve(exchangeInstance.address, accounts);
      await settlementtokenInstance.sendTransaction({
        from: factory,
        value: 1000000000,
      });
      await expectRevert.unspecified(
        exchangeInstance.sendTransaction({
          from: factory,
          value: 1000000000,
        })
      );
    });

    it("should revert if LBT not expired", async () => {
      let _receipt = await factoryInstance.launchExchange(1, 1, 30000, 20000, {
        from: LP1,
      });
      let exchangeInstance = await BoxExchange.at(
        _receipt.logs[0].args.exchange
      );
      await deploy.approve(exchangeInstance.address, accounts);
      await settlementtokenInstance.changeExpiredFlag();
      await exchangeInstance.orderBaseToSettlement(
        16,
        ZAddress,
        150000,
        false,
        {
          from: buyer2,
        }
      );
      await exchangeInstance.orderSettlementToBase(
        16,
        ZAddress,
        100000,
        false,
        {
          from: seller1,
        }
      );

      await time.advanceBlock();
      await exchangeInstance.executeUnexecutedBox(5);
      await time.increase(10000000);
      await expectRevert.unspecified(
        exchangeInstance.sendMarketFeeToLien({from: factory})
      );
    });

    it("should revert if try to send marker fee before maturity", async () => {
      let _receipt = await factoryInstance.launchExchange(1, 1, 30000, 20000, {
        from: LP1,
      });
      let exchangeInstance = await BoxExchange.at(
        _receipt.logs[0].args.exchange
      );
      await deploy.approve(exchangeInstance.address, accounts);
      await settlementtokenInstance.sendTransaction({
        from: factory,
        value: 1000000000,
      });
      await expectRevert.unspecified(
        exchangeInstance.sendMarketFeeToLien({from: factory})
      );
    });
  });
  describe("Combine test with BondToken Contract", async () => {
    let settlementtokenInstance;
    let basetokenInstance;
    let factoryInstance;
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
      let instances = await deploy.setbondtoken(accounts);
      basetokenInstance = instances.basetokenInstance;
      settlementtokenInstance = instances.settlementtokenInstance;
      lientokenInstance = instances.lientokenInstance;
      factoryInstance = instances.factoryInstance;
    });
    it("check spread for lien token", async () => {
      let _receipt = await factoryInstance.launchExchange(
        1,
        1,
        30000000,
        20000000,
        {
          from: LP1,
        }
      );
      let exchangeInstance = await BoxExchange.at(
        _receipt.logs[0].args.exchange
      );
      await deploy.approve(exchangeInstance.address, accounts);
      let process = [
        exchangeInstance.orderBaseToSettlement(16, ZAddress, 50000, false, {
          from: LP1,
        }),
        exchangeInstance.orderBaseToSettlement(16, ZAddress, 50000, false, {
          from: LP2,
        }),
        exchangeInstance.orderSettlementToBase(16, ZAddress, 20000, false, {
          from: LP1,
        }),
        exchangeInstance.orderSettlementToBase(16, ZAddress, 20000, false, {
          from: LP2,
        }),
      ];
      await Promise.all(process);

      await time.advanceBlock();

      await exchangeInstance.orderSettlementToBase(16, ZAddress, 300, 1, {
        from: LP2,
      });
      let tokensForLien = await exchangeInstance.marketFeePool0.call();
      assert.equal(tokensForLien, 59, "Invalid amount of idol for lien");
      tokensForLien = await exchangeInstance.marketFeePool1.call();
      assert.equal(
        tokensForLien,
        23,
        "Invalid amount of SettlementToken for lien"
      );
    });

    describe("remove liquidity after maturity", () => {
      let exchangeInstance;
      beforeEach(async () => {
        let _receipt = await factoryInstance.launchExchange(
          1,
          1,
          3000000,
          2000000,
          {
            from: LP1,
          }
        );
        exchangeInstance = await BoxExchange.at(_receipt.logs[0].args.exchange);
        await deploy.approve(exchangeInstance.address, accounts);
        await time.increase(10000000);
      });

      it("With no move of liquidity", async () => {
        await settlementtokenInstance.expire(1, 10);
        let receipt = await exchangeInstance.removeAfterMaturity({
          from: LP1,
        });

        assert.equal(
          receipt.logs[3].args.ethAmount,
          2000000000000000,
          "Invalid ETH Amount"
        );
        assert.equal(
          receipt.logs[3].args.baseTokenAmount,
          3000000,
          "Invalid iDOL Amount"
        );
        let LP1Data = await exchangeInstance.balanceOf.call(LP1);
        assert.equal(LP1Data.valueOf(), 0, "LP1 has no shares");
      });

      it("After remove liquidity partially", async () => {
        await settlementtokenInstance.expire(1, 10);
        await exchangeInstance.removeLiquidity(10, 100, 100, 1500000, {
          from: LP1,
        });
        let receipt = await exchangeInstance.removeAfterMaturity({
          from: LP1,
        });

        assert.equal(
          receipt.logs[3].args.ethAmount,
          1000000000000000,
          "Invalid ETH Amount"
        );
        assert.equal(
          receipt.logs[3].args.baseTokenAmount,
          1500000,
          "Invalid iDOL Amount"
        );
        let LP1Data = await exchangeInstance.balanceOf.call(LP1);
        assert.equal(LP1Data.valueOf(), 0, "LP1 has no shares");
      });

      it("After add liquidity", async () => {
        await settlementtokenInstance.expire(1, 10);
        await exchangeInstance.addLiquidity(10, 3000000, 2000000, 100, {
          from: LP1,
        });
        let receipt = await exchangeInstance.removeAfterMaturity({
          from: LP1,
        });

        assert.equal(
          receipt.logs[3].args.ethAmount,
          4000000000000000,
          "Invalid ETH Amount"
        );
        assert.equal(
          receipt.logs[3].args.baseTokenAmount,
          6000000,
          "Invalid iDOL Amount"
        );
        let LP1Data = await exchangeInstance.balanceOf.call(LP1);
        assert.equal(LP1Data.valueOf(), 0, "LP1 has no shares");
      });

      it("After add liquidity by other liquidity provider", async () => {
        await settlementtokenInstance.expire(1, 10);
        await exchangeInstance.addLiquidity(10, 1500000, 1000000, 100, {
          from: LP2,
        });
        let receipt = await exchangeInstance.removeAfterMaturity({
          from: LP1,
        });

        assert.equal(
          receipt.logs[3].args.ethAmount,
          2000000000000000,
          "Invalid ETH Amount"
        );
        assert.equal(
          receipt.logs[3].args.baseTokenAmount,
          3000000,
          "Invalid iDOL Amount"
        );

        receipt = await exchangeInstance.removeAfterMaturity({
          from: LP2,
        });

        assert.equal(
          receipt.logs[3].args.ethAmount,
          1000000000000000,
          "Invalid ETH Amount"
        );
        assert.equal(
          receipt.logs[3].args.baseTokenAmount,
          1500000,
          "Invalid iDOL Amount"
        );
      });

      it("should revert if LBT not expired", async () => {
        await expectRevert.unspecified(
          exchangeInstance.removeAfterMaturity({
            from: LP1,
          })
        );
      });
    });

    describe("transfer spread to Lien Token", () => {
      let exchangeInstance;
      beforeEach(async () => {
        let _receipt = await factoryInstance.launchExchange(
          1,
          1,
          30000000,
          20000000,
          {
            from: LP1,
          }
        );
        exchangeInstance = await BoxExchange.at(_receipt.logs[0].args.exchange);
        await deploy.approve(exchangeInstance.address, accounts);
      });

      it("Exchange has market fee in both token", async () => {
        await settlementtokenInstance.expire(1, 10);
        await exchangeInstance.orderBaseToSettlement(
          16,
          ZAddress,
          150000,
          false,
          {
            from: LP1,
          }
        );
        await exchangeInstance.orderBaseToSettlement(
          16,
          ZAddress,
          150000,
          false,
          {
            from: LP2,
          }
        );
        await exchangeInstance.orderSettlementToBase(
          16,
          ZAddress,
          100000,
          false,
          {
            from: LP1,
          }
        );
        await exchangeInstance.orderSettlementToBase(
          16,
          ZAddress,
          100000,
          false,
          {
            from: LP2,
          }
        );
        await time.increase(10000000);
        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(4);
        await exchangeInstance.sendMarketFeeToLien({from: factory});

        await time.advanceBlock();
        let ethBalance = await web3.eth.getBalance(lientokenInstance.address);
        assert.equal(
          ethBalance,
          119000000000,
          "ETH send to Lien token is invalid"
        );
        let balance = await basetokenInstance.balanceOf.call(
          lientokenInstance.address
        );
        assert.equal(balance, 179, "baseToken send to Lien token is invalid");
      });

      it("call send market fee twice", async () => {
        await settlementtokenInstance.expire(1, 10);
        await exchangeInstance.orderBaseToSettlement(
          16,
          ZAddress,
          300000,
          false,
          {
            from: LP1,
          }
        );
        await exchangeInstance.orderSettlementToBase(
          16,
          ZAddress,
          200000,
          false,
          {
            from: LP1,
          }
        );
        await time.increase(10000000);
        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(4);
        await exchangeInstance.sendMarketFeeToLien({from: factory});

        await exchangeInstance.orderBaseToSettlement(
          16,
          ZAddress,
          300000,
          false,
          {
            from: LP1,
          }
        );
        await exchangeInstance.orderSettlementToBase(
          16,
          ZAddress,
          200000,
          false,
          {
            from: LP1,
          }
        );
        await time.increase(10000000);
        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(4);
        await exchangeInstance.sendMarketFeeToLien({from: factory});

        await time.advanceBlock();
        let ethBalance = await web3.eth.getBalance(lientokenInstance.address);
        assert.equal(
          ethBalance,
          238000000000,
          "ETH send to Lien token is invalid"
        );

        let balance = await basetokenInstance.balanceOf.call(
          lientokenInstance.address
        );
        assert.equal(balance, 358, "idol send to Lien token is invalid");
      });

      it("Exchange has no market fee", async () => {
        await settlementtokenInstance.expire(1, 10);
        await time.increase(10000000);

        await exchangeInstance.sendMarketFeeToLien({from: factory});

        await time.advanceBlock();
        let ethBalance = await web3.eth.getBalance(lientokenInstance.address);
        assert.equal(ethBalance, 0, "ETH send to Lien token is invalid");
        let balance = await basetokenInstance.balanceOf.call(
          lientokenInstance.address
        );
        assert.equal(balance, 0, "idol send to Lien token is invalid");
      });

      it("Exchange has market fee only in iDOL", async () => {
        await settlementtokenInstance.expire(1, 10);
        await exchangeInstance.orderBaseToSettlement(
          16,
          ZAddress,
          150000,
          false,
          {
            from: LP1,
          }
        );
        await exchangeInstance.orderBaseToSettlement(
          16,
          ZAddress,
          150000,
          false,
          {
            from: LP2,
          }
        );
        await time.advanceBlock();
        await time.advanceBlock();
        await time.increase(10000000);
        await exchangeInstance.executeUnexecutedBox(4);
        await exchangeInstance.sendMarketFeeToLien({from: factory});

        await time.advanceBlock();
        let ethBalance = await web3.eth.getBalance(lientokenInstance.address);
        assert.equal(ethBalance, 0, "ETH send to Lien token is invalid");
        let balance = await basetokenInstance.balanceOf.call(
          lientokenInstance.address
        );
        assert.equal(balance, 179, "idol send to Lien token is invalid");
      });

      it("Exchange has market fee only in LBT", async () => {
        await settlementtokenInstance.expire(1, 10);
        await exchangeInstance.orderSettlementToBase(
          16,
          ZAddress,
          100000,
          false,
          {
            from: LP1,
          }
        ),
          await exchangeInstance.orderSettlementToBase(
            16,
            ZAddress,
            100000,
            false,
            {
              from: LP2,
            }
          ),
          await time.increase(10000000);
        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(4);
        await exchangeInstance.sendMarketFeeToLien({from: factory});
        let ethBalance = await web3.eth.getBalance(lientokenInstance.address);
        assert.equal(
          ethBalance,
          119000000000,
          "ETH send to Lien token is invalid"
        );
        let balance = await basetokenInstance.balanceOf.call(
          lientokenInstance.address
        );
        assert.equal(balance, 0, "idol send to Lien token is invalid");
      });
    });

    describe("If LBT has no value", () => {
      it("receive only iDOL if LBT has no value", async () => {
        await settlementtokenInstance.expire(0, 1);
        let _receipt = await factoryInstance.launchExchange(
          1,
          1,
          3000000,
          2000000,
          {
            from: LP1,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);

        await time.increase(10000000);
        let receipt = await exchangeInstance.removeAfterMaturity({
          from: LP1,
        });
        assert.equal(receipt.logs[3].args.ethAmount, 0, "Invalid ETH Amount");
        assert.equal(
          receipt.logs[3].args.baseTokenAmount,
          3000000,
          "Invalid iDOL Amount"
        );
        let LP1Data = await exchangeInstance.balanceOf.call(LP1);
        assert.equal(LP1Data.valueOf(), 0, "LP1 should have no shares");
      });

      it("Transfer spread", async () => {
        await settlementtokenInstance.expire(0, 1);
        let _receipt = await factoryInstance.launchExchange(
          1,
          1,
          30000000,
          20000000,
          {
            from: LP1,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);

        await time.increase(10000000);

        await exchangeInstance.orderBaseToSettlement(
          16,
          ZAddress,
          150000,
          false,
          {
            from: LP1,
          }
        );
        await exchangeInstance.orderBaseToSettlement(
          16,
          ZAddress,
          150000,
          false,
          {
            from: LP2,
          }
        );
        await exchangeInstance.orderSettlementToBase(
          16,
          ZAddress,
          100000,
          false,
          {
            from: LP1,
          }
        );
        await exchangeInstance.orderSettlementToBase(
          16,
          ZAddress,
          100000,
          false,
          {
            from: LP2,
          }
        );

        await time.advanceBlock();
        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(5);
        await exchangeInstance.sendMarketFeeToLien({from: factory});

        let ethBalance = await web3.eth.getBalance(lientokenInstance.address);
        assert.equal(ethBalance, 0, "ETH send to Lien token is invalid");
        let balance = await basetokenInstance.balanceOf.call(
          lientokenInstance.address
        );
        assert.equal(balance, 179, "idol send to Lien token is invalid");
      });
    });

    it("should revert if send spread before maturity", async () => {
      await settlementtokenInstance.expire(1, 10);
      let _receipt = await factoryInstance.launchExchange(
        1,
        1,
        3000000,
        2000000,
        {
          from: LP1,
        }
      );
      let exchangeInstance = await BoxExchange.at(
        _receipt.logs[0].args.exchange
      );
      await deploy.approve(exchangeInstance.address, accounts);

      await exchangeInstance.orderBaseToSettlement(
        16,
        ZAddress,
        150000,
        false,
        {
          from: LP1,
        }
      );
      await exchangeInstance.orderBaseToSettlement(
        16,
        ZAddress,
        150000,
        false,
        {
          from: LP2,
        }
      );
      await exchangeInstance.orderSettlementToBase(
        16,
        ZAddress,
        100000,
        false,
        {
          from: LP1,
        }
      );
      await exchangeInstance.orderSettlementToBase(
        16,
        ZAddress,
        100000,
        false,
        {
          from: LP2,
        }
      );
      await time.advanceBlock();
      await exchangeInstance.executeUnexecutedBox(5);

      await expectRevert.unspecified(
        exchangeInstance.sendMarketFeeToLien({from: factory})
      );
    });

    it("should revert removeaftermaturity if msg.sender has no receive function", async () => {
      await settlementtokenInstance.expire(1, 10);
      let _receipt = await factoryInstance.launchExchange(1, 1, 30000, 20000, {
        from: LP1,
      });
      let exchangeInstance = await BoxExchange.at(
        _receipt.logs[0].args.exchange
      );
      let getETHInstance = await getETH.new();
      await settlementtokenInstance.transfer(getETHInstance.address, 20000);
      await basetokenInstance.transfer(getETHInstance.address, 30000);
      await getETHInstance.addLiquidityLBT(
        basetokenInstance.address,
        settlementtokenInstance.address,
        exchangeInstance.address
      );
      await expectRevert.unspecified(
        getETHInstance.removeAfterMaturityLBT(exchangeInstance.address)
      );
    });

    it("should revert if sender is not settlement token", async () => {
      await settlementtokenInstance.expire(1, 10);
      let _receipt = await factoryInstance.launchExchange(1, 1, 30000, 20000, {
        from: LP1,
      });
      let exchangeInstance = await BoxExchange.at(
        _receipt.logs[0].args.exchange
      );
      await deploy.approve(exchangeInstance.address, accounts);
      await expectRevert.unspecified(
        exchangeInstance.sendTransaction({
          from: factory,
          value: 1000000000,
        })
      );
    });

    it("should revert if LBT not expired", async () => {
      let _receipt = await factoryInstance.launchExchange(1, 1, 30000, 20000, {
        from: LP1,
      });
      let exchangeInstance = await BoxExchange.at(
        _receipt.logs[0].args.exchange
      );
      await deploy.approve(exchangeInstance.address, accounts);
      await exchangeInstance.orderBaseToSettlement(
        16,
        ZAddress,
        150000,
        false,
        {
          from: LP2,
        }
      );
      await exchangeInstance.orderSettlementToBase(
        16,
        ZAddress,
        100000,
        false,
        {
          from: LP1,
        }
      );

      await time.advanceBlock();
      await exchangeInstance.executeUnexecutedBox(5);
      await time.increase(10000000);
      await expectRevert.unspecified(
        exchangeInstance.sendMarketFeeToLien({from: factory})
      );
    });

    it("should revert if try to send marker fee before maturity", async () => {
      await settlementtokenInstance.expire(1, 10);
      let _receipt = await factoryInstance.launchExchange(1, 1, 30000, 20000, {
        from: LP1,
      });
      let exchangeInstance = await BoxExchange.at(
        _receipt.logs[0].args.exchange
      );
      await deploy.approve(exchangeInstance.address, accounts);
      await expectRevert.unspecified(
        exchangeInstance.sendMarketFeeToLien({from: factory})
      );
    });
  });
});
