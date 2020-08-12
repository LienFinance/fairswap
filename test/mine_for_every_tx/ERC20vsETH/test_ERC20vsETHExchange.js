const {
  BN, // Big Number support
  expectEvent, // Assertions for emitted events
  expectRevert,
  time, // Assertions for transactions that should fail
} = require("@openzeppelin/test-helpers");
let deploy = require("../../mine_on_interval/ERC20vsETH/deploy_contracts.js");
const ZAddress = "0x0000000000000000000000000000000000000000";
const BoxExchange = artifacts.require("ERC20vsETHBoxExchange");
const initialShare = web3.utils.toWei("1", "ether");
contract("BoxExchange IDOL vs ETH", function (accounts) {
  describe("Launch Exchange", function () {
    let tokenInstance;
    let lientokenInstance;
    let factoryInstance;
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
      lientokenInstance = instances.lientokenInstance;
      factoryInstance = instances.factoryInstance;
      oracleInstance = instances.oracleInstance;
      await tokenInstance.setDecimals(18);
    });
    describe("launch exchange", async () => {
      it("should deploy correctly", async () => {
        let _receipt = await factoryInstance.launchExchange(
          tokenInstance.address,
          20000,
          initialShare,
          oracleInstance.address,
          {
            from: LP1,
            value: web3.utils.toWei("1", "ether"),
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);
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

      it("should deploy correctly if oracle is ZERO address", async () => {
        let _receipt = await factoryInstance.launchExchange(
          tokenInstance.address,
          20000,
          initialShare,
          ZAddress,
          {
            from: LP1,
            value: web3.utils.toWei("1", "ether"),
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);
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

      it("should deploy another exchange correctly", async () => {
        await factoryInstance.launchExchange(
          tokenInstance.address,
          20000,
          initialShare,
          ZAddress,
          {
            from: LP1,
            value: web3.utils.toWei("1", "ether"),
          }
        );
        let _receipt = await factoryInstance.launchExchange(
          tokenInstance.address,
          20000,
          initialShare,
          oracleInstance.address,
          {
            from: LP1,
            value: web3.utils.toWei("1", "ether"),
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);
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

      it("should revert launchExchange if exchange already exists", async () => {
        await factoryInstance.launchExchange(
          tokenInstance.address,
          20000,
          initialShare,
          oracleInstance.address,
          {
            from: LP1,
            value: 20000,
          }
        );
        await expectRevert.unspecified(
          factoryInstance.launchExchange(
            tokenInstance.address,
            40000,
            initialShare,
            oracleInstance.address,
            {
              from: LP1,
              value: 20000,
            }
          )
        );
      });

      it("should revert launchExchange if token is address(0)", async () => {
        await expectRevert.unspecified(
          factoryInstance.launchExchange(
            ZAddress,
            40000,
            initialShare,
            oracleInstance.address,
            {
              from: LP1,
              value: 20000,
            }
          )
        );
      });

      it("should revert launchExchange if token is factory address", async () => {
        await expectRevert.unspecified(
          factoryInstance.launchExchange(
            factoryInstance.address,
            20000,
            initialShare,
            oracleInstance.address,
            {
              from: LP1,
              value: 20000,
            }
          )
        );
      });

      it("name of share token is correct", async () => {
        await factoryInstance.launchExchange(
          tokenInstance.address,
          20000,
          initialShare,
          ZAddress,
          {
            from: LP1,
            value: web3.utils.toWei("1", "ether"),
          }
        );
        let _receipt = await factoryInstance.launchExchange(
          tokenInstance.address,
          20000,
          initialShare,
          oracleInstance.address,
          {
            from: LP1,
            value: web3.utils.toWei("1", "ether"),
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );

        let name = await exchangeInstance.name();
        console.log(name);
        assert.equal(name, "SHARE-TESTTOKEN-ETH", "Invalid share token name");
      });
    });

    describe("reinitialize exchange", async () => {
      it("reinitialize exchange correctly", async () => {
        let _receipt = await factoryInstance.launchExchange(
          tokenInstance.address,
          20000,
          20000,
          oracleInstance.address,
          {
            from: LP1,
            value: 20000,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await exchangeInstance.removeLiquidity(10, 0, 0, 20000, {from: LP1});

        await tokenInstance.approve(factoryInstance.address, 300000000, {
          from: LP1,
        });
        await factoryInstance.initializeExchange(
          tokenInstance.address,
          oracleInstance.address,
          30000,
          30000,
          {
            from: LP1,
            value: 30000,
          }
        );
        let exchangeData = await exchangeInstance.getExchangeData.call();
        assert.equal(exchangeData[1], 30000, "token reserve should be 20000");
        assert.equal(exchangeData[2], 30000, "ETH reserve should be 20000");
        assert.equal(exchangeData[3], 30000, "TotalShares should be 30000");
      });

      it("should revert reinitialize exchange if can not send ERC20", async () => {
        let _receipt = await factoryInstance.launchExchange(
          tokenInstance.address,
          20000,
          20000,
          oracleInstance.address,
          {
            from: LP1,
            value: 20000,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await exchangeInstance.removeLiquidity(10, 0, 0, 20000, {from: LP1});

        await tokenInstance.approve(factoryInstance.address, 300000000, {
          from: LP1,
        });
        await expectRevert.unspecified(
          factoryInstance.initializeExchange(
            tokenInstance.address,
            oracleInstance.address,
            300000001,
            20000,
            {
              from: LP1,
              value: 20000,
            }
          )
        );
      });

      it("should revert reinitialize if share token exists", async () => {
        await factoryInstance.launchExchange(
          tokenInstance.address,
          20000,
          initialShare,
          oracleInstance.address,
          {
            from: LP1,
            value: 20000,
          }
        );

        await expectRevert.unspecified(
          factoryInstance.initializeExchange(
            tokenInstance.address,
            oracleInstance.address,
            20000,
            20000,
            {
              from: LP1,
              value: 20000,
            }
          )
        );
      });

      it("should revert for unexisting exchange", async () => {
        await expectRevert.unspecified(
          factoryInstance.initializeExchange(
            tokenInstance.address,
            oracleInstance.address,
            20000,
            20000,
            {
              from: LP1,
              value: 20000,
            }
          )
        );
      });

      it("should revert when token.transferfrom failed", async () => {
        await expectRevert.unspecified(
          factoryInstance.initializeExchange(
            tokenInstance.address,
            oracleInstance.address,
            200000000000,
            20000,
            {
              from: LP1,
              value: 0,
            }
          )
        );
      });

      it("should revert when eth transfer failed", async () => {
        await expectRevert.unspecified(
          factoryInstance.initializeExchange(
            tokenInstance.address,
            oracleInstance.address,
            20000,
            20000,
            {
              from: LP1,
              value: 0,
            }
          )
        );
      });
    });

    describe("tranfer market fee", function () {
      it("check market fee for lien token", async () => {
        let _receipt = await factoryInstance.launchExchange(
          tokenInstance.address,
          20000000,
          initialShare,
          oracleInstance.address,
          {
            from: LP1,
            value: 30000000,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);
        await exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer1,
          value: 100000,
        });
        await exchangeInstance.orderTokenToEth(16, ZAddress, 150000, false, {
          from: seller1,
        });
        await exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer2,
          value: 100000,
        });
        await exchangeInstance.orderTokenToEth(16, ZAddress, 150000, false, {
          from: seller2,
        });

        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(5);
        let ethAmount = await exchangeInstance.marketFeePool1.call();
        assert.equal(
          ethAmount.toNumber(),
          381,
          "Invalid amount of ETH for Lien token"
        );
        let tokenAmount = await exchangeInstance.marketFeePool0.call();
        assert.equal(
          tokenAmount.toNumber(),
          0,
          "Invalid amount of token for Lien token"
        );
      });

      it("transfer market fee to lien correctly #1", async () => {
        let _receipt = await factoryInstance.launchExchange(
          tokenInstance.address,
          10000000000,
          initialShare,
          oracleInstance.address,
          {
            from: LP1,
            value: 15000000000,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);

        await exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer1,
          value: 1000000,
        });
        await exchangeInstance.orderTokenToEth(16, ZAddress, 1500000, false, {
          from: seller2,
        });
        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(5);
        let ethAmount = await exchangeInstance.marketFeePool1.call();
        assert.equal(
          ethAmount.toNumber(),
          1943,
          "Invalid amount of ETH for Lien token"
        );
      });

      it("transfer market fee to lien correctly #2", async () => {
        let _receipt = await factoryInstance.launchExchange(
          tokenInstance.address,
          20000000,
          initialShare,
          oracleInstance.address,
          {
            from: LP1,
            value: 30000000,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);

        await exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer1,
          value: 100000,
        });
        await exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer2,
          value: 100000,
        });
        await exchangeInstance.orderTokenToEth(16, ZAddress, 150000, false, {
          from: seller1,
        });
        await exchangeInstance.orderTokenToEth(16, ZAddress, 150000, false, {
          from: seller2,
        });
        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(5);
        await exchangeInstance.sendMarketFeeToLien({from: factory});
        let ethBalance = await web3.eth.getBalance(lientokenInstance.address);
        assert.equal(
          ethBalance,
          383,
          "Invalid eth amount lientoken will receive"
        );
        let tokenBalance = await tokenInstance.balanceOf.call(
          lientokenInstance.address
        );
        assert.equal(
          tokenBalance,
          0,
          "Invalid token amount lientoken will receive"
        );
      });

      it("transfer market fee when there is no order", async () => {
        let _receipt = await factoryInstance.launchExchange(
          tokenInstance.address,
          20000000,
          initialShare,
          oracleInstance.address,
          {
            from: LP1,
            value: 30000000,
          }
        );
        let exchangeInstance = await BoxExchange.at(
          _receipt.logs[0].args.exchange
        );
        await deploy.approve(exchangeInstance.address, accounts);

        await time.advanceBlock();
        await exchangeInstance.executeUnexecutedBox(5);
        await exchangeInstance.sendMarketFeeToLien({from: factory});
        let ethBalance = await web3.eth.getBalance(lientokenInstance.address);
        assert.equal(
          ethBalance,
          0,
          "Invalid eth amount lientoken will receive"
        );
        let tokenBalance = await tokenInstance.balanceOf.call(
          lientokenInstance.address
        );
        assert.equal(
          tokenBalance,
          0,
          "Invalid token amount lientoken will receive"
        );
      });
    });
  });
});
