const DECIMAL = 1000000000000000000;
const ZAddress = "0x0000000000000000000000000000000000000000";
const Factory = artifacts.require("LBTExchangeFactory");
// start local chain with $ ganache-cli -b 3 to process "Promise.all(process)"
const BoxExchange = artifacts.require("LBTBoxExchange");
const {time} = require("@openzeppelin/test-helpers");
let deploy = require("../../mine_on_interval/IDOLvsLBT/deploy_contracts.js");
contract("BoxExchange IDOL vs LBT", function (accounts) {
  describe("Check Spread Rate", function () {
    let settlementtokenInstance;
    let basetokenInstance;
    let factoryInstance;
    let lientokenInstance;
    let oracle;
    let exchangeInstance;
    let bondMakerAddress;
    let volatileCalcAddress1;
    let volatileCalcAddress2;
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
      bondMakerAddress = instances.bondMakerAddress;
      volatileCalcAddress1 = instances.volatileCalcAddress1;
      volatileCalcAddress2 = instances.volatileCalcAddress2;
      factoryInstance = instances.factoryInstance;
      oracle = instances.oracleInstance;
      let _receipt = await factoryInstance.launchExchange(1, 1, 1000, 10000, {
        from: LP1,
      });
      exchangeInstance = await BoxExchange.at(_receipt.logs[0].args.exchange);
      await deploy.approve(exchangeInstance.address, accounts);
    });

    describe("Before maturity", function () {
      it("when LBT is little volatile", async () => {
        await oracle.changeData(
          (250 * 10 ** 8).toFixed(),
          (1 * 10 ** 8).toFixed()
        );

        let receipt = await exchangeInstance.orderBaseToSettlement(
          16,
          ZAddress,
          200,
          false,
          {
            from: buyer1,
          }
        );
        assert.equal(
          receipt.logs[0].args.spreadRate,
          3000000000000000,
          "Spread rate must be default value"
        );
      });

      it("when LBT is highly volatile", async () => {
        await oracle.changeData(
          (200 * 10 ** 8).toFixed(),
          (1 * 10 ** 8).toFixed()
        );
        await time.increase(700000);
        await oracle.changeData(10000000000, 100000000);

        let receipt = await exchangeInstance.orderBaseToSettlement(
          16,
          ZAddress,
          200,
          false,
          {
            from: buyer1,
          }
        );
        assert.equal(
          receipt.logs[0].args.spreadRate,
          16479139919633868,
          "Spread rate must be approxiamately 1.6%"
        );
      });

      it("when LBT is extremely volatile", async () => {
        await oracle.changeData(
          (200 * 10 ** 8).toFixed(),
          (1 * 10 ** 8).toFixed()
        );
        await time.increase(700000);
        await oracle.changeData(5000000000, 100000000);

        let receipt = await exchangeInstance.orderBaseToSettlement(
          16,
          ZAddress,
          200,
          false,
          {
            from: buyer1,
          }
        );
        assert.equal(
          receipt.logs[0].args.spreadRate,
          127199680192586300,
          "Spread rate must be approxiamately 12.7%"
        );
      });
    });

    describe("After maturity", function () {
      it("when ETH are less volatile", async () => {
        await time.increase(10000000);
        let receipt = await exchangeInstance.orderBaseToSettlement(
          16,
          ZAddress,
          200,
          false,
          {
            from: buyer1,
          }
        );
        assert.equal(
          receipt.logs[0].args.spreadRate,
          3000000000000000,
          "Spread rate must be default value"
        );
      });

      it("when ETH are highly volatile", async () => {
        await time.increase(10000000);
        await oracle.changeData(
          (100 * 10 ** 8).toFixed(),
          (4 * 10 ** 8).toFixed()
        );
        let receipt = await exchangeInstance.orderBaseToSettlement(
          16,
          ZAddress,
          200,
          false,
          {
            from: buyer1,
          }
        );
        assert.equal(
          receipt.logs[0].args.spreadRate,
          6000000000000000,
          "Spread rate must be 0.6%"
        );
      });

      it("when ETH are extremely volatile", async () => {
        await time.increase(10000000);
        await oracle.changeData(
          (100 * 10 ** 8).toFixed(),
          (150 * 10 ** 8).toFixed()
        );
        let receipt = await exchangeInstance.orderBaseToSettlement(
          16,
          ZAddress,
          200,
          false,
          {
            from: buyer1,
          }
        );
        assert.equal(
          receipt.logs[0].args.spreadRate,
          150000000000000000,
          "Spread rate must be 15%"
        );
      });
    });
  });
});
