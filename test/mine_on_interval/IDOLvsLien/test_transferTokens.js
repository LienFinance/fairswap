// start local chain with $ ganache-cli -b 3 to process "Promise.all(process)"
const {
  time, // Assertions for transactions that should fail
} = require("@openzeppelin/test-helpers");
let deploy = require("./deploy_contracts.js");
const ZAddress = "0x0000000000000000000000000000000000000000";

contract("BoxExchange IDOL vs Lien", function (accounts) {
  describe("transfer tokens after execution", function () {
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
      exchangeInstance = instances.exchangeInstance;
    });

    it("price is inner tolerance rate", async () => {
      await exchangeInstance.initializeExchange(200000, 100000, 1000, {
        from: LP1,
      });

      let process = [
        exchangeInstance.orderBaseToSettlement(
          1685175020,
          ZAddress,
          200,
          false,
          {from: buyer1}
        ),
        exchangeInstance.orderBaseToSettlement(
          1685175020,
          ZAddress,
          200,
          true,
          {from: buyer2}
        ),
        exchangeInstance.orderSettlementToBase(
          1685175020,
          ZAddress,
          150,
          false,
          {from: seller1}
        ),
        exchangeInstance.orderSettlementToBase(
          1685175020,
          ZAddress,
          150,
          true,
          {from: seller2}
        ),
      ];
      await Promise.all(process);
      await time.advanceBlock();
      await exchangeInstance.orderSettlementToBase(
        1685175020,
        ZAddress,
        300,
        1,
        {from: seller2}
      );

      let balance = await lientokenInstance.balanceOf.call(buyer1);
      assert.equal(
        balance.valueOf().toString(),
        "99",
        "balance of buyer1 is invalid"
      );
      balance = await lientokenInstance.balanceOf.call(buyer2);
      assert.equal(
        balance.valueOf().toString(),
        "99",
        "balance of buyer2 is invalid"
      );
      balance = await basetokenInstance.balanceOf.call(seller1);
      assert.equal(
        balance.valueOf().toString(),
        "297",
        "balance of seller1 is invalid"
      );
      balance = await basetokenInstance.balanceOf.call(seller2);
      assert.equal(
        balance.valueOf().toString(),
        "297",
        "balance of seller2 is invalid"
      );
    });

    it("over tolerance rate, buy order is refunded partially", async () => {
      await exchangeInstance.initializeExchange(200000, 100000, 1000, {
        from: LP1,
      });

      let process = [
        exchangeInstance.orderBaseToSettlement(
          1685175020,
          ZAddress,
          150,
          false,
          {from: buyer1}
        ),
        exchangeInstance.orderBaseToSettlement(
          1685175020,
          ZAddress,
          700,
          true,
          {from: buyer2}
        ),
        exchangeInstance.orderSettlementToBase(
          1685175020,
          ZAddress,
          150,
          false,
          {from: seller1}
        ),
        exchangeInstance.orderSettlementToBase(
          1685175020,
          ZAddress,
          100,
          true,
          {from: seller2}
        ),
      ];
      await Promise.all(process);
      await time.advanceBlock();
      await exchangeInstance.orderSettlementToBase(
        1685175020,
        ZAddress,
        300,
        1,
        {from: seller2}
      );

      balance = await lientokenInstance.balanceOf.call(buyer1);
      assert.equal(
        balance.valueOf().toString(),
        "74",
        "balance of buyer1 is invalid"
      );
      balance = await lientokenInstance.balanceOf.call(buyer2);
      assert.equal(
        balance.valueOf().toString(),
        "273",
        "balance of buyer2 is invalid"
      );
      balance = await basetokenInstance.balanceOf.call(buyer2);
      assert.equal(
        balance.toNumber().toString(),
        "199999450",
        "balance of buyer2 is invalid"
      );

      balance = await basetokenInstance.balanceOf.call(seller1);
      assert.equal(
        balance.valueOf().toString(),
        "298",
        "balance of seller1 is invalid"
      );
      balance = await basetokenInstance.balanceOf.call(seller2);
      assert.equal(
        balance.valueOf().toString(),
        "198",
        "balance of seller2 is invalid"
      );
      balance = await lientokenInstance.balanceOf.call(seller2);
      assert.equal(
        balance.toNumber().toString(),
        "199999600",
        "balance of seller2 is invalid"
      );
    });

    it(" over tolerance, sell order is refunded partially", async () => {
      await exchangeInstance.initializeExchange(200000, 100000, 1000, {
        from: LP1,
      });
      let process = [
        exchangeInstance.orderBaseToSettlement(
          1685175020,
          ZAddress,
          150,
          false,
          {from: buyer1}
        ),
        exchangeInstance.orderBaseToSettlement(
          1685175020,
          ZAddress,
          100,
          true,
          {from: buyer2}
        ),
        exchangeInstance.orderSettlementToBase(
          1685175020,
          ZAddress,
          100,
          false,
          {from: seller1}
        ),
        exchangeInstance.orderSettlementToBase(
          1685175020,
          ZAddress,
          150,
          true,
          {from: seller2}
        ),
      ];
      await Promise.all(process);

      await time.advanceBlock();
      await exchangeInstance.orderSettlementToBase(
        1685175020,
        ZAddress,
        300,
        false,
        {from: seller2}
      );

      let balance = await lientokenInstance.balanceOf.call(buyer1);
      assert.equal(
        balance.valueOf().toString(),
        "74",
        "lien balance of buyer1 is invalid"
      );
      balance = await lientokenInstance.balanceOf.call(buyer2);
      assert.equal(
        balance.valueOf().toString(),
        "49",
        "lien token balance of buyer2 is invalid"
      );
      balance = await basetokenInstance.balanceOf.call(buyer2);
      assert.equal(
        balance.valueOf().toString(),
        "199999900",
        "basetoken balance of buyer2 is invalid"
      );

      balance = await basetokenInstance.balanceOf.call(seller1);
      assert.equal(
        balance.valueOf().toString(),
        "197",
        "basetoken balance of seller1 is invalid"
      );
      balance = await basetokenInstance.balanceOf.call(seller2);
      assert.equal(
        balance.valueOf().toString(),
        "249",
        "basetoken balance of seller2 is invalid"
      );
      balance = await lientokenInstance.balanceOf.call(seller2);
      assert.equal(
        balance.valueOf().toString(),
        "199999574",
        "lien token balance of seller2 is invalid"
      );
    });
  });
});
