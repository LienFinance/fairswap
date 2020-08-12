const BoxExchange = artifacts.require("LienBoxExchange");
const TestToken = artifacts.require("TestToken");
const Factory = artifacts.require("ERC20ExchangeFactory");
const Calculator = artifacts.require("PriceCalculator");
const TestOracle = artifacts.require("TestOracle");
const SpreadCalculator = artifacts.require("SpreadCalculator");
const {
  expectEvent,
  expectRevert,
  BN,
  time,
} = require("@openzeppelin/test-helpers");
const ZAddress = "0x0000000000000000000000000000000000000000";

contract("BoxExchange IDOL vs ERC20", function (accounts) {
  describe("test for factory and exchange", function () {
    let factoryInstance;
    let basetokenInstance;
    let tokenInstance;
    let oracleInstance;
    let lientokenInstance;
    const [factory, buyer1, buyer2, seller1, seller2, LP1, LP2] = accounts;
    //console.log(bondId);
    beforeEach(async () => {
      basetokenInstance = await TestToken.new();
      tokenInstance = await TestToken.new();
      lientokenInstance = await TestToken.new();
      let calcInterface = await Calculator.new();
      let spreadCalc = await SpreadCalculator.new();
      factoryInstance = await Factory.new(
        basetokenInstance.address,
        lientokenInstance.address,
        calcInterface.address,
        spreadCalc.address
      );
      oracleInstance = await TestOracle.new();
      await basetokenInstance.mintToken(20000000000, {from: factory});
      await tokenInstance.mintToken(20000000000, {from: factory});

      await basetokenInstance.transfer(LP1, 600000000, {from: factory});
      await basetokenInstance.transfer(LP2, 300000000, {from: factory});
      await basetokenInstance.transfer(buyer1, 300000000, {from: factory});
      await basetokenInstance.transfer(buyer2, 300000000, {from: factory});
      await basetokenInstance.approve(factoryInstance.address, 300000000, {
        from: LP1,
      });
      //console.log(exchangeInstance.address);
      await tokenInstance.transfer(LP1, 600000000, {from: factory});
      await tokenInstance.transfer(LP2, 300000000, {from: factory});
      await tokenInstance.transfer(seller1, 300000000, {from: factory});
      await tokenInstance.transfer(seller2, 300000000, {from: factory});
      await tokenInstance.approve(factoryInstance.address, 300000000, {
        from: LP1,
      });
    });
    describe("launch Exchange", async () => {
      it("should deploy correctly", async () => {
        let _receipt = await factoryInstance.launchExchange(
          tokenInstance.address,
          20000,
          20000,
          20000,
          oracleInstance.address,
          {
            from: LP1,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        console.log("token0 address ", await exchangeInstance.token.call());
        let exchangeAddress = await factoryInstance.tokenToExchangeLookup.call(
          tokenInstance.address,
          oracleInstance.address
        );
        assert.equal(
          exchangeAddress,
          exchangeInstance.address,
          "Address of Exchange is invalid"
        );
      });

      it("name of share token is correct", async () => {
        let _receipt = await factoryInstance.launchExchange(
          tokenInstance.address,
          20000,
          20000,
          20000,
          ZAddress,
          {
            from: LP1,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        let name = await exchangeInstance.name();
        //console.log(name);
        assert.equal(name, "SHARE-IDOL-TESTTOKEN", "Invalid share token name");
      });

      it("should revert launchExchange if exchange already exists", async () => {
        await factoryInstance.launchExchange(
          tokenInstance.address,
          20000,
          20000,
          20000,
          oracleInstance.address,
          {
            from: LP1,
          }
        );
        await expectRevert.unspecified(
          factoryInstance.launchExchange(
            tokenInstance.address,
            40000,
            40000,
            20000,
            oracleInstance.address,
            {
              from: LP1,
            }
          )
        );
      });

      it("should revert launchExchange if token is address(0)", async () => {
        await expectRevert.unspecified(
          factoryInstance.launchExchange(
            ZAddress,
            40000,
            40000,
            20000,
            oracleInstance.address,
            {
              from: LP1,
            }
          )
        );
      });

      it("should revert launchExchange if token is factory address", async () => {
        await expectRevert.unspecified(
          factoryInstance.launchExchange(
            factoryInstance.address,
            40000,
            40000,
            20000,
            oracleInstance.address,
            {
              from: LP1,
            }
          )
        );
      });
    });
    describe("reinitialize exchange", async () => {
      it("reinitialize exchange correctly", async () => {
        let _receipt = await factoryInstance.launchExchange(
          tokenInstance.address,
          20000,
          20000,
          20000,
          ZAddress,
          {
            from: LP1,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await exchangeInstance.removeLiquidity(10, 0, 0, 20000, {from: LP1});
        await basetokenInstance.approve(factoryInstance.address, 300000000, {
          from: LP1,
        });
        await tokenInstance.approve(factoryInstance.address, 300000000, {
          from: LP1,
        });
        await factoryInstance.initializeExchange(
          tokenInstance.address,
          ZAddress,
          20000,
          20000,
          20000,
          {
            from: LP1,
          }
        );
        let exchangeData = await exchangeInstance.getExchangeData.call();
        assert.equal(exchangeData[1], 20000, "IDOL reserve should be 20000");
        assert.equal(exchangeData[2], 20000, "Token reserve should be 20000");
        assert.equal(exchangeData[3], 20000, "TotalShares is not 20000");
      });

      it("should revert reinitialize exchange if can not send IDOL", async () => {
        let _receipt = await factoryInstance.launchExchange(
          tokenInstance.address,
          20000,
          20000,
          20000,
          ZAddress,
          {
            from: LP1,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await exchangeInstance.removeLiquidity(10, 0, 0, 20000, {from: LP1});
        await basetokenInstance.approve(factoryInstance.address, 300000000, {
          from: LP1,
        });
        await tokenInstance.approve(factoryInstance.address, 300000000, {
          from: LP1,
        });
        await expectRevert.unspecified(
          factoryInstance.initializeExchange(
            ZAddress,
            ZAddress,
            300000001,
            300000000,
            20000,
            {
              from: LP1,
            }
          )
        );
      });

      it("should revert reinitialize exchange if can not send ERC20", async () => {
        let _receipt = await factoryInstance.launchExchange(
          tokenInstance.address,
          20000,
          20000,
          20000,
          ZAddress,
          {
            from: LP1,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await exchangeInstance.removeLiquidity(10, 0, 0, 20000, {from: LP1});
        await basetokenInstance.approve(factoryInstance.address, 300000000, {
          from: LP1,
        });
        await tokenInstance.approve(factoryInstance.address, 300000000, {
          from: LP1,
        });
        await expectRevert.unspecified(
          factoryInstance.initializeExchange(
            ZAddress,
            ZAddress,
            300000000,
            300000001,
            20000,
            {
              from: LP1,
            }
          )
        );
      });

      it("should revert reinitialize if share token exists", async () => {
        await factoryInstance.launchExchange(
          tokenInstance.address,
          20000,
          20000,
          20000,
          ZAddress,
          {
            from: LP1,
          }
        );

        await expectRevert.unspecified(
          factoryInstance.initializeExchange(
            ZAddress,
            ZAddress,
            20000,
            20000,
            20000,
            {
              from: LP1,
            }
          )
        );
      });

      it("should revert for unexisting exchange", async () => {
        await expectRevert.unspecified(
          factoryInstance.initializeExchange(
            ZAddress,
            ZAddress,
            20000,
            20000,
            20000,
            {
              from: LP1,
            }
          )
        );
      });

      it("should revert when idol.transferfrom failed", async () => {
        await expectRevert.unspecified(
          factoryInstance.initializeExchange(
            ZAddress,
            ZAddress,
            30000000000,
            20000,
            20000,
            {
              from: LP1,
            }
          )
        );
      });

      it("should revert when token.transferfrom failed", async () => {
        await expectRevert.unspecified(
          factoryInstance.initializeExchange(
            ZAddress,
            ZAddress,
            30000000000,
            20000,
            20000,
            {
              from: LP1,
            }
          )
        );
      });
    });

    it("should deploy correctly if oracle is ZERO address", async () => {
      let _receipt = await factoryInstance.launchExchange(
        tokenInstance.address,
        20000,
        20000,
        20000,
        ZAddress,
        {
          from: LP1,
        }
      );
      let exchangeInstance = await BoxExchange.at(
        _receipt.logs[0].args.exchange
      );
      let exchangeAddress = await factoryInstance.tokenToExchangeLookup.call(
        tokenInstance.address,
        ZAddress
      );
      assert.equal(
        exchangeAddress,
        exchangeInstance.address,
        "Address of Exchange is invalid"
      );
    });

    it("return address 0 for unexist exchange", async () => {
      let _receipt = await factoryInstance.launchExchange(
        tokenInstance.address,
        20000,
        20000,
        20000,
        oracleInstance.address,
        {
          from: LP1,
        }
      );
      let exchangeInstance = await BoxExchange.at(
        _receipt.logs[0].args.exchange
      );
      let exchangeAddress = await factoryInstance.tokenToExchangeLookup.call(
        ZAddress,
        ZAddress
      );
      assert.equal(exchangeAddress, ZAddress, "Address of Exchange is invalid");
    });

    describe("market fee", async () => {
      let exchangeInstance;
      beforeEach(async () => {
        await basetokenInstance.approve(factoryInstance.address, 300000000, {
          from: LP1,
        });
        await tokenInstance.approve(factoryInstance.address, 300000000, {
          from: LP1,
        });
        let _receipt = await factoryInstance.launchExchange(
          tokenInstance.address,
          30000000,
          20000000,
          1000,
          ZAddress,
          {
            from: LP1,
          }
        );
        exchangeInstance = await BoxExchange.at(_receipt.logs[0].args.exchange);
        await basetokenInstance.approve(exchangeInstance.address, 300000000, {
          from: buyer1,
        });
        await basetokenInstance.approve(exchangeInstance.address, 300000000, {
          from: buyer2,
        });
        await tokenInstance.approve(exchangeInstance.address, 300000000, {
          from: seller1,
        });
        await tokenInstance.approve(exchangeInstance.address, 300000000, {
          from: seller2,
        });
      });
      it("check market fee for lien token", async () => {
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
        let tokensForLien = await exchangeInstance.marketFeePool0.call();

        assert.equal(tokensForLien, 3587, "Invalid amount of IDOL for lien");
      });

      it("distribute market fee to lien token", async () => {
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
        assert.equal(balance, 354, "IDOL sent to Lien token is invalid");
      });
    });
  });
});
