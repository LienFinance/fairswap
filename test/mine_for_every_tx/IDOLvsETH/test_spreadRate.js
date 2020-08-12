const DECIMAL = 1000000000000000000;
const ZAddress = "0x0000000000000000000000000000000000000000";
const BoxExchange = artifacts.require("ETHBoxExchange");
let deploy = require("../../mine_on_interval/IDOLvsETH/deploy_contracts.js");
const initialShare = web3.utils.toWei("1", "ether");
const {expectEvent, BN, time} = require("@openzeppelin/test-helpers");

contract("BoxExchange IDOL vs ETH", function (accounts) {
  describe("test spread rate", function () {
    let tokenInstance;
    let factoryInstance;
    let lientokenInstance;
    let oracle;
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
    let exchangeInstance;

    beforeEach(async () => {
      let instances = await deploy.setting(accounts);
      tokenInstance = instances.tokenInstance;
      lientokenInstance = instances.lientokenInstance;
      oracle = instances.oracleInstance;

      exchangeInstance = instances.exchangeInstance;
      await exchangeInstance.initializeExchange(20000, initialShare, {
        from: LP1,
        value: web3.utils.toWei("1", "ether"),
      });
      await time.advanceBlock();
      await time.advanceBlock();
    });

    it("when ETH is less volatile", async () => {
      let receipt = await exchangeInstance.orderEthToToken(
        16,
        ZAddress,
        false,
        {
          from: buyer1,
          value: 1500,
        }
      );

      expectEvent(receipt, "SpreadRate", {
        boxNumber: new BN(1),
        spreadRate: new BN(3000000000000000),
      });
      /*
      assert.equal(
        receipt.logs[0].args.spreadRate,
        3000000000000000,
        "Spread rate must be default value"
      );*/
    });

    it("when ETH is highly volatile", async () => {
      await oracle.changeData(
        (100 * 10 ** 8).toFixed(),
        (4 * 10 ** 8).toFixed()
      );
      let receipt = await exchangeInstance.orderEthToToken(
        16,
        ZAddress,
        false,
        {
          from: buyer1,
          value: 1500,
        }
      );
      assert.equal(
        receipt.logs[0].args.spreadRate,
        6000000000000000,
        "Spread rate must be about 0.6%"
      );
    });

    it("when ETH is extremely volatile", async () => {
      await oracle.changeData(
        (100 * 10 ** 8).toFixed(),
        (150 * 10 ** 8).toFixed()
      );
      let receipt = await exchangeInstance.orderEthToToken(
        16,
        ZAddress,
        false,
        {
          from: buyer1,
          value: 1500,
        }
      );
      assert.equal(
        receipt.logs[0].args.spreadRate,
        150000000000000000,
        "Spread rate must be about 15%"
      );
    });
  });
});
