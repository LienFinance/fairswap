const DECIMAL = 1000000000000000000;
const ZAddress = "0x0000000000000000000000000000000000000000";
// start local chain with $ ganache-cli -b 3 to process "Promise.all(process)"
const {time, expectRevert} = require("@openzeppelin/test-helpers");
let deploy = require("../../mine_on_interval/IDOLvsLBT/deploy_contracts.js");
const shareBurned = web3.utils.toWei("500", "ether");
const minShares = web3.utils.toWei("50", "ether");
const invBurned = web3.utils.toWei("1100", "ether");
const BoxExchange = artifacts.require("LBTBoxExchange");

contract("BoxExchange IDOL vs LBT", function (accounts) {
  describe("Test Basic Functions", function () {
    let settlementtokenInstance;
    let basetokenInstance;
    let factoryInstance;
    let lientokenInstance;
    let bondID;
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
      bondID = instances.bondID;
    });
    describe("Deploy exchange", () => {
      it("should deploy correctly", async () => {
        let _receipt = await factoryInstance.launchExchange(1, 1, 1000, 10000, {
          from: LP1,
        });
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        let exchangeAddress = await factoryInstance.addressToExchangeLookup.call(
          settlementtokenInstance.address
        );
        assert.equal(
          exchangeAddress,
          exchangeInstance.address,
          "Address of Exchange is invalid"
        );
      });

      it("should deploy correctly", async () => {
        let _receipt = await factoryInstance.launchExchange(1, 1, 1000, 10000, {
          from: LP1,
        });
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        let exchangeAddress = await factoryInstance.bondIDToExchangeLookup.call(
          web3.utils.hexToBytes(bondID)
        );
        assert.equal(
          exchangeAddress,
          exchangeInstance.address,
          "Address of Exchange is invalid"
        );
      });

      it("should revert for deploying the same LBT Exchange", async () => {
        await factoryInstance.launchExchange(1, 1, 1000, 10000, {
          from: LP1,
        });
        await expectRevert.unspecified(
          factoryInstance.launchExchange(1, 1, 1000, 10000, {
            from: LP1,
          })
        );
      });

      it("should revert if LBT address is address(0)", async () => {
        let instances = await deploy.setFakeBondMaker(accounts);
        factoryInstance = instances.factoryInstance;
        await expectRevert.unspecified(
          factoryInstance.launchExchange(1, 1, 1000, 10000, {
            from: LP1,
          })
        );
      });

      it("name of share token is correct", async () => {
        let _receipt = await factoryInstance.launchExchange(1, 1, 1000, 10000, {
          from: LP1,
        });
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);

        let name = await exchangeInstance.name();
        assert.equal(name, "SHARE-IDOL-TESTTOKEN", "Invalid share token name");
      });
    });

    describe("initialize exchange", async () => {
      it("should initialize correctly", async () => {
        let _receipt = await factoryInstance.launchExchange(1, 1, 1000, 10000, {
          from: LP1,
        });
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);

        let exchangeData = await exchangeInstance.getExchangeData.call();
        assert.equal(exchangeData[1], 1000, "Base token Pool should be 20000");
        assert.equal(
          exchangeData[2],
          10000,
          "settlement Token Pool should be 10000"
        );
        assert.equal(exchangeData[3], 1000, "TotalShares is not 1000");
      });

      it("reinitialize exchange correctly", async () => {
        let _receipt = await factoryInstance.launchExchange(
          1,
          1,
          20000,
          20000,
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
        await settlementtokenInstance.approve(
          factoryInstance.address,
          300000000,
          {
            from: LP1,
          }
        );
        await factoryInstance.initializeExchange(
          settlementtokenInstance.address,
          20000,
          20000,
          {
            from: LP1,
          }
        );
        let exchangeData = await exchangeInstance.getExchangeData.call();
        assert.equal(exchangeData[1], 20000, "idol Pool should be 20000");
        assert.equal(exchangeData[2], 20000, "LBT Pool should be 20000");
        assert.equal(exchangeData[3], 20000, "TotalShares is not 20000");
      });

      it("should revert reinitialize exchange if can not send IDOL", async () => {
        let _receipt = await factoryInstance.launchExchange(
          1,
          1,
          20000,
          20000,
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
        await settlementtokenInstance.approve(
          factoryInstance.address,
          300000000,
          {
            from: LP1,
          }
        );
        await expectRevert.unspecified(
          factoryInstance.initializeExchange(
            settlementtokenInstance.address,
            300000001,
            20000,
            {
              from: LP1,
            }
          )
        );
      });

      it("should revert reinitialize exchange if can not send ERC20", async () => {
        let _receipt = await factoryInstance.launchExchange(
          1,
          1,
          20000,
          20000,
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
        await settlementtokenInstance.approve(
          factoryInstance.address,
          300000000,
          {
            from: LP1,
          }
        );
        await expectRevert.unspecified(
          factoryInstance.initializeExchange(
            settlementtokenInstance.address,
            20000,
            300000001,
            {
              from: LP1,
            }
          )
        );
      });

      it("should revert reinitialize if share token exists", async () => {
        await factoryInstance.launchExchange(1, 1, 20000, 20000, {
          from: LP1,
        });

        await expectRevert.unspecified(
          factoryInstance.initializeExchange(
            settlementtokenInstance.address,
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
            basetokenInstance.address,
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
            basetokenInstance.address,
            3000000000,
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
            basetokenInstance.address,
            20000,
            3000000000,
            {
              from: LP1,
            }
          )
        );
      });
    });

    describe("move liquidity", async () => {
      it("Execute remove liquidity", async () => {
        let _receipt = await factoryInstance.launchExchange(1, 1, 1000, 30000, {
          from: LP1,
        });
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);

        let initialLP1Data = await exchangeInstance.balanceOf.call(LP1);
        assert.equal(initialLP1Data.valueOf(), 1000, "LP1 gets 1000 shares");
        await exchangeInstance.removeLiquidity(16, 100, 150, 500, {
          from: LP1,
        });
        await time.advanceBlock();
        let LP1Data = await exchangeInstance.balanceOf.call(LP1);
        assert.equal(LP1Data.valueOf(), 500, "LP1 burns 500 shares");
        let exchangeData = await exchangeInstance.getExchangeData.call();
        assert.equal(exchangeData[1], 500, "IDOL Pool should be 10000");
        assert.equal(exchangeData[2], 15000, "LBT Pool should be 15000");
      });

      it("Execute invest liquidity", async () => {
        let _receipt = await factoryInstance.launchExchange(1, 1, 1000, 30000, {
          from: LP1,
        });
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);

        let initialLP1Data = await exchangeInstance.balanceOf.call(LP1);
        assert.equal(initialLP1Data.valueOf(), 1000, "LP1 gets 1000 shares");
        await exchangeInstance.addLiquidity(16, 100, 3000, 10, {from: LP2});
        await time.advanceBlock();
        let LP2Data = await exchangeInstance.balanceOf.call(LP2);
        assert.equal(LP2Data.valueOf(), 100, "LP2 gets 100 shares");
        let exchangeData = await exchangeInstance.getExchangeData.call();
        assert.equal(exchangeData[1], 1100, "IDOL Pool shoul be 22000");
        assert.equal(exchangeData[2], 33000, "LBT Pool should be 33000");
      });

      it("Execute invest liquidity when LBT is under value", async () => {
        let _receipt = await factoryInstance.launchExchange(1, 1, 1000, 30000, {
          from: LP1,
        });
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);

        let initialLP1Data = await exchangeInstance.balanceOf.call(LP1);
        assert.equal(initialLP1Data.valueOf(), 1000, "LP1 gets 1000 shares");
        await exchangeInstance.addLiquidity(16, 120, 3000, 10, {from: LP2});
        await time.advanceBlock();
        let LP2Data = await exchangeInstance.balanceOf.call(LP2);
        assert.equal(LP2Data.valueOf(), 100, "LP2 gets 100 shares");
        let exchangeData = await exchangeInstance.getExchangeData.call();
        assert.equal(exchangeData[1], 1100, "IDOL Pool shoul be 22000");
        assert.equal(exchangeData[2], 33000, "LBT Pool should be 33000");
      });

      it("Execute invest liquidity when iDOL is under value", async () => {
        let _receipt = await factoryInstance.launchExchange(1, 1, 1000, 30000, {
          from: LP1,
        });
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);

        let initialLP1Data = await exchangeInstance.balanceOf.call(LP1);
        assert.equal(initialLP1Data.valueOf(), 1000, "LP1 gets 1000 shares");
        await exchangeInstance.addLiquidity(16, 100, 3300, 10, {from: LP2});
        await time.advanceBlock();
        let LP2Data = await exchangeInstance.balanceOf.call(LP2);
        assert.equal(LP2Data.valueOf(), 100, "LP2 gets 100 shares");
        let exchangeData = await exchangeInstance.getExchangeData.call();
        assert.equal(exchangeData[1], 1100, "IDOL Pool shoul be 22000");
        assert.equal(exchangeData[2], 33000, "LBT Pool should be 33000");
      });

      it("should revert invalid minshares", async () => {
        let _receipt = await factoryInstance.launchExchange(
          1,
          1,
          20000,
          10000,
          {
            from: LP1,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);

        try {
          await exchangeInstance.addLiquidity(16, 2000, 1000, shareBurned, {
            from: LP2,
          });
        } catch (err) {
          assert(err.toString().includes("revert"), err.toString());
          return;
        }
        assert(false, "should revert");
      });

      it("should revert invalid min Base token", async () => {
        let _receipt = await factoryInstance.launchExchange(
          1,
          1,
          20000,
          10000,
          {
            from: LP1,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);

        try {
          await exchangeInstance.removeLiquidity(
            16,
            100000,
            1500,
            shareBurned,
            {
              from: LP1,
            }
          );
        } catch (err) {
          assert(err.toString().includes("revert"), err.toString());
          return;
        }
        assert(false, "should revert");
      });

      it("should revert invalid min Settlement token", async () => {
        let _receipt = await factoryInstance.launchExchange(
          1,
          1,
          20000,
          10000,
          {
            from: LP1,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);
        try {
          await exchangeInstance.removeLiquidity(
            16,
            1000,
            150000,
            shareBurned,
            {
              from: LP1,
            }
          );
        } catch (err) {
          assert(err.toString().includes("revert"), err.toString());
          return;
        }
        assert(false, "should revert");
      });

      it("should revert invalid share", async () => {
        let _receipt = await factoryInstance.launchExchange(
          1,
          1,
          20000,
          10000,
          {
            from: LP1,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);
        try {
          await exchangeInstance.removeLiquidity(16, 1000, 1500, invBurned, {
            from: LP1,
          });
        } catch (err) {
          assert(err.toString().includes("revert"), err.toString());
          return;
        }
        assert(false, "should revert");
      });

      it("should revert if idol amount is 0 in orderBaseToSettlement", async () => {
        let _receipt = await factoryInstance.launchExchange(
          1,
          1,
          20000,
          10000,
          {
            from: LP1,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);
        await expectRevert.unspecified(
          exchangeInstance.orderBaseToSettlement(1, ZAddress, 0, true, {
            from: buyer1,
          })
        );
      });

      it("should revert if idol amount is 0 in orderBaseToSettlement", async () => {
        let _receipt = await factoryInstance.launchExchange(
          1,
          1,
          20000,
          10000,
          {
            from: LP1,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);
        await expectRevert.unspecified(
          exchangeInstance.orderSettlementToBase(1, ZAddress, 0, true, {
            from: seller2,
          })
        );
      });

      it("should revert if timeout in addLiquidity", async () => {
        let _receipt = await factoryInstance.launchExchange(
          1,
          1,
          20000,
          10000,
          {
            from: LP1,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);
        await exchangeInstance.orderSettlementToBase(1, ZAddress, 100, true, {
          from: seller2,
        });
        await time.advanceBlock();
        await time.advanceBlock();
        await expectRevert.unspecified(
          exchangeInstance.addLiquidity(16, 2000, 1000, shareBurned, {
            from: LP2,
          })
        );
      });

      it("should revert if timeout in removeLiquidity", async () => {
        let _receipt = await factoryInstance.launchExchange(
          1,
          1,
          20000,
          10000,
          {
            from: LP1,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);
        await exchangeInstance.orderSettlementToBase(1, ZAddress, 100, true, {
          from: seller2,
        });
        await time.advanceBlock();
        await time.advanceBlock();
        await expectRevert.unspecified(
          exchangeInstance.removeLiquidity(16, 1000, 1500, invBurned, {
            from: LP1,
          })
        );
      });

      it("should revert if timeout", async () => {
        let _receipt = await factoryInstance.launchExchange(
          1,
          1,
          20000,
          10000,
          {
            from: LP1,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);
        await exchangeInstance.orderSettlementToBase(1, ZAddress, 100, true, {
          from: seller2,
        });
        await time.advanceBlock();
        await time.advanceBlock();

        await expectRevert.unspecified(
          exchangeInstance.orderSettlementToBase(0, ZAddress, 100, true, {
            from: seller2,
          })
        );
      });

      it("should revert if timeout", async () => {
        let _receipt = await factoryInstance.launchExchange(
          1,
          1,
          20000,
          10000,
          {
            from: LP1,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);
        await exchangeInstance.orderSettlementToBase(1, ZAddress, 100, true, {
          from: seller2,
        });
        await time.advanceBlock();
        await time.advanceBlock();

        await expectRevert.unspecified(
          exchangeInstance.orderBaseToSettlement(0, ZAddress, 100, true, {
            from: buyer1,
          })
        );
      });
    });
  });
});
