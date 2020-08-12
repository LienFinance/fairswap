const Calculator = artifacts.require("PriceCalculator");
const BoxExchangeMock = artifacts.require("BoxExchangeMock");
const TestERC20 = artifacts.require("TestERC20");
const {expectEvent, expectRevert, BN} = require("@openzeppelin/test-helpers");

contract("BoxExchange", function (accounts) {
  const factory = accounts[0];
  const marketFeeTaker = accounts[9];
  const spreadRate = "300000000000000000"; //30%
  const initialReserve0 = 1000000;
  const initialReserve1 = 2000000;
  const TOKEN_TYPE = {
    TOKEN0: 0,
    TOKEN1: 1,
  };
  const ORDER_TYPE = {
    FLEX_0_1: 0,
    FLEX_1_0: 1,
    STRICT_0_1: 2,
    STRICT_1_0: 3,
  };
  var boxExchange;
  var token0;
  var token1;
  var initialShare;
  beforeEach(async () => {
    token0 = await TestERC20.new(factory, 10000000000);
    token1 = await TestERC20.new(factory, 10000000000);
    calculator = await Calculator.new();
    boxExchange = await BoxExchangeMock.new(
      token0.address,
      token1.address,
      calculator.address,
      spreadRate,
      marketFeeTaker
    );
    initialShare = 1000;
  });

  describe("internal functions", () => {
    describe("#executeOrder", () => {
      const recipient = accounts[2];
      const testCases = [
        {
          input: {
            inToken: 0,
            inAmount: 1000,
            refundRate: 0,
            rate: "5000000000000000000", // 5
            spreadRate: 0,
          },
          result: {
            token0: 0,
            token1: 5000,
          },
        },
        {
          input: {
            inToken: 0,
            inAmount: 1000,
            refundRate: "300000000000000000", // 30%
            rate: "5000000000000000000", //5
            spreadRate: 0,
          },
          result: {
            token0: 300,
            token1: 3500,
          },
        },
        {
          input: {
            inToken: 0,
            inAmount: 1200,
            refundRate: "300000000000000000", // 30%
            rate: "5000000000000000000", // 5
            spreadRate: "200000000000000000", // 20%
          },
          result: {
            token0: 360,
            token1: 3500,
          },
        },
        {
          input: {
            inToken: 1,
            inAmount: 1000,
            refundRate: 0,
            rate: "5000000000000000000", // 5
            spreadRate: 0,
          },
          result: {
            token0: 200,
            token1: 0,
          },
        },
        {
          input: {
            inToken: 1,
            inAmount: 1000,
            refundRate: "300000000000000000", // 30%
            rate: "5000000000000000000", //5
            spreadRate: 0,
          },
          result: {
            token0: 140,
            token1: 300,
          },
        },
        {
          input: {
            inToken: 1,
            inAmount: 1200,
            refundRate: "300000000000000000", // 30%
            rate: "5000000000000000000", // 5
            spreadRate: "200000000000000000", // 20%
          },
          result: {
            token0: 140,
            token1: 360,
          },
        },
      ];
      beforeEach(async () => {
        token0.transfer(boxExchange.address, 10000000000);
        token1.transfer(boxExchange.address, 10000000000);
      });
      for (let i = 0; i < testCases.length; i++) {
        it("case: " + i, async () => {
          const {inToken, inAmount, refundRate, rate, spreadRate} = testCases[
            i
          ].input;
          await boxExchange.executeOrder(
            inToken,
            recipient,
            inAmount,
            refundRate,
            rate,
            spreadRate
          );
          const token0Balance = await token0.balanceOf(recipient);
          const token1Balance = await token1.balanceOf(recipient);
          assert.equal(
            token0Balance.toString(),
            testCases[i].result.token0,
            "token0"
          );
          assert.equal(
            token1Balance.toString(),
            testCases[i].result.token1,
            "token1"
          );
        });
      }
    });
    describe("#otherAmountBasedOnRate", () => {
      describe("when input is token0", () => {
        it("returns amount*rate", async () => {
          assert.equal(
            (
              await boxExchange.otherAmountBasedOnRate(
                0,
                100,
                "1000000000000000000"
              )
            ).toNumber(),
            100
          );
          assert.equal(
            (
              await boxExchange.otherAmountBasedOnRate(
                0,
                100,
                "10000000000000000000"
              )
            ).toNumber(),
            1000
          );
          assert.equal(
            (
              await boxExchange.otherAmountBasedOnRate(
                0,
                100,
                "100000000000000000"
              )
            ).toNumber(),
            10
          );
          assert.equal(
            (
              await boxExchange.otherAmountBasedOnRate(
                0,
                100,
                "300000000000000000"
              )
            ).toNumber(),
            30
          );
          assert.equal(
            (
              await boxExchange.otherAmountBasedOnRate(
                0,
                100,
                "10000000000000000"
              )
            ).toNumber(),
            1
          );
          assert.equal(
            (
              await boxExchange.otherAmountBasedOnRate(
                0,
                100,
                "9999999999999999"
              )
            ).toNumber(),
            0
          );
        });
      });
      describe("when input is token1", () => {
        it("returns amount/rate", async () => {
          assert.equal(
            (
              await boxExchange.otherAmountBasedOnRate(
                1,
                100,
                "1000000000000000000"
              )
            ).toNumber(),
            100
          );
          assert.equal(
            (
              await boxExchange.otherAmountBasedOnRate(
                1,
                100,
                "10000000000000000000"
              )
            ).toNumber(),
            10
          );
          assert.equal(
            (
              await boxExchange.otherAmountBasedOnRate(
                1,
                100,
                "30000000000000000000"
              )
            ).toNumber(),
            3
          );
          assert.equal(
            (
              await boxExchange.otherAmountBasedOnRate(
                1,
                100,
                "100000000000000000000"
              )
            ).toNumber(),
            1
          );
          assert.equal(
            (
              await boxExchange.otherAmountBasedOnRate(
                1,
                100,
                "100000000000000000001"
              )
            ).toNumber(),
            0
          );
          assert.equal(
            (
              await boxExchange.otherAmountBasedOnRate(
                1,
                100,
                "100000000000000000"
              )
            ).toNumber(),
            1000
          );
        });
      });
    });
    describe("#calculatePriceWrapper", () => {
      const testCases = [
        {
          title: "execute all flex token 0 in",
          input: {
            flexToken0In: 1,
            strictToken0In: 0,
            flexToken1In: 0,
            strictToken1In: 0,
            reserve0: 10000,
            reserve1: 20000,
          },
          output: {
            rate: "1999800019998000199",
            refundStatus: 0,
            refundRate: 0,
            executingAmount0: 1,
            executingAmount1: 0,
          },
        },
        {
          title: "execute all strict token 0 in",
          input: {
            flexToken0In: 0,
            strictToken0In: 1,
            flexToken1In: 0,
            strictToken1In: 0,
            reserve0: 10000,
            reserve1: 20000,
          },
          output: {
            rate: "1999800019998000199",
            refundStatus: 0,
            refundRate: 0,
            executingAmount0: 1,
            executingAmount1: 0,
          },
        },
        {
          title: "execute all flex token 1 in",
          input: {
            flexToken0In: 0,
            strictToken0In: 0,
            flexToken1In: 1,
            strictToken1In: 0,
            reserve0: 10000,
            reserve1: 20000,
          },
          output: {
            rate: "2000100000000000000",
            refundStatus: 0,
            refundRate: 0,
            executingAmount0: 0,
            executingAmount1: 1,
          },
        },
        {
          title: "execute all strict token 1 in",
          input: {
            flexToken0In: 0,
            strictToken0In: 0,
            flexToken1In: 0,
            strictToken1In: 1,
            reserve0: 10000,
            reserve1: 20000,
          },
          output: {
            rate: "2000100000000000000",
            refundStatus: 0,
            refundRate: 0,
            executingAmount0: 0,
            executingAmount1: 1,
          },
        },
        {
          title: "refund some of strict token 0 in",
          input: {
            flexToken0In: 0,
            strictToken0In: 20,
            flexToken1In: 0,
            strictToken1In: 0,
            reserve0: 10000,
            reserve1: 20000,
          },
          output: {
            rate: "1998001998001998001",
            refundStatus: 1,
            refundRate: "500000000000000000",
            executingAmount0: 10,
            executingAmount1: 0,
          },
        },
        {
          title:
            "execute all of flex token 0 in and refund some of strict token 0 in",
          input: {
            flexToken0In: 5,
            strictToken0In: 20,
            flexToken1In: 0,
            strictToken1In: 0,
            reserve0: 10000,
            reserve1: 20000,
          },
          output: {
            rate: "1998001998001998001",
            refundStatus: 1,
            refundRate: "750000000000000000",
            executingAmount0: 10,
            executingAmount1: 0,
          },
        },
        {
          title: "refund some of flex token 0 in and all of strict token 0 in",
          input: {
            flexToken0In: 600,
            strictToken0In: 20,
            flexToken1In: 0,
            strictToken1In: 0,
            reserve0: 10000,
            reserve1: 20000,
          },
          output: {
            rate: "1904761904761904761",
            refundStatus: 2,
            refundRate: "166666666666666666",
            executingAmount0: 500,
            executingAmount1: 0,
          },
        },
        {
          title: "refund some of strict token 0",
          input: {
            flexToken0In: 0,
            strictToken0In: 0,
            flexToken1In: 0,
            strictToken1In: 40,
            reserve0: 10000,
            reserve1: 20000,
          },
          output: {
            rate: "2002000000000000000",
            refundStatus: 3,
            refundRate: "500000000000000000",
            executingAmount0: 0,
            executingAmount1: 20,
          },
        },
        {
          title: "execute all both of tokens in",
          input: {
            flexToken0In: 0,
            strictToken0In: 20,
            flexToken1In: 0,
            strictToken1In: 40,
            reserve0: 10000,
            reserve1: 20000,
          },
          output: {
            rate: "2000000000000000000",
            refundStatus: 0,
            refundRate: 0,
            executingAmount0: 20,
            executingAmount1: 40,
          },
        },
      ];
      beforeEach(async () => {
        await token0.approve(boxExchange.address, initialReserve0);
        await token1.approve(boxExchange.address, initialReserve1);
        await boxExchange.init(initialReserve0, initialReserve1, initialShare);
      });
      for (let i = 0; i < testCases.length; i++) {
        const {
          flexToken0In,
          strictToken0In,
          flexToken1In,
          strictToken1In,
          reserve0,
          reserve1,
        } = testCases[i].input;
        const {
          rate,
          refundStatus,
          refundRate,
          executingAmount0,
          executingAmount1,
        } = testCases[i].output;
        it("case: " + testCases[i].title, async () => {
          const data = await boxExchange.calculatePriceWrapper(
            flexToken0In,
            strictToken0In,
            flexToken1In,
            strictToken1In,
            reserve0,
            reserve1
          );
          assert.equal(data.rate.toString(), rate, "rate");
          assert.equal(
            data.refundStatus.toNumber(),
            refundStatus,
            "refundStatus"
          );
          assert.equal(data.refundRate.toString(), refundRate, "refundRate");
          assert.equal(
            data.executingAmount0.toNumber(),
            executingAmount0,
            "executingAmount0"
          );
          assert.equal(
            data.executingAmount1.toNumber(),
            executingAmount1,
            "executingAmount1"
          );
        });
      }
    });
  });
  describe("external functions", () => {
    describe("#init", () => {
      describe("by factory", () => {
        beforeEach(async () => {
          await token0.approve(boxExchange.address, initialReserve0);
          await token1.approve(boxExchange.address, initialReserve1);
          await boxExchange.init(
            initialReserve0,
            initialReserve1,
            initialShare
          );
        });
        it("transfers token0", async () => {
          assert.equal(
            (await token0.balanceOf(boxExchange.address)).toNumber(),
            initialReserve0
          );
        });
        it("transfers token1", async () => {
          assert.equal(
            (await token1.balanceOf(boxExchange.address)).toNumber(),
            initialReserve1
          );
        });
        it("update reserves", async () => {
          const reserves = await boxExchange.getReserves();
          assert.equal(reserves._reserve0.toNumber(), initialReserve0);
          assert.equal(reserves._reserve1.toNumber(), initialReserve1);
        });
        it("mint share", async () => {
          assert.equal(
            (await boxExchange.balanceOf(factory)).toNumber(),
            initialShare
          );
          assert.equal(
            (await boxExchange.totalSupply()).toNumber(),
            initialShare
          );
        });
      });
    });
    describe("#addLiquidity", () => {
      describe("#share is calculated based on Token0", () => {
        const lp = accounts[1];
        const addingToken0 = 5000;
        const addingToken1 = 10000;
        var mintedShare;
        beforeEach(async () => {
          await token0.approve(boxExchange.address, initialReserve0);
          await token1.approve(boxExchange.address, initialReserve1);
          await boxExchange.init(
            initialReserve0,
            initialReserve1,
            initialShare
          );
          mintedShare = (addingToken0 * initialShare) / initialReserve0;
        });
        describe("when allowance of token1 is sufficient", () => {
          beforeEach(async () => {
            await token0.transfer(lp, addingToken0);
            await token1.transfer(lp, addingToken1);
            await token0.approve(boxExchange.address, addingToken0, {
              from: lp,
            });
            await token1.approve(boxExchange.address, addingToken1, {
              from: lp,
            });
          });
          describe("when mintedShare is sufficient", () => {
            beforeEach(async () => {
              await boxExchange.addLiquidity(
                addingToken0,
                mintedShare,
                TOKEN_TYPE.TOKEN0,
                {
                  from: lp,
                }
              );
            });
            it("transfers token0", async () => {
              assert.equal(
                (await token0.balanceOf(boxExchange.address)).toNumber(),
                initialReserve0 + addingToken0
              );
            });
            it("transfers token1", async () => {
              assert.equal(
                (await token1.balanceOf(boxExchange.address)).toNumber(),
                initialReserve1 + addingToken1
              );
            });
            it("update reserves", async () => {
              const reserves = await boxExchange.getReserves();
              assert.equal(
                reserves._reserve0.toNumber(),
                initialReserve0 + addingToken0
              );
              assert.equal(
                reserves._reserve1.toNumber(),
                initialReserve1 + addingToken1
              );
            });
            it("mint share", async () => {
              assert.equal(
                (await boxExchange.balanceOf(lp)).toNumber(),
                mintedShare
              );
              assert.equal(
                (await boxExchange.totalSupply()).toNumber(),
                initialShare + mintedShare
              );
            });
          });
          describe("when mintedShare is not sufficient", () => {
            it("reverts", async () => {
              await expectRevert.unspecified(
                boxExchange.addLiquidity(
                  addingToken0,
                  mintedShare + 1,
                  TOKEN_TYPE.TOKEN0,
                  {
                    from: lp,
                  }
                )
              );
            });
          });
        });
        describe("when allowance of token1 is not sufficient", () => {
          it("reverts", async () => {
            await token0.transfer(lp, addingToken0);
            await token1.transfer(lp, addingToken1);
            await token0.approve(boxExchange.address, addingToken0, {
              from: lp,
            });
            await token1.approve(boxExchange.address, addingToken1 - 1, {
              from: lp,
            });
            await expectRevert.unspecified(
              boxExchange.addLiquidity(
                addingToken0,
                mintedShare,
                TOKEN_TYPE.TOKEN0,
                {
                  from: lp,
                }
              )
            );
          });
        });
      });

      describe("#share is calculated based on Token1", () => {
        const lp = accounts[1];
        const addingToken0 = 10000;
        const addingToken1 = 5000;
        var mintedShare;
        beforeEach(async () => {
          await token0.approve(boxExchange.address, initialReserve1);
          await token1.approve(boxExchange.address, initialReserve0);
          await boxExchange.init(
            initialReserve1,
            initialReserve0,
            initialShare
          );
          mintedShare = (addingToken1 * initialShare) / initialReserve0;
        });
        describe("when allowance of token0 is sufficient", () => {
          beforeEach(async () => {
            await token0.transfer(lp, addingToken0);
            await token1.transfer(lp, addingToken1);
            await token0.approve(boxExchange.address, addingToken0, {
              from: lp,
            });
            await token1.approve(boxExchange.address, addingToken1, {
              from: lp,
            });
          });
          describe("when mintedShare is sufficient", () => {
            beforeEach(async () => {
              await boxExchange.addLiquidity(
                addingToken1,
                mintedShare,
                TOKEN_TYPE.TOKEN1,
                {
                  from: lp,
                }
              );
            });
            it("transfers token0", async () => {
              assert.equal(
                (await token0.balanceOf(boxExchange.address)).toNumber(),
                initialReserve1 + addingToken0
              );
            });
            it("transfers token1 ", async () => {
              assert.equal(
                (await token1.balanceOf(boxExchange.address)).toNumber(),
                initialReserve0 + addingToken1
              );
            });
            it("update reserves", async () => {
              const reserves = await boxExchange.getReserves();
              assert.equal(
                reserves._reserve1.toNumber(),
                initialReserve0 + addingToken1
              );
              assert.equal(
                reserves._reserve0.toNumber(),
                initialReserve1 + addingToken0
              );
            });
            it("mint share", async () => {
              assert.equal(
                (await boxExchange.balanceOf(lp)).toNumber(),
                mintedShare
              );
              assert.equal(
                (await boxExchange.totalSupply()).toNumber(),
                initialShare + mintedShare
              );
            });
          });
          describe("when mintedShare is not sufficient", () => {
            it("reverts", async () => {
              await expectRevert.unspecified(
                boxExchange.addLiquidity(
                  addingToken1,
                  mintedShare + 1,
                  TOKEN_TYPE.TOKEN1,
                  {
                    from: lp,
                  }
                )
              );
            });
          });
        });
        describe("when allowance of token0 is not sufficient", () => {
          it("reverts", async () => {
            await token0.transfer(lp, addingToken0);
            await token1.transfer(lp, addingToken1);
            await token0.approve(boxExchange.address, addingToken1, {
              from: lp,
            });
            await token1.approve(boxExchange.address, addingToken0 - 1, {
              from: lp,
            });
            await expectRevert.unspecified(
              boxExchange.addLiquidity(
                addingToken1,
                mintedShare,
                TOKEN_TYPE.TOKEN1,
                {
                  from: lp,
                }
              )
            );
          });
        });
      });
    });
    describe("#removeLiquidity", () => {
      const remover = accounts[1];
      beforeEach(async () => {
        await token0.approve(boxExchange.address, initialReserve0);
        await token1.approve(boxExchange.address, initialReserve1);
        await boxExchange.init(initialReserve0, initialReserve1, initialShare);
        await boxExchange.transfer(remover, initialShare);
      });
      describe("when withdrawn tokens are sufficient", () => {
        describe("burn all", () => {
          beforeEach(async () => {
            await boxExchange.removeLiquidity(
              initialReserve0,
              initialReserve1,
              initialShare,
              {from: remover}
            );
          });
          it("transfers token0", async () => {
            assert.equal(
              (await token0.balanceOf(remover)).toNumber(),
              initialReserve0
            );
          });
          it("transfers token1", async () => {
            assert.equal(
              (await token1.balanceOf(remover)).toNumber(),
              initialReserve1
            );
          });
          it("update reserves", async () => {
            const reserves = await boxExchange.getReserves();
            assert.equal(reserves._reserve0.toNumber(), 0);
            assert.equal(reserves._reserve1.toNumber(), 0);
          });
          it("burn share", async () => {
            assert.equal((await boxExchange.balanceOf(remover)).toNumber(), 0);
            assert.equal((await boxExchange.totalSupply()).toNumber(), 0);
          });
        });
        describe("burn half from another account", () => {
          beforeEach(async () => {
            await boxExchange.removeLiquidity(
              initialReserve0 / 2,
              initialReserve1 / 2,
              initialShare / 2,
              {from: remover}
            );
          });
          it("transfers token0", async () => {
            assert.equal(
              (await token0.balanceOf(remover)).toNumber(),
              initialReserve0 / 2
            );
            assert.equal(
              (await token0.balanceOf(boxExchange.address)).toNumber(),
              initialReserve0 / 2
            );
          });
          it("transfers token1", async () => {
            assert.equal(
              (await token1.balanceOf(remover)).toNumber(),
              initialReserve1 / 2
            );
            assert.equal(
              (await token1.balanceOf(boxExchange.address)).toNumber(),
              initialReserve1 / 2
            );
          });
          it("update reserves", async () => {
            const reserves = await boxExchange.getReserves();
            assert.equal(reserves._reserve0.toNumber(), initialReserve0 / 2);
            assert.equal(reserves._reserve1.toNumber(), initialReserve1 / 2);
          });
          it("burn share", async () => {
            assert.equal(
              (await boxExchange.balanceOf(remover)).toNumber(),
              initialShare / 2
            );
            assert.equal(
              (await boxExchange.totalSupply()).toNumber(),
              initialShare / 2
            );
          });
        });
      });
      describe("when withdrawn token are not sufficient", () => {
        it("reverts", async () => {
          await expectRevert.unspecified(
            boxExchange.removeLiquidity(
              initialReserve0 + 1,
              initialReserve1,
              initialShare
            )
          );
          await expectRevert.unspecified(
            boxExchange.removeLiquidity(
              initialReserve0,
              initialReserve1 + 1,
              initialShare
            )
          );
        });
      });

      describe("when share is not sufficient", () => {
        it("reverts", async () => {
          await expectRevert.unspecified(
            boxExchange.removeLiquidity(
              initialReserve0,
              initialReserve1,
              initialShare + 1
            )
          );
        });
      });
    });
    describe("#addOrder", () => {
      const orderer = accounts[2];
      const tokenBalanceOfOrder = 10000;
      const inAmount = 1300;
      beforeEach(async () => {
        await token0.approve(boxExchange.address, initialReserve0);
        await token1.approve(boxExchange.address, initialReserve1);

        await boxExchange.init(initialReserve0, initialReserve1, initialShare);
        await token0.transfer(orderer, tokenBalanceOfOrder);
        await token1.transfer(orderer, tokenBalanceOfOrder);
      });
      describe("add orders in one box", () => {
        describe("flex order from token0 to token1", () => {
          describe("at first time", () => {
            beforeEach(async () => {
              await token0.approve(boxExchange.address, inAmount, {
                from: orderer,
              });
              await boxExchange.addOrder(
                ORDER_TYPE.FLEX_0_1,
                inAmount,
                orderer,
                {from: orderer}
              );
            });
            it("increases order amount of the orderer", async () => {
              assert.equal(
                (
                  await boxExchange.getOrderAmount(orderer, ORDER_TYPE.FLEX_0_1)
                ).toNumber(),
                inAmount
              );
            });
            it("increases total amount of the order type", async () => {
              const {
                executionStatusNumber,
                flexToken0InAmount,
                strictToken0InAmount,
                flexToken1InAmount,
                strictToken1InAmount,
              } = await boxExchange.getBoxSummary(0);
              assert.equal(executionStatusNumber.toNumber(), 0);
              assert.equal(flexToken0InAmount.toNumber(), inAmount);
              assert.equal(strictToken0InAmount.toNumber(), 0);
              assert.equal(flexToken1InAmount.toNumber(), 0);
              assert.equal(strictToken1InAmount.toNumber(), 0);
            });
            describe("at second time in the same box", () => {
              beforeEach(async () => {
                await token0.approve(boxExchange.address, inAmount, {
                  from: orderer,
                });
                const {
                  receipt,
                } = await boxExchange.addOrder(
                  ORDER_TYPE.FLEX_0_1,
                  inAmount,
                  orderer,
                  {from: orderer}
                );
                console.log("gas used", receipt.gasUsed);
              });
              it("increases order amount of the orderer", async () => {
                assert.equal(
                  (
                    await boxExchange.getOrderAmount(
                      orderer,
                      ORDER_TYPE.FLEX_0_1
                    )
                  ).toNumber(),
                  inAmount * 2
                );
              });
              it("increases total amount of the order type", async () => {
                const {
                  executionStatusNumber,
                  flexToken0InAmount,
                  strictToken0InAmount,
                  flexToken1InAmount,
                  strictToken1InAmount,
                } = await boxExchange.getBoxSummary(0);
                assert.equal(executionStatusNumber.toNumber(), 0);
                assert.equal(flexToken0InAmount.toNumber(), inAmount * 2);
                assert.equal(strictToken0InAmount.toNumber(), 0);
                assert.equal(flexToken1InAmount.toNumber(), 0);
                assert.equal(strictToken1InAmount.toNumber(), 0);
              });
            });
          });
        });
        describe("flex order from token1 to token0", () => {
          describe("at first time", () => {
            beforeEach(async () => {
              await token1.approve(boxExchange.address, inAmount, {
                from: orderer,
              });
              await boxExchange.addOrder(
                ORDER_TYPE.FLEX_1_0,
                inAmount,
                orderer,
                {from: orderer}
              );
            });
            it("increases order amount of the orderer", async () => {
              assert.equal(
                (
                  await boxExchange.getOrderAmount(orderer, ORDER_TYPE.FLEX_1_0)
                ).toNumber(),
                inAmount
              );
            });
            it("increases total amount of the order type", async () => {
              const {
                executionStatusNumber,
                flexToken0InAmount,
                strictToken0InAmount,
                flexToken1InAmount,
                strictToken1InAmount,
              } = await boxExchange.getBoxSummary(0);
              assert.equal(executionStatusNumber.toNumber(), 0);
              assert.equal(flexToken0InAmount.toNumber(), 0);
              assert.equal(strictToken0InAmount.toNumber(), 0);
              assert.equal(flexToken1InAmount.toNumber(), inAmount);
              assert.equal(strictToken1InAmount.toNumber(), 0);
            });
            describe("at second time in the same box", () => {
              beforeEach(async () => {
                await token1.approve(boxExchange.address, inAmount, {
                  from: orderer,
                });
                await boxExchange.addOrder(
                  ORDER_TYPE.FLEX_1_0,
                  inAmount,
                  orderer,
                  {from: orderer}
                );
              });
              it("increases order amount of the orderer", async () => {
                assert.equal(
                  (
                    await boxExchange.getOrderAmount(
                      orderer,
                      ORDER_TYPE.FLEX_1_0
                    )
                  ).toNumber(),
                  inAmount * 2
                );
              });
              it("increases total amount of the order type", async () => {
                const {
                  executionStatusNumber,
                  flexToken0InAmount,
                  strictToken0InAmount,
                  flexToken1InAmount,
                  strictToken1InAmount,
                } = await boxExchange.getBoxSummary(0);
                assert.equal(executionStatusNumber.toNumber(), 0);
                assert.equal(flexToken0InAmount.toNumber(), 0);
                assert.equal(strictToken0InAmount.toNumber(), 0);
                assert.equal(flexToken1InAmount.toNumber(), inAmount * 2);
                assert.equal(strictToken1InAmount.toNumber(), 0);
              });
            });
          });
        });
        describe("strict order from token0 to token1", () => {
          describe("at first time", () => {
            beforeEach(async () => {
              await token0.approve(boxExchange.address, inAmount, {
                from: orderer,
              });
              await boxExchange.addOrder(
                ORDER_TYPE.STRICT_0_1,
                inAmount,
                orderer,
                {from: orderer}
              );
            });
            it("increases order amount of the orderer", async () => {
              assert.equal(
                (
                  await boxExchange.getOrderAmount(
                    orderer,
                    ORDER_TYPE.STRICT_0_1
                  )
                ).toNumber(),
                inAmount
              );
            });
            it("increases total amount of the order type", async () => {
              const {
                executionStatusNumber,
                flexToken0InAmount,
                strictToken0InAmount,
                flexToken1InAmount,
                strictToken1InAmount,
              } = await boxExchange.getBoxSummary(0);
              assert.equal(executionStatusNumber.toNumber(), 0);
              assert.equal(flexToken0InAmount.toNumber(), 0);
              assert.equal(strictToken0InAmount.toNumber(), inAmount);
              assert.equal(flexToken1InAmount.toNumber(), 0);
              assert.equal(strictToken1InAmount.toNumber(), 0);
            });
            describe("at second time in the same box", () => {
              beforeEach(async () => {
                await token0.approve(boxExchange.address, inAmount, {
                  from: orderer,
                });
                await boxExchange.addOrder(
                  ORDER_TYPE.STRICT_0_1,
                  inAmount,
                  orderer,
                  {from: orderer}
                );
              });
              it("increases order amount of the orderer", async () => {
                assert.equal(
                  (
                    await boxExchange.getOrderAmount(
                      orderer,
                      ORDER_TYPE.STRICT_0_1
                    )
                  ).toNumber(),
                  inAmount * 2
                );
              });
              it("increases total amount of the order type", async () => {
                const {
                  executionStatusNumber,
                  flexToken0InAmount,
                  strictToken0InAmount,
                  flexToken1InAmount,
                  strictToken1InAmount,
                } = await boxExchange.getBoxSummary(0);
                assert.equal(executionStatusNumber.toNumber(), 0);
                assert.equal(flexToken0InAmount.toNumber(), 0);
                assert.equal(strictToken0InAmount.toNumber(), inAmount * 2);
                assert.equal(flexToken1InAmount.toNumber(), 0);
                assert.equal(strictToken1InAmount.toNumber(), 0);
              });
            });
          });
        });
        describe("strict order from token1 to token0", () => {
          describe("at first time", () => {
            beforeEach(async () => {
              await token1.approve(boxExchange.address, inAmount, {
                from: orderer,
              });
              await boxExchange.addOrder(
                ORDER_TYPE.STRICT_1_0,
                inAmount,
                orderer,
                {from: orderer}
              );
            });
            it("increases order amount of the orderer", async () => {
              assert.equal(
                (
                  await boxExchange.getOrderAmount(
                    orderer,
                    ORDER_TYPE.STRICT_1_0
                  )
                ).toNumber(),
                inAmount
              );
            });
            it("increases total amount of the order type", async () => {
              const {
                executionStatusNumber,
                flexToken0InAmount,
                strictToken0InAmount,
                flexToken1InAmount,
                strictToken1InAmount,
              } = await boxExchange.getBoxSummary(0);
              assert.equal(executionStatusNumber.toNumber(), 0);
              assert.equal(flexToken0InAmount.toNumber(), 0);
              assert.equal(strictToken0InAmount.toNumber(), 0);
              assert.equal(flexToken1InAmount.toNumber(), 0);
              assert.equal(strictToken1InAmount.toNumber(), inAmount);
            });
            describe("at second time in the same box", () => {
              beforeEach(async () => {
                await token1.approve(boxExchange.address, inAmount, {
                  from: orderer,
                });
                await boxExchange.addOrder(
                  ORDER_TYPE.STRICT_1_0,
                  inAmount,
                  orderer,
                  {from: orderer}
                );
              });
              it("increases order amount of the orderer", async () => {
                assert.equal(
                  (
                    await boxExchange.getOrderAmount(
                      orderer,
                      ORDER_TYPE.STRICT_1_0
                    )
                  ).toNumber(),
                  inAmount * 2
                );
              });
              it("increases total amount of the order type", async () => {
                const {
                  executionStatusNumber,
                  flexToken0InAmount,
                  strictToken0InAmount,
                  flexToken1InAmount,
                  strictToken1InAmount,
                } = await boxExchange.getBoxSummary(0);
                assert.equal(executionStatusNumber.toNumber(), 0);
                assert.equal(flexToken0InAmount.toNumber(), 0);
                assert.equal(strictToken0InAmount.toNumber(), 0);
                assert.equal(flexToken1InAmount.toNumber(), 0);
                assert.equal(strictToken1InAmount.toNumber(), inAmount * 2);
              });
            });
          });
        });
      });
      describe("after previous box expires", () => {
        const orderer2 = accounts[3];
        var receipt;
        beforeEach(async () => {
          await token0.approve(boxExchange.address, inAmount, {
            from: orderer,
          });
          await boxExchange.addOrder(ORDER_TYPE.STRICT_0_1, inAmount, orderer, {
            from: orderer,
          });
          await boxExchange.expireBox();
          await token0.transfer(orderer2, inAmount);
          await token0.approve(boxExchange.address, inAmount, {
            from: orderer2,
          });
          receipt = await boxExchange.addOrder(
            ORDER_TYPE.STRICT_0_1,
            inAmount,
            orderer2,
            {from: orderer2}
          );
        });
        it("switch the order to new box", async () => {
          assert.equal(
            (
              await boxExchange.getOrderAmount(orderer, ORDER_TYPE.STRICT_0_1)
            ).toNumber(),
            0
          );
          assert.equal(
            (
              await boxExchange.getOrderAmount(orderer2, ORDER_TYPE.STRICT_0_1)
            ).toNumber(),
            inAmount
          );
        });
        it("emit execute order event", () => {
          expectEvent(receipt, "Execution", {
            isBuy: true,
            recipient: orderer,
            orderAmount: new BN(inAmount),
            refundAmount: new BN(0),
            outAmount: new BN(1998),
          });
        });
        it("pay token for the last order", async () => {
          assert.equal(
            (await token1.balanceOf(orderer)).toNumber(),
            tokenBalanceOfOrder + 1998
          );
        });
        it("update reserves", async () => {
          const reserves = await boxExchange.getReserves();
          assert.equal(reserves._reserve0.toNumber(), initialReserve0 + 1240);
          assert.equal(reserves._reserve1.toNumber(), initialReserve1 - 1998);
        });
        it("update market fee pools", async () => {
          const pools = await boxExchange.getMarketFeePools();
          assert.equal(pools._marketFeePool0.toNumber(), 60);
          assert.equal(pools._marketFeePool1.toNumber(), 0);
        });
      });
    });
    describe("#executeOrders", () => {
      describe("call executeOrders() in several pattern to execute all orders in block", () => {
        // [reserve] 1000000: 2000000
        //           rate 2
        // [spread rate] 30%
        // [market fee rate] 20%
        //
        // [total of orders]
        // flex   token 0 in => 5000  (without spread 3846)
        // strict token 0 in => 5000  (without spread 3846)
        // flex   token 1 in => 5000  (without spread 3846)
        // strict token 1 in => 5000  (without spread 3846)
        //
        // [rate and refund amount]
        // when execute all orders, rate will be
        // 2007692/1007692 = 1.992
        // 2*0.95 = 1.9 < 1.992 < 2*0.999 = 1.998
        //
        // when refund all strict token0 in orders, rate will be
        // 2007692/1003846 = 2
        // 1.998 < 2 < 2*1.001 = 2.002
        //
        // so, the rate is 1.998 and some of strict token0 in orders will be refunded.
        // total refund amount without spread is
        // 1007692 - 2007692/1.998( = 1004850) = 2842
        // refundRate of strict token0 in order is
        // 2842/3846 = 0.738949557982319292
        //
        // [payment for orderer]
        //         | token0 in | token0 refund | spread | token0 swapped | token1 swapped
        // flex0   | 1000      | 0             | 231 | 769            | 1536
        // strict0 | 1000      | 738           | 61  | 201            | 401
        //
        //         | token1 in | token1 refund | spread | token1 swapped | token0 swapped
        // flex1   | 1000      | 0             | 231 | 769            | 384
        // strict1 | 1000      | 0             | 231 | 769            | 384
        // ----------------------------
        //
        // [balance of orderer]
        // token0 1506       token1 1937
        //
        // [market fee]
        // token0: (4850) * 0.3 * 0.2 = 291
        // token1: (7692) * 0.3 * 0.2 = 461
        //
        // [diff of reserve]
        // token0: 4850 + (4850 * 0.3 - 291) - 7692/1.998  = 2165
        // token1: 7692 + (7692 * 0.3 - 461) - 4850*1.998  = -152
        //
        const orderers = accounts.slice(2, 7);
        const inAmount = 1000;
        const executePatterns = [
          [20],
          [5, 10, 5],
          [1, 4, 2, 2, 11],
          [1, 5, 6, 4, 4],
        ];
        beforeEach(async () => {
          await token0.approve(boxExchange.address, initialReserve0);
          await token1.approve(boxExchange.address, initialReserve1);
          await boxExchange.init(
            initialReserve0,
            initialReserve1,
            initialShare
          );
          for (const orderer of orderers) {
            await token0.transfer(orderer, inAmount * 2);
            await token1.transfer(orderer, inAmount * 2);
            await token0.approve(boxExchange.address, inAmount * 2, {
              from: orderer,
            });
            await token1.approve(boxExchange.address, inAmount * 2, {
              from: orderer,
            });
            await boxExchange.addOrder(ORDER_TYPE.FLEX_0_1, inAmount, orderer, {
              from: orderer,
            });
            await boxExchange.addOrder(
              ORDER_TYPE.STRICT_0_1,
              inAmount,
              orderer,
              {from: orderer}
            );
            await boxExchange.addOrder(ORDER_TYPE.FLEX_1_0, inAmount, orderer, {
              from: orderer,
            });
            await boxExchange.addOrder(
              ORDER_TYPE.STRICT_1_0,
              inAmount,
              orderer,
              {from: orderer}
            );
          }
          await boxExchange.expireBox();
        });
        for (const executePattern of executePatterns) {
          describe("pattern:  " + executePattern.toString(), () => {
            let events = [];
            beforeEach(async () => {
              for (const executeNum of executePattern) {
                const {receipt, logs} = await boxExchange.executeOrders(
                  executeNum
                );
                console.log(
                  "executeNum:",
                  executeNum,
                  "gasUsed:",
                  receipt.gasUsed
                );
                events.push(logs.filter((log) => log.event == "Execution"));
              }
            });
            it("emits execution events", async () => {
              for (let i = 0; i < executePattern.length; i++) {
                assert.equal(events[i].length, executePattern[i]);
              }
            });
            it("pays for order", async () => {
              for (const orderer of orderers) {
                const token0Balance = await token0.balanceOf(orderer);
                const token1Balance = await token1.balanceOf(orderer);
                assert.equal(token0Balance.toNumber(), 1507);
                assert.equal(token1Balance.toNumber(), 1935);
              }
            });
            it("update reserves", async () => {
              const reserves = await boxExchange.getReserves();
              assert.equal(
                reserves._reserve0.toNumber(),
                initialReserve0 + 2164
              );
              assert.equal(
                reserves._reserve1.toNumber(),
                initialReserve1 - 150
              );
            });

            it("update market fee pools", async () => {
              const pools = await boxExchange.getMarketFeePools();
              assert.equal(pools._marketFeePool0.toNumber(), 290);
              assert.equal(pools._marketFeePool1.toNumber(), 461);
              // token0 reserve: 1002165 pool: 291 balance: 1002470
              // token1 reserve: 1999488 pool: 461 balance: 2000315
              console.group(
                " some tokens in boxExchange are not counted as neither of spread pool or reserve!!"
              );
              console.log(
                "token0 reserve:",
                initialReserve0 + 2165,
                "pool:",
                291,
                "balance:",
                (await token0.balanceOf(boxExchange.address)).toNumber()
              ); // 1002470
              console.log(
                "token1 reserve:",
                initialReserve1 - 512,
                "pool:",
                461,
                "balance:",
                (await token1.balanceOf(boxExchange.address)).toNumber()
              ); // 1002470
              console.groupEnd();
            });
          });
        }
      });
      describe("call multiple times to execute multiple boxes", () => {
        const orderer = accounts[2];
        beforeEach(async () => {
          await token0.approve(boxExchange.address, initialReserve0);
          await token1.approve(boxExchange.address, initialReserve1);
          await boxExchange.init(
            initialReserve0,
            initialReserve1,
            initialShare
          );
          await token0.transfer(orderer, 20);
          await token0.approve(boxExchange.address, 20, {
            from: orderer,
          });
          await boxExchange.addOrder(ORDER_TYPE.FLEX_0_1, 5, orderer, {
            from: orderer,
          });
          await boxExchange.addOrder(ORDER_TYPE.STRICT_0_1, 5, orderer, {
            from: orderer,
          });
          await boxExchange.expireBox();
          await boxExchange.addOrder(ORDER_TYPE.FLEX_0_1, 5, orderer, {
            from: orderer,
          });
          await boxExchange.addOrder(ORDER_TYPE.STRICT_0_1, 5, orderer, {
            from: orderer,
          });
          await boxExchange.expireBox();
          await boxExchange.executeOrders(10);
          await boxExchange.executeOrders(10);
          await boxExchange.executeOrders(10);
        });
        it("executes orders in expired blocks", async () => {
          const token0Balance = await token0.balanceOf(orderer);
          const token1Balance = await token1.balanceOf(orderer);
          // inAmount = 5, withoutSpread = floor(5/1.3) = 3, outAmount = floor(3 * 1.99..) = 5
          assert.equal(token0Balance.toNumber(), 0);
          assert.equal(token1Balance.toNumber(), 5 * 4);
        });
      });
    });

    describe("#getBoxSummary", () => {
      const orderer = accounts[2];
      const orderer2 = accounts[3];
      const tokenBalanceOfOrder = 10000;
      const inAmount1 = 1300;
      const inAmount2 = 1000;
      const smallAmount = 100;
      beforeEach(async () => {
        await token0.approve(boxExchange.address, initialReserve0);
        await token1.approve(boxExchange.address, initialReserve1);

        await boxExchange.init(initialReserve0, initialReserve1, initialShare);
        await token0.transfer(orderer, tokenBalanceOfOrder);
        await token1.transfer(orderer, tokenBalanceOfOrder);
        await token0.approve(boxExchange.address, inAmount1 * 2, {
          from: orderer,
        });
        await token1.approve(boxExchange.address, inAmount1 * 2, {
          from: orderer,
        });
        await token0.transfer(orderer2, tokenBalanceOfOrder);
        await token1.transfer(orderer2, tokenBalanceOfOrder);
        await token0.approve(boxExchange.address, tokenBalanceOfOrder, {
          from: orderer2,
        });
        await token1.approve(boxExchange.address, tokenBalanceOfOrder, {
          from: orderer2,
        });
      });
      describe("Box before boxId is not executed all", () => {
        beforeEach(async () => {
          await boxExchange.addOrder(
            ORDER_TYPE.FLEX_0_1,
            smallAmount,
            orderer,
            {
              from: orderer2,
            }
          );
          await boxExchange.addOrder(
            ORDER_TYPE.FLEX_1_0,
            smallAmount,
            orderer,
            {
              from: orderer2,
            }
          );
          await boxExchange.addOrder(
            ORDER_TYPE.STRICT_0_1,
            smallAmount,
            orderer,
            {
              from: orderer2,
            }
          );
          await boxExchange.addOrder(
            ORDER_TYPE.STRICT_1_0,
            smallAmount,
            orderer,
            {
              from: orderer2,
            }
          );
          await boxExchange.addOrder(
            ORDER_TYPE.STRICT_0_1,
            smallAmount,
            orderer,
            {
              from: orderer,
            }
          );
          await boxExchange.addOrder(
            ORDER_TYPE.STRICT_1_0,
            smallAmount,
            orderer,
            {
              from: orderer,
            }
          );
          await boxExchange.expireBox();
        });
        it("new order is FLEX_0_1", async () => {
          await boxExchange.addOrder(ORDER_TYPE.FLEX_0_1, inAmount1, orderer, {
            from: orderer,
          });
          const {
            executionStatusNumber,
            flexToken0InAmount,
            strictToken0InAmount,
            flexToken1InAmount,
            strictToken1InAmount,
          } = await boxExchange.getBoxSummary(1);
          assert.equal(executionStatusNumber.toNumber(), 0);
          assert.equal(flexToken0InAmount.toNumber(), inAmount1);
          assert.equal(strictToken0InAmount.toNumber(), 0);
          assert.equal(flexToken1InAmount.toNumber(), 0);
          assert.equal(strictToken1InAmount.toNumber(), 0);
        });
        it("new order is FLEX_1_0", async () => {
          await boxExchange.addOrder(ORDER_TYPE.FLEX_1_0, inAmount1, orderer, {
            from: orderer2,
          });
          const {
            executionStatusNumber,
            flexToken0InAmount,
            strictToken0InAmount,
            flexToken1InAmount,
            strictToken1InAmount,
          } = await boxExchange.getBoxSummary(1);
          assert.equal(executionStatusNumber.toNumber(), 0);
          assert.equal(flexToken0InAmount.toNumber(), 0);
          assert.equal(strictToken0InAmount.toNumber(), 0);
          assert.equal(flexToken1InAmount.toNumber(), inAmount1);
          assert.equal(strictToken1InAmount.toNumber(), 0);
        });
        it("new order is STRICT_0_1", async () => {
          await boxExchange.addOrder(
            ORDER_TYPE.STRICT_0_1,
            inAmount1,
            orderer,
            {
              from: orderer2,
            }
          );
          const {
            executionStatusNumber,
            flexToken0InAmount,
            strictToken0InAmount,
            flexToken1InAmount,
            strictToken1InAmount,
          } = await boxExchange.getBoxSummary(1);
          assert.equal(executionStatusNumber.toNumber(), 0);
          assert.equal(flexToken0InAmount.toNumber(), 0);
          assert.equal(strictToken0InAmount.toNumber(), inAmount1);
          assert.equal(flexToken1InAmount.toNumber(), 0);
          assert.equal(strictToken1InAmount.toNumber(), 0);
        });
        it("new order is FLEX_1_0", async () => {
          await boxExchange.addOrder(
            ORDER_TYPE.STRICT_1_0,
            inAmount1,
            orderer,
            {
              from: orderer2,
            }
          );
          const {
            executionStatusNumber,
            flexToken0InAmount,
            strictToken0InAmount,
            flexToken1InAmount,
            strictToken1InAmount,
          } = await boxExchange.getBoxSummary(1);
          assert.equal(executionStatusNumber.toNumber(), 0);
          assert.equal(flexToken0InAmount.toNumber(), 0);
          assert.equal(strictToken0InAmount.toNumber(), 0);
          assert.equal(flexToken1InAmount.toNumber(), 0);
          assert.equal(strictToken1InAmount.toNumber(), inAmount1);
        });
      });

      describe("all boxes before boxId is executed, but target box is not being executed", () => {
        beforeEach(async () => {
          await boxExchange.addOrder(
            ORDER_TYPE.FLEX_0_1,
            smallAmount,
            orderer,
            {
              from: orderer2,
            }
          );
          await boxExchange.expireBox();
        });
        it("new order is FLEX_0_1", async () => {
          await boxExchange.addOrder(ORDER_TYPE.FLEX_0_1, inAmount1, orderer, {
            from: orderer,
          });
          const {
            executionStatusNumber,
            flexToken0InAmount,
            strictToken0InAmount,
            flexToken1InAmount,
            strictToken1InAmount,
          } = await boxExchange.getBoxSummary(1);
          assert.equal(executionStatusNumber.toNumber(), 0);
          assert.equal(flexToken0InAmount.toNumber(), inAmount1);
          assert.equal(strictToken0InAmount.toNumber(), 0);
          assert.equal(flexToken1InAmount.toNumber(), 0);
          assert.equal(strictToken1InAmount.toNumber(), 0);
        });
        it("new order is FLEX_1_0", async () => {
          await boxExchange.addOrder(ORDER_TYPE.FLEX_1_0, inAmount1, orderer, {
            from: orderer2,
          });
          const {
            executionStatusNumber,
            flexToken0InAmount,
            strictToken0InAmount,
            flexToken1InAmount,
            strictToken1InAmount,
          } = await boxExchange.getBoxSummary(1);
          assert.equal(executionStatusNumber.toNumber(), 0);
          assert.equal(flexToken0InAmount.toNumber(), 0);
          assert.equal(strictToken0InAmount.toNumber(), 0);
          assert.equal(flexToken1InAmount.toNumber(), inAmount1);
          assert.equal(strictToken1InAmount.toNumber(), 0);
        });
        it("new order is STRICT_0_1", async () => {
          await boxExchange.addOrder(
            ORDER_TYPE.STRICT_0_1,
            inAmount1,
            orderer,
            {
              from: orderer2,
            }
          );
          const {
            executionStatusNumber,
            flexToken0InAmount,
            strictToken0InAmount,
            flexToken1InAmount,
            strictToken1InAmount,
          } = await boxExchange.getBoxSummary(1);
          assert.equal(executionStatusNumber.toNumber(), 0);
          assert.equal(flexToken0InAmount.toNumber(), 0);
          assert.equal(strictToken0InAmount.toNumber(), inAmount1);
          assert.equal(flexToken1InAmount.toNumber(), 0);
          assert.equal(strictToken1InAmount.toNumber(), 0);
        });
        it("new order is STRICT_1_0", async () => {
          await boxExchange.addOrder(
            ORDER_TYPE.STRICT_1_0,
            inAmount1,
            orderer,
            {
              from: orderer2,
            }
          );
          const {
            executionStatusNumber,
            flexToken0InAmount,
            strictToken0InAmount,
            flexToken1InAmount,
            strictToken1InAmount,
          } = await boxExchange.getBoxSummary(1);
          assert.equal(executionStatusNumber.toNumber(), 0);
          assert.equal(flexToken0InAmount.toNumber(), 0);
          assert.equal(strictToken0InAmount.toNumber(), 0);
          assert.equal(flexToken1InAmount.toNumber(), 0);
          assert.equal(strictToken1InAmount.toNumber(), inAmount1);
        });
      });
      describe("Target boxId is currently being executed", () => {
        beforeEach(async () => {
          await boxExchange.addOrder(ORDER_TYPE.FLEX_0_1, inAmount2, orderer, {
            from: orderer,
          });
          await boxExchange.addOrder(ORDER_TYPE.FLEX_0_1, inAmount2, orderer2, {
            from: orderer2,
          });
          await boxExchange.addOrder(ORDER_TYPE.FLEX_1_0, inAmount2, orderer, {
            from: orderer2,
          });
          await boxExchange.addOrder(
            ORDER_TYPE.STRICT_1_0,
            inAmount2,
            orderer,
            {
              from: orderer,
            }
          );
          await boxExchange.addOrder(
            ORDER_TYPE.STRICT_0_1,
            inAmount2,
            orderer,
            {
              from: orderer,
            }
          );
          await boxExchange.addOrder(
            ORDER_TYPE.STRICT_1_0,
            inAmount2,
            orderer2,
            {
              from: orderer2,
            }
          );
          await boxExchange.expireBox();
        });

        it("one FLEX_0_1 order is executed", async () => {
          await boxExchange.executeOrders(1);
          const {
            executionStatusNumber,
            flexToken0InAmount,
            strictToken0InAmount,
            flexToken1InAmount,
            strictToken1InAmount,
          } = await boxExchange.getBoxSummary(0);
          assert.equal(executionStatusNumber.toNumber(), 1);
          assert.equal(flexToken0InAmount.toNumber(), inAmount2 * 2);
          assert.equal(flexToken1InAmount.toNumber(), inAmount2);
          assert.equal(strictToken0InAmount.toNumber(), inAmount2);
          assert.equal(strictToken1InAmount.toNumber(), inAmount2 * 2);
        });

        it("all FLEX_0_1 order is executed", async () => {
          await boxExchange.executeOrders(2);
          const {
            executionStatusNumber,
            flexToken0InAmount,
            strictToken0InAmount,
            flexToken1InAmount,
            strictToken1InAmount,
          } = await boxExchange.getBoxSummary(0);
          assert.equal(executionStatusNumber.toNumber(), 1);
          assert.equal(flexToken0InAmount.toNumber(), 0);
          assert.equal(flexToken1InAmount.toNumber(), inAmount2);
          assert.equal(strictToken0InAmount.toNumber(), inAmount2);
          assert.equal(strictToken1InAmount.toNumber(), inAmount2 * 2);
        });
        it("FLEX_1_0 order is executed", async () => {
          await boxExchange.executeOrders(3);
          const {
            executionStatusNumber,
            flexToken0InAmount,
            strictToken0InAmount,
            flexToken1InAmount,
            strictToken1InAmount,
          } = await boxExchange.getBoxSummary(0);
          assert.equal(executionStatusNumber.toNumber(), 1);
          assert.equal(flexToken0InAmount.toNumber(), 0);
          assert.equal(flexToken1InAmount.toNumber(), 0);
          assert.equal(strictToken0InAmount.toNumber(), inAmount2);
          assert.equal(strictToken1InAmount.toNumber(), inAmount2 * 2);
        });
        it("one STRICT_0_1 order is executed", async () => {
          await boxExchange.executeOrders(4);
          const {
            executionStatusNumber,
            flexToken0InAmount,
            strictToken0InAmount,
            flexToken1InAmount,
            strictToken1InAmount,
          } = await boxExchange.getBoxSummary(0);
          assert.equal(executionStatusNumber.toNumber(), 1);
          assert.equal(flexToken0InAmount.toNumber(), 0);
          assert.equal(flexToken1InAmount.toNumber(), 0);
          assert.equal(strictToken0InAmount.toNumber(), 0);
          assert.equal(strictToken1InAmount.toNumber(), inAmount2 * 2);
        });

        it("one STRICT_0_1 order is executed", async () => {
          await boxExchange.executeOrders(5);
          const {
            executionStatusNumber,
            flexToken0InAmount,
            strictToken0InAmount,
            flexToken1InAmount,
            strictToken1InAmount,
          } = await boxExchange.getBoxSummary(0);
          assert.equal(executionStatusNumber.toNumber(), 1);
          assert.equal(flexToken0InAmount.toNumber(), 0);
          assert.equal(flexToken1InAmount.toNumber(), 0);
          assert.equal(strictToken0InAmount.toNumber(), 0);
          assert.equal(strictToken1InAmount.toNumber(), inAmount2 * 2);
        });

        it("all STRICT_1_0 order is executed", async () => {
          await boxExchange.executeOrders(6);
          const {
            executionStatusNumber,
            flexToken0InAmount,
            strictToken0InAmount,
            flexToken1InAmount,
            strictToken1InAmount,
          } = await boxExchange.getBoxSummary(0);
          assert.equal(executionStatusNumber.toNumber(), 2);
          assert.equal(flexToken0InAmount.toNumber(), 0);
          assert.equal(flexToken1InAmount.toNumber(), 0);
          assert.equal(strictToken0InAmount.toNumber(), 0);
          assert.equal(strictToken1InAmount.toNumber(), 0);
        });
      });

      describe("Target boxId is already executed", () => {
        it("all orders in current box is executed", async () => {
          await boxExchange.addOrder(ORDER_TYPE.FLEX_0_1, inAmount2, orderer, {
            from: orderer2,
          });
          await boxExchange.addOrder(ORDER_TYPE.FLEX_1_0, inAmount2, orderer, {
            from: orderer2,
          });
          await boxExchange.addOrder(
            ORDER_TYPE.STRICT_1_0,
            inAmount2,
            orderer,
            {
              from: orderer2,
            }
          );
          await boxExchange.addOrder(
            ORDER_TYPE.STRICT_0_1,
            inAmount2,
            orderer,
            {
              from: orderer,
            }
          );
          await boxExchange.expireBox();
          await boxExchange.executeOrders(4);
          const {
            executionStatusNumber,
            flexToken0InAmount,
            strictToken0InAmount,
            flexToken1InAmount,
            strictToken1InAmount,
          } = await boxExchange.getBoxSummary(0);
          assert.equal(executionStatusNumber.toNumber(), 2);
          assert.equal(flexToken0InAmount.toNumber(), 0);
          assert.equal(strictToken0InAmount.toNumber(), 0);
          assert.equal(flexToken1InAmount.toNumber(), 0);
          assert.equal(strictToken1InAmount.toNumber(), 0);
        });
        it("new order is FLEX_0_1", async () => {
          await boxExchange.addOrder(ORDER_TYPE.FLEX_0_1, inAmount2, orderer, {
            from: orderer2,
          });
          await boxExchange.addOrder(ORDER_TYPE.FLEX_1_0, inAmount2, orderer, {
            from: orderer2,
          });
          await boxExchange.addOrder(
            ORDER_TYPE.STRICT_1_0,
            inAmount2,
            orderer,
            {
              from: orderer2,
            }
          );
          await boxExchange.addOrder(
            ORDER_TYPE.STRICT_0_1,
            inAmount2,
            orderer,
            {
              from: orderer,
            }
          );
          await boxExchange.expireBox();
          await boxExchange.addOrder(
            ORDER_TYPE.STRICT_0_1,
            inAmount2,
            orderer,
            {
              from: orderer,
            }
          );
          await boxExchange.expireBox();
          const {
            executionStatusNumber,
            flexToken0InAmount,
            strictToken0InAmount,
            flexToken1InAmount,
            strictToken1InAmount,
          } = await boxExchange.getBoxSummary(0);
          assert.equal(executionStatusNumber.toNumber(), 2);
          assert.equal(flexToken0InAmount.toNumber(), 0);
          assert.equal(strictToken0InAmount.toNumber(), 0);
          assert.equal(flexToken1InAmount.toNumber(), 0);
          assert.equal(strictToken1InAmount.toNumber(), 0);
        });
      });
    });

    describe("#getExchangeData", () => {
      const orderer = accounts[1];
      beforeEach(async () => {
        await token0.transfer(orderer, 10000);
        await token1.transfer(orderer, 10000);
        await token0.approve(boxExchange.address, 10000, {from: orderer});
        await token1.approve(boxExchange.address, 10000, {from: orderer});
        await token0.approve(boxExchange.address, 1000000);
        await token1.approve(boxExchange.address, 1000000);
      });
      it("case0", async () => {
        await boxExchange.init(1000000, 1000000, 1000);
        let data = await boxExchange.getExchangeData();
        assert.equal(data[0].toString(), "0");
        assert.equal(data[1].toString(), "1000000");
        assert.equal(data[2].toString(), "1000000");
        assert.equal(data[3].toString(), "1000");
        assert.equal(data[4].toString(), spreadRate);
        assert.equal(data[5].toString(), "1000000000000000000000");
        assert.equal(data[6].toString(), "1000000000000000000000");
      });

      it("case1", async () => {
        await boxExchange.init(500000, 1000000, 10000);
        let data = await boxExchange.getExchangeData();
        assert.equal(data[0].toString(), "0");
        assert.equal(data[1].toString(), "500000");
        assert.equal(data[2].toString(), "1000000");
        assert.equal(data[3].toString(), "10000");
        assert.equal(data[4].toString(), spreadRate);
        assert.equal(data[5].toString(), "50000000000000000000");
        assert.equal(data[6].toString(), "100000000000000000000");
      });

      it("case2", async () => {
        await boxExchange.init(1000000, 500000, 100000);
        let data = await boxExchange.getExchangeData();
        assert.equal(data[0].toString(), "0");
        assert.equal(data[1].toString(), "1000000");
        assert.equal(data[2].toString(), "500000");
        assert.equal(data[3].toString(), "100000");
        assert.equal(data[4].toString(), spreadRate);
        assert.equal(data[5].toString(), "10000000000000000000");
        assert.equal(data[6].toString(), "5000000000000000000");
      });

      it("case3", async () => {
        await boxExchange.init(1000000, 1000000, 10000000);
        let data = await boxExchange.getExchangeData();
        assert.equal(data[0].toString(), "0");
        assert.equal(data[1].toString(), "1000000");
        assert.equal(data[2].toString(), "1000000");
        assert.equal(data[3].toString(), "10000000");
        assert.equal(data[4].toString(), spreadRate);
        assert.equal(data[5].toString(), "100000000000000000");
        assert.equal(data[6].toString(), "100000000000000000");
      });

      it("case4", async () => {
        await boxExchange.init(1000000, 1000000, 10000000);
        await boxExchange.expireBox();
        await boxExchange.addOrder(ORDER_TYPE.FLEX_0_1, 100, orderer, {
          from: orderer,
        });
        let data = await boxExchange.getExchangeData();
        assert.equal(data[0].toString(), "1");
        assert.equal(data[1].toString(), "1000000");
        assert.equal(data[2].toString(), "1000000");
        assert.equal(data[3].toString(), "10000000");
        assert.equal(data[4].toString(), spreadRate);
        assert.equal(data[5].toString(), "100000000000000000");
        assert.equal(data[6].toString(), "100000000000000000");
      });
    });
  });
});
