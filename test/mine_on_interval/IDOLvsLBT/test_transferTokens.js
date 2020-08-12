const DECIMAL = 1000000000000000000;
const ZAddress = "0x0000000000000000000000000000000000000000";
// start local chain with $ ganache-cli -b 3 to process "Promise.all(process)"
const BoxExchange = artifacts.require("LBTBoxExchange");
const {time} = require("@openzeppelin/test-helpers");
let deploy = require("./deploy_contracts.js");

contract("BoxExchange IDOL vs LBT", function (accounts) {
  describe("transfer tokens after execution", function () {
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
      factoryInstance = instances.factoryInstance;
    });

    it("price is inner tolerance rate", async () => {
      let _receipt = await factoryInstance.launchExchange(
        1,
        1,
        200000,
        100000,
        {
          from: LP1,
        }
      );
      let exchangeInstance = await BoxExchange.at(
        _receipt.logs[0].args.exchange
      );
      await deploy.approve(exchangeInstance.address, accounts);

      let process = [
        exchangeInstance.orderBaseToSettlement(16, ZAddress, 200, false, {
          from: buyer1,
        }),
        exchangeInstance.orderBaseToSettlement(16, ZAddress, 200, true, {
          from: buyer2,
        }),
        exchangeInstance.orderSettlementToBase(16, ZAddress, 150, false, {
          from: seller1,
        }),
        exchangeInstance.orderSettlementToBase(16, ZAddress, 150, true, {
          from: seller2,
        }),
      ];
      await Promise.all(process);
      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();
      await exchangeInstance.orderSettlementToBase(16, ZAddress, 300, 1, {
        from: seller2,
      });
      let balance = await settlementtokenInstance.balanceOf.call(buyer1);
      assert.equal(
        balance.valueOf().toNumber(),
        99,
        "balance of buyer1 is invalid"
      );
      balance = await settlementtokenInstance.balanceOf.call(buyer2);
      assert.equal(
        balance.valueOf().toNumber(),
        99,
        "balance of buyer2 is invalid"
      );

      balance = await basetokenInstance.balanceOf.call(seller1);
      assert.equal(
        balance.valueOf().toNumber(),
        297,
        "balance of seller1 is invalid"
      );
      balance = await basetokenInstance.balanceOf.call(seller2);
      assert.equal(
        balance.valueOf().toNumber(),
        297,
        "balance of seller2 is invalid"
      );
    });

    it("over tolerance rate, buy limit order is refunded partially", async () => {
      let _receipt = await factoryInstance.launchExchange(
        1,
        1,
        200000,
        100000,
        {
          from: LP1,
        }
      );
      let exchangeInstance = await BoxExchange.at(
        _receipt.logs[0].args.exchange
      );
      await deploy.approve(exchangeInstance.address, accounts);

      let process = [
        exchangeInstance.orderBaseToSettlement(16, ZAddress, 150, false, {
          from: buyer1,
        }),
        exchangeInstance.orderBaseToSettlement(16, ZAddress, 700, true, {
          from: buyer2,
        }),
        exchangeInstance.orderSettlementToBase(16, ZAddress, 150, false, {
          from: seller1,
        }),
        exchangeInstance.orderSettlementToBase(16, ZAddress, 100, true, {
          from: seller2,
        }),
      ];
      let rec = await Promise.all(process);

      let balance = await settlementtokenInstance.balanceOf.call(seller2);
      await time.advanceBlock();
      await exchangeInstance.orderSettlementToBase(16, ZAddress, 300, 1, {
        from: seller2,
      });

      balance = await settlementtokenInstance.balanceOf.call(buyer1);
      assert.equal(
        balance.valueOf().toNumber(),
        74,
        "balance of buyer1 is invalid"
      );
      balance = await settlementtokenInstance.balanceOf.call(buyer2);
      assert.equal(
        balance.valueOf().toNumber(),
        273,
        "balance of buyer2 is invalid"
      );
      balance = await basetokenInstance.balanceOf.call(buyer2);
      assert.equal(
        balance.toNumber(),
        199999450,
        "balance of buyer2 is invalid"
      );

      balance = await basetokenInstance.balanceOf.call(seller1);
      assert.equal(
        balance.valueOf().toNumber(),
        298,
        "balance of seller1 is invalid"
      );
      balance = await basetokenInstance.balanceOf.call(seller2);
      assert.equal(
        balance.valueOf().toNumber(),
        198,
        "balance of seller2 is invalid"
      );
      balance = await settlementtokenInstance.balanceOf.call(seller2);
      assert.equal(
        balance.toNumber(),
        199999600,
        "balance of seller2 is invalid"
      );
    });

    it(" over tolerance, sell order is refunded partially", async () => {
      let _receipt = await factoryInstance.launchExchange(
        1,
        1,
        200000,
        100000,
        {
          from: LP1,
        }
      );
      let exchangeInstance = await BoxExchange.at(
        _receipt.logs[0].args.exchange
      );
      await deploy.approve(exchangeInstance.address, accounts);

      let process = [
        exchangeInstance.orderBaseToSettlement(16, ZAddress, 150, false, {
          from: buyer1,
        }),
        exchangeInstance.orderBaseToSettlement(16, ZAddress, 100, true, {
          from: buyer2,
        }),
        exchangeInstance.orderSettlementToBase(16, ZAddress, 100, false, {
          from: seller1,
        }),
        exchangeInstance.orderSettlementToBase(16, ZAddress, 150, true, {
          from: seller2,
        }),
      ];
      await Promise.all(process);

      await time.advanceBlock();
      await exchangeInstance.orderSettlementToBase(16, ZAddress, 300, false, {
        from: seller2,
      });

      let balance = await settlementtokenInstance.balanceOf.call(buyer1);
      assert.equal(
        balance.valueOf().toNumber(),
        74,
        "balance of buyer1 is invalid"
      );
      balance = await settlementtokenInstance.balanceOf.call(buyer2);
      assert.equal(
        balance.valueOf().toNumber(),
        49,
        "balance of buyer2 is invalid"
      );
      balance = await basetokenInstance.balanceOf.call(buyer2);
      assert.equal(
        balance.valueOf().toNumber(),
        199999900,
        "balance of buyer2 is invalid"
      );

      balance = await basetokenInstance.balanceOf.call(seller1);
      assert.equal(
        balance.valueOf().toNumber(),
        197,
        "balance of seller1 is invalid"
      );
      balance = await basetokenInstance.balanceOf.call(seller2);
      assert.equal(
        balance.valueOf().toNumber(),
        249,
        "balance of seller2 is invalid"
      );
      balance = await settlementtokenInstance.balanceOf.call(seller2);
      assert.equal(
        balance.valueOf().toNumber(),
        199999574,
        "balance of seller2 is invalid"
      );
    });
  });
});
