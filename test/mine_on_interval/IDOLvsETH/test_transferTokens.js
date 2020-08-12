const DECIMAL = 1000000000000000000;
const ZAddress = "0x0000000000000000000000000000000000000000";
const BoxExchange = artifacts.require("ETHBoxExchange");
const {
  BN, // Big Number support
  expectEvent, // Assertions for emitted events
  expectRevert,
  time, // Assertions for transactions that should fail
} = require("@openzeppelin/test-helpers");
let deploy = require("./deploy_contracts.js");
const initialShare = web3.utils.toWei("1", "ether");
contract("BoxExchange IDOL vs ETH", function (accounts) {
  describe("transfer tokens after execution", function () {
    let tokenInstance;
    let exchangeInstance;
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
      oracleInstance = instances.oracleInstance;
    });

    it("price is inner tolerance rate", async () => {
      await exchangeInstance.initializeExchange(100000, initialShare, {
        from: LP1,
        value: 200000,
      });

      let process = [
        exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer1,
          value: 200,
        }),
        exchangeInstance.orderEthToToken(16, ZAddress, true, {
          from: buyer2,
          value: 200,
        }),
        exchangeInstance.orderTokenToEth(16, ZAddress, 150, false, {
          from: seller1,
        }),
        exchangeInstance.orderTokenToEth(16, ZAddress, 150, true, {
          from: seller2,
        }),
      ];
      await Promise.all(process);
      await time.advanceBlock();
      let receipt = await exchangeInstance.orderEthToToken(16, ZAddress, 0, {
        from: buyer1,
        value: 10000,
      });
      let exchangeData = await exchangeInstance.getExchangeData.call();
      assert.equal(
        exchangeData[2].toNumber(),
        199804,
        "Invalid baseToken Pool"
      );
      assert.equal(
        exchangeData[1].toNumber(),
        100099,
        "Invalid settlementToken Pool"
      );
    });

    it("over tolerance rate, buy limit order is refunded partially", async () => {
      await exchangeInstance.initializeExchange(100000, initialShare, {
        from: LP1,
        value: 200000,
      });

      let process = [
        exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer1,
          value: 150,
        }),
        exchangeInstance.orderEthToToken(16, ZAddress, true, {
          from: buyer2,
          value: 700,
        }),
        exchangeInstance.orderTokenToEth(16, ZAddress, 150, false, {
          from: seller1,
        }),
        exchangeInstance.orderTokenToEth(16, ZAddress, 100, true, {
          from: seller2,
        }),
      ];
      await Promise.all(process);

      await time.advanceBlock();
      await time.advanceBlock();
      let receipt = await exchangeInstance.orderEthToToken(
        16,
        ZAddress,
        false,
        {from: buyer1, value: 10000}
      );
      let exchangeData = await exchangeInstance.getExchangeData.call();
      assert.equal(
        exchangeData[2].toNumber(),
        200202,
        "Invalid baseToken Pool"
      );
      assert.equal(
        exchangeData[1].toNumber(),
        99901,
        "Invalid settlementToken Pool"
      );
    });

    it("over tolerance, sell limit order is refunded all", async () => {
      await exchangeInstance.initializeExchange(100000, initialShare, {
        from: LP1,
        value: 200000,
      });

      let process = [
        exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer1,
          value: 750,
        }),
        exchangeInstance.orderEthToToken(16, ZAddress, true, {
          from: buyer2,
          value: 400,
        }),
        exchangeInstance.orderTokenToEth(16, ZAddress, 100, false, {
          from: seller1,
        }),
        exchangeInstance.orderTokenToEth(16, ZAddress, 150, true, {
          from: seller2,
        }),
      ];

      await Promise.all(process);

      await time.advanceBlock();
      await time.advanceBlock();
      let receipt = await exchangeInstance.orderEthToToken(
        16,
        ZAddress,
        false,
        {from: buyer1, value: 10000}
      );

      let exchangeData = await exchangeInstance.getExchangeData.call();
      assert.equal(
        exchangeData[2].toNumber(),
        200253,
        "Invalid baseToken Pool"
      );
      assert.equal(
        exchangeData[1].toNumber(),
        99875,
        "Invalid settlementToken Pool"
      );
    });

    it("over tolerance, sell limit order is refunded partially", async () => {
      await exchangeInstance.initializeExchange(100000, initialShare, {
        from: LP1,
        value: 200000,
      });

      let process = [
        exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer1,
          value: 150,
        }),
        exchangeInstance.orderEthToToken(16, ZAddress, true, {
          from: buyer2,
          value: 100,
        }),
        exchangeInstance.orderTokenToEth(16, ZAddress, 100, false, {
          from: seller1,
        }),
        exchangeInstance.orderTokenToEth(16, ZAddress, 150, true, {
          from: seller2,
        }),
      ];

      await Promise.all(process);

      await time.advanceBlock();
      await time.advanceBlock();
      let receipt = await exchangeInstance.orderEthToToken(
        16,
        ZAddress,
        false,
        {from: buyer1, value: 10000}
      );

      let exchangeData = await exchangeInstance.getExchangeData.call();
      assert.equal(
        exchangeData[2].toNumber(),
        199801,
        "Invalid baseToken Pool"
      );
      assert.equal(
        exchangeData[1].toNumber(),
        100100,
        "Invalid settlementToken Pool"
      );
    });

    it("over tolerance, sell limit order is refunded totally", async () => {
      await exchangeInstance.initializeExchange(100000, initialShare, {
        from: LP1,
        value: 200000,
      });

      let process = [
        exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer1,
          value: 150,
        }),
        exchangeInstance.orderEthToToken(16, ZAddress, true, {
          from: buyer2,
          value: 100,
        }),
        exchangeInstance.orderTokenToEth(16, ZAddress, 350, false, {
          from: seller1,
        }),
        exchangeInstance.orderTokenToEth(16, ZAddress, 150, true, {
          from: seller2,
        }),
      ];
      await Promise.all(process);
      await time.advanceBlock();
      let receipt = await exchangeInstance.orderEthToToken(
        16,
        ZAddress,
        false,
        {from: buyer1, value: 10000}
      );

      let exchangeData = await exchangeInstance.getExchangeData.call();
      assert.equal(
        exchangeData[2].toNumber(),
        199554,
        "Invalid baseToken Pool"
      );
      assert.equal(
        exchangeData[1].toNumber(),
        100225,
        "Invalid settlementToken Pool"
      );
    });

    it("over secure rete, sell non-limit order refunded partially", async () => {
      await exchangeInstance.initializeExchange(10000, initialShare, {
        from: LP1,
        value: 20000,
      });

      let process = [
        exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer1,
          value: 150,
        }),
        exchangeInstance.orderEthToToken(16, ZAddress, true, {
          from: buyer2,
          value: 100,
        }),
        exchangeInstance.orderTokenToEth(16, ZAddress, 750, false, {
          from: seller1,
        }),
        exchangeInstance.orderTokenToEth(16, ZAddress, 150, true, {
          from: seller2,
        }),
      ];
      await Promise.all(process);

      await time.advanceBlock();
      let receipt = await exchangeInstance.orderEthToToken(
        16,
        ZAddress,
        false,
        {from: buyer1, value: 10000}
      );
      let exchangeData = await exchangeInstance.getExchangeData.call();
      assert.equal(exchangeData[2].toNumber(), 19049, "Invalid baseToken Pool");
      assert.equal(
        exchangeData[1].toNumber(),
        10501,
        "Invalid settlementToken Pool"
      );
    });

    it("over secure rete, buy non-limit order refunded partially", async () => {
      await exchangeInstance.initializeExchange(10000, initialShare, {
        from: LP1,
        value: 20000,
      });

      let process = [
        exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer1,
          value: 1800,
        }),
        exchangeInstance.orderEthToToken(16, ZAddress, true, {
          from: buyer2,
          value: 400,
        }),
        exchangeInstance.orderTokenToEth(16, ZAddress, 100, false, {
          from: seller1,
        }),
        exchangeInstance.orderTokenToEth(16, ZAddress, 150, true, {
          from: seller2,
        }),
      ];
      await Promise.all(process);

      await time.advanceBlock();
      let receipt = await exchangeInstance.orderEthToToken(
        16,
        ZAddress,
        false,
        {from: buyer1, value: 10000}
      );

      let exchangeData = await exchangeInstance.getExchangeData.call();
      assert.equal(exchangeData[2].toNumber(), 21004, "Invalid baseToken Pool");
      assert.equal(
        exchangeData[1].toNumber(),
        9525,
        "Invalid settlementToken Pool"
      );
    });

    it("buy limit order refunded totally2", async () => {
      await exchangeInstance.initializeExchange(10000, initialShare, {
        from: LP1,
        value: 20000,
      });

      let process = [
        exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer1,
          value: 1500,
        }),
        exchangeInstance.orderEthToToken(16, ZAddress, true, {
          from: buyer2,
          value: 400,
        }),
        exchangeInstance.orderTokenToEth(16, ZAddress, 100, false, {
          from: seller1,
        }),
        exchangeInstance.orderTokenToEth(16, ZAddress, 150, true, {
          from: seller2,
        }),
      ];
      await Promise.all(process);

      await time.advanceBlock();
      let receipt = await exchangeInstance.orderEthToToken(
        16,
        ZAddress,
        false,
        {from: buyer1, value: 10000}
      );

      let exchangeData = await exchangeInstance.getExchangeData.call();
      assert.equal(exchangeData[2].toNumber(), 20979, "Invalid baseToken Pool");
      assert.equal(
        exchangeData[1].toNumber(),
        9536,
        "Invalid settlementToken Pool"
      );
    });

    it("sell limit order refunded totally2", async () => {
      await exchangeInstance.initializeExchange(10000, initialShare, {
        from: LP1,
        value: 20000,
      });

      let process = [
        exchangeInstance.orderEthToToken(16, ZAddress, false, {
          from: buyer1,
          value: 150,
        }),
        exchangeInstance.orderEthToToken(16, ZAddress, true, {
          from: buyer2,
          value: 100,
        }),
        exchangeInstance.orderTokenToEth(16, ZAddress, 500, false, {
          from: seller1,
        }),
        exchangeInstance.orderTokenToEth(16, ZAddress, 150, true, {
          from: seller2,
        }),
      ];
      await Promise.all(process);

      await time.advanceBlock();
      let receipt = await exchangeInstance.orderEthToToken(
        16,
        ZAddress,
        false,
        {from: buyer1, value: 10000}
      );
      let exchangeData = await exchangeInstance.getExchangeData.call();
      assert.equal(exchangeData[2].toNumber(), 19288, "Invalid baseToken Pool");
      assert.equal(
        exchangeData[1].toNumber(),
        10371,
        "Invalid settlementToken Pool"
      );
      //assert.equal(receipt.logs[1].args.ethpool, 19288, "Invalid baseToken Pool");
      //assert.equal(receipt.logs[1].args.tokenpool, 10370,  "Invalid settlementToken Pool");
    });

    it("withdraw ETH", async () => {
      const eth = web3.utils.toWei("1", "ether");
      await exchangeInstance.initializeExchange(3000000, initialShare, {
        from: LP1,
        value: eth,
      });

      await exchangeInstance.orderTokenToEth(16, ZAddress, 30000, false, {
        from: seller1,
      });
      await time.advanceBlock();
      await exchangeInstance.executeUnexecutedBox(2, {from: buyer1});
      let beforeBalance = await web3.eth.getBalance(seller1);
      await exchangeInstance.withdrawETH({from: seller1});
      let balance = await web3.eth.getBalance(seller1);
      assert(beforeBalance < balance, "cant withdraw eth");
    });
  });
});
