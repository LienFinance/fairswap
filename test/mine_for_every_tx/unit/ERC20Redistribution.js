const {balance} = require("@openzeppelin/test-helpers");

const ERC20RedistributionMock = artifacts.require("ERC20RedistributionMock");
const LienTokenMock = artifacts.require("LienTokenMock");
const TestERC20 = artifacts.require("TestERC20");

contract("ERC20Redistribution", function (accounts) {
    var contract;
    const totalSupply = 10000000000;
    const expiration = 5;
    const arithmeticSeries = (first, num, diff) => {
        return (num * (2 * first + (num - 1) * diff)) / 2;
    };
    beforeEach(async () => {
        lienToken = await LienTokenMock.new(expiration);
        await web3.eth.sendTransaction({
            from: accounts[0],
            to: lienToken.address,
            value: 1000
        });
        contract = await ERC20RedistributionMock.new(
            lienToken.address,
            totalSupply
        );
    });
    describe("transfer", () => {
        describe("each time term proceeds", () => {
            beforeEach(async () => {
                await contract.transfer(accounts[1], 100);
                await lienToken.incrementTerm(1);
                await contract.transfer(accounts[1], 100);
                await lienToken.incrementTerm(2);
                await contract.transfer(accounts[1], 100);
                await contract.transfer(accounts[1], 100);
                await lienToken.incrementTerm(1);
                await contract.transfer(accounts[2], 100);
            });
            it("take snapshot on each end of term", async () => {
                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[0], 1)
                    ).toNumber(),
                    totalSupply - 100
                );
                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[1], 1)
                    ).toNumber(),
                    100
                );
                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[2], 1)
                    ).toNumber(),
                    0
                );

                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[0], 2)
                    ).toNumber(),
                    totalSupply - 200
                );
                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[1], 2)
                    ).toNumber(),
                    200
                );
                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[2], 2)
                    ).toNumber(),
                    0
                );

                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[0], 3)
                    ).toNumber(),
                    totalSupply - 200
                );
                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[1], 3)
                    ).toNumber(),
                    200
                );
                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[2], 3)
                    ).toNumber(),
                    0
                );

                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[0], 4)
                    ).toNumber(),
                    totalSupply - 400
                );
                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[1], 4)
                    ).toNumber(),
                    400
                );
                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[2], 4)
                    ).toNumber(),
                    0
                );

                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[0], 5)
                    ).toNumber(),
                    totalSupply - 500
                );
                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[1], 5)
                    ).toNumber(),
                    400
                );
                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[2], 5)
                    ).toNumber(),
                    100
                );
            });
        });
    });
    describe("mint", () => {
        describe("each time term proceeds", () => {
            beforeEach(async () => {
                await contract.mint(accounts[1], 100);
                await lienToken.incrementTerm(1);
                await contract.mint(accounts[1], 100);
                await lienToken.incrementTerm(2);
                await contract.mint(accounts[1], 100);
                await contract.mint(accounts[1], 100);
                await lienToken.incrementTerm(1);
                await contract.mint(accounts[2], 100);
            });
            it("take snapshot on each end of term", async () => {
                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[1], 1)
                    ).toNumber(),
                    100
                );
                assert.equal(
                    (await contract.totalSupplyAtTermEnd(1)).toNumber(),
                    totalSupply + 100
                );

                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[1], 2)
                    ).toNumber(),
                    200
                );
                assert.equal(
                    (await contract.totalSupplyAtTermEnd(2)).toNumber(),
                    totalSupply + 200
                );

                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[1], 3)
                    ).toNumber(),
                    200
                );
                assert.equal(
                    (await contract.totalSupplyAtTermEnd(3)).toNumber(),
                    totalSupply + 200
                );

                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[1], 4)
                    ).toNumber(),
                    400
                );
                assert.equal(
                    (await contract.totalSupplyAtTermEnd(4)).toNumber(),
                    totalSupply + 400
                );

                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[1], 5)
                    ).toNumber(),
                    400
                );
                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[2], 5)
                    ).toNumber(),
                    100
                );
                assert.equal(
                    (await contract.totalSupplyAtTermEnd(5)).toNumber(),
                    totalSupply + 500
                );
            });
        });
    });
    describe("burn", () => {
        describe("each time term proceeds", () => {
            beforeEach(async () => {
                await contract.transfer(accounts[1], 100);
                await contract.burn(accounts[0], 100);
                await lienToken.incrementTerm(1);
                await contract.burn(accounts[0], 100);
                await lienToken.incrementTerm(2);
                await contract.burn(accounts[0], 100);
                await contract.burn(accounts[0], 100);
                await lienToken.incrementTerm(1);
            });
            it("take snapshot on each end of term", async () => {
                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[0], 1)
                    ).toNumber(),
                    totalSupply - 100 - 100
                );
                assert.equal(
                    (await contract.totalSupplyAtTermEnd(1)).toNumber(),
                    totalSupply - 100
                );

                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[0], 2)
                    ).toNumber(),
                    totalSupply - 100 - 200
                );
                assert.equal(
                    (await contract.totalSupplyAtTermEnd(2)).toNumber(),
                    totalSupply - 200
                );

                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[0], 3)
                    ).toNumber(),
                    totalSupply - 100 - 200
                );
                assert.equal(
                    (await contract.totalSupplyAtTermEnd(3)).toNumber(),
                    totalSupply - 200
                );

                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[0], 4)
                    ).toNumber(),
                    totalSupply - 100 - 400
                );
                assert.equal(
                    (await contract.totalSupplyAtTermEnd(4)).toNumber(),
                    totalSupply - 400
                );

                assert.equal(
                    (
                        await contract.balanceOfAtTermEnd(accounts[0], 5)
                    ).toNumber(),
                    totalSupply - 100 - 400
                );
                assert.equal(
                    (await contract.totalSupplyAtTermEnd(5)).toNumber(),
                    totalSupply - 400
                );
            });
        });
    });
    describe("receiveDividendToken", () => {
        var token1;
        var token2;
        const recipients = [
            {
                account: accounts[2],
                amountOfERC20Redistribution: 10000000000
            },
            {
                account: accounts[3],
                amountOfERC20Redistribution: 30000000000
            }
        ];
        var totalSupplyOfERC20Redistribution;
        var totalDividendOfToken1;
        var totalDividendOfToken2;
        beforeEach(async () => {
            token1 = await TestERC20.new(lienToken.address, totalSupply);
            token2 = await TestERC20.new(lienToken.address, totalSupply);
            for (let i = 1; i <= expiration * 2; i++) {
                await lienToken.setDividendTokenAt(token1.address, i * 10, i);
                await lienToken.setDividendTokenAt(token2.address, i * 20, i);
            }
            for (const recipient of recipients) {
                await contract.mint(
                    recipient.account,
                    recipient.amountOfERC20Redistribution
                );
            }
            totalSupplyOfERC20Redistribution = (
                await contract.totalSupply()
            ).toNumber();
        });
        describe("call at term 1", () => {
            beforeEach(async () => {
                totalDividendOfToken1 = 0;
                totalDividendOfToken2 = 0;
                for (const recipient of recipients) {
                    await contract.receiveDividendToken(token1.address, {
                        from: recipient.account
                    });
                }
            });
            it("moves dividends on every closed term", async () => {
                assert.equal(
                    (await token1.balanceOf(contract.address)).toNumber(),
                    totalDividendOfToken1
                );
            });
            it("records received dividends", async () => {
                for (let i = 1; i <= expiration * 2; i++) {
                    assert.equal(
                        (
                            await contract.totalDividendTokenAt(
                                token1.address,
                                i
                            )
                        ).toNumber(),
                        0
                    );
                }
            });
            it("does not receive any token", async () => {
                for (const recipient of recipients) {
                    assert.equal(
                        (await token1.balanceOf(recipient.account)).toNumber(),
                        0
                    );
                }
            });
        });
        describe("call at term" + expiration, () => {
            beforeEach(async () => {
                await lienToken.incrementTerm(expiration - 1);
                for (const recipient of recipients) {
                    await contract.receiveDividendToken(token1.address, {
                        from: recipient.account
                    });
                }
                totalDividendOfToken1 = arithmeticSeries(
                    10,
                    expiration - 1,
                    10
                );
            });
            it("moves dividends on every closed term", async () => {
                assert.equal(
                    (await token1.balanceOf(contract.address)).toNumber(),
                    totalDividendOfToken1 / 5
                );
            });
            it("records received dividends", async () => {
                for (let i = 1; i <= expiration - 1; i++) {
                    assert.equal(
                        (
                            await contract.totalDividendTokenAt(
                                token1.address,
                                i
                            )
                        ).toNumber(),
                        i * 10
                    );
                }
                for (let i = expiration; i <= expiration * 2; i++) {
                    assert.equal(
                        (
                            await contract.totalDividendTokenAt(
                                token1.address,
                                i
                            )
                        ).toNumber(),
                        0
                    );
                }
            });
            it(
                "receives dividends of token on from term1 to term" +
                    (expiration - 1),
                async () => {
                    for (const recipient of recipients) {
                        dividend = Math.floor(
                            (totalDividendOfToken1 *
                                recipient.amountOfERC20Redistribution) /
                                totalSupplyOfERC20Redistribution
                        );
                        assert.equal(
                            (
                                await token1.balanceOf(recipient.account)
                            ).toNumber(),
                            dividend
                        );
                    }
                }
            );
            describe("when call for token2", () => {
                beforeEach(async () => {
                    for (const recipient of recipients) {
                        await contract.receiveDividendToken(token2.address, {
                            from: recipient.account
                        });
                    }
                    totalDividendOfToken2 = arithmeticSeries(
                        20,
                        expiration - 1,
                        20
                    );
                });
                it("does not change balance of received dividends of token 1", async () => {
                    assert.equal(
                        (await token1.balanceOf(contract.address)).toNumber(),
                        totalDividendOfToken1 / 5
                    );
                });
                it("does not change records of received dividends of token1", async () => {
                    for (let i = 1; i <= expiration - 1; i++) {
                        assert.equal(
                            (
                                await contract.totalDividendTokenAt(
                                    token1.address,
                                    i
                                )
                            ).toNumber(),
                            i * 10
                        );
                    }
                    for (let i = expiration; i <= expiration * 2; i++) {
                        assert.equal(
                            (
                                await contract.totalDividendTokenAt(
                                    token1.address,
                                    i
                                )
                            ).toNumber(),
                            0
                        );
                    }
                });
                it("moves dividends of token2 on every closed term", async () => {
                    assert.equal(
                        (await token2.balanceOf(contract.address)).toNumber(),
                        totalDividendOfToken2 / 5
                    );
                });
                it("records received dividends of tokens", async () => {
                    for (let i = 1; i <= expiration - 1; i++) {
                        assert.equal(
                            (
                                await contract.totalDividendTokenAt(
                                    token2.address,
                                    i
                                )
                            ).toNumber(),
                            i * 20
                        );
                    }
                    for (let i = expiration; i <= expiration * 2; i++) {
                        assert.equal(
                            (
                                await contract.totalDividendTokenAt(
                                    token2.address,
                                    i
                                )
                            ).toNumber(),
                            0
                        );
                    }
                });
            });
        });
        describe("call at term" + (expiration + 2), () => {
            beforeEach(async () => {
                await lienToken.incrementTerm(expiration + 1);
                for (const recipient of recipients) {
                    await contract.receiveDividendToken(token1.address, {
                        from: recipient.account
                    });
                }
                totalDividendOfToken1 = arithmeticSeries(20, expiration, 10);
            });
            it("moves dividends on every closed term", async () => {
                assert.equal(
                    (await token1.balanceOf(contract.address)).toNumber(),
                    totalDividendOfToken1 / 5
                );
            });
            it("records received dividends", async () => {
                assert.equal(
                    (
                        await contract.totalDividendTokenAt(token1.address, 1)
                    ).toNumber(),
                    0
                );
                for (let i = 2; i <= expiration + 1; i++) {
                    assert.equal(
                        (
                            await contract.totalDividendTokenAt(
                                token1.address,
                                i
                            )
                        ).toNumber(),
                        i * 10
                    );
                }
                for (let i = expiration + 2; i <= expiration * 2; i++) {
                    assert.equal(
                        (
                            await contract.totalDividendTokenAt(
                                token1.address,
                                i
                            )
                        ).toNumber(),
                        0
                    );
                }
            });
            it(
                "receives dividends of token on from term2 to term" +
                    (expiration + 1),
                async () => {
                    for (const recipient of recipients) {
                        dividend = Math.floor(
                            (totalDividendOfToken1 *
                                recipient.amountOfERC20Redistribution) /
                                totalSupplyOfERC20Redistribution
                        );
                        assert.equal(
                            (
                                await token1.balanceOf(recipient.account)
                            ).toNumber(),
                            dividend
                        );
                    }
                }
            );
        });
        describe("call at term2 and term" + (expiration + 2), () => {
            beforeEach(async () => {
                await lienToken.incrementTerm(1);
                for (const recipient of recipients) {
                    await contract.receiveDividendToken(token1.address, {
                        from: recipient.account
                    });
                }
                await lienToken.incrementTerm(expiration);
                for (const recipient of recipients) {
                    await contract.receiveDividendToken(token1.address, {
                        from: recipient.account
                    });
                }
                totalDividendOfToken1 = arithmeticSeries(
                    10,
                    expiration + 1,
                    10
                );
            });
            it("moves dividends on every closed term", async () => {
                assert.equal(
                    (await token1.balanceOf(contract.address)).toNumber(),
                    totalDividendOfToken1 / 5
                );
            });
            it("records received dividends", async () => {
                for (let i = 1; i <= expiration + 1; i++) {
                    assert.equal(
                        (
                            await contract.totalDividendTokenAt(
                                token1.address,
                                i
                            )
                        ).toNumber(),
                        i * 10
                    );
                }
                for (let i = expiration + 2; i <= expiration * 2; i++) {
                    assert.equal(
                        (
                            await contract.totalDividendTokenAt(
                                token1.address,
                                i
                            )
                        ).toNumber(),
                        0
                    );
                }
            });
            it(
                "receives dividends of token on from term1 to term" +
                    (expiration + 1),
                async () => {
                    for (const recipient of recipients) {
                        dividend = Math.floor(
                            (totalDividendOfToken1 *
                                recipient.amountOfERC20Redistribution) /
                                totalSupplyOfERC20Redistribution
                        );
                        assert.equal(
                            (
                                await token1.balanceOf(recipient.account)
                            ).toNumber(),
                            dividend
                        );
                    }
                }
            );
        });
        describe("call at term2 and term" + (expiration + 3), () => {
            beforeEach(async () => {
                await lienToken.incrementTerm(1);
                for (const recipient of recipients) {
                    await contract.receiveDividendToken(token1.address, {
                        from: recipient.account
                    });
                }
                await lienToken.incrementTerm(expiration + 1);
                for (const recipient of recipients) {
                    await contract.receiveDividendToken(token1.address, {
                        from: recipient.account
                    });
                }
                totalDividendOfToken1 =
                    arithmeticSeries(10, expiration + 2, 10) - 20;
            });
            it("moves dividends on every closed term", async () => {
                assert.equal(
                    (await token1.balanceOf(contract.address)).toNumber(),
                    totalDividendOfToken1 / 5
                );
            });
            it("records received dividends", async () => {
                assert.equal(
                    (
                        await contract.totalDividendTokenAt(token1.address, 1)
                    ).toNumber(),
                    10
                );
                assert.equal(
                    (
                        await contract.totalDividendTokenAt(token1.address, 2)
                    ).toNumber(),
                    0
                );
                for (let i = 3; i <= expiration + 2; i++) {
                    assert.equal(
                        (
                            await contract.totalDividendTokenAt(
                                token1.address,
                                i
                            )
                        ).toNumber(),
                        i * 10
                    );
                }
                for (let i = expiration + 3; i <= expiration * 2; i++) {
                    assert.equal(
                        (
                            await contract.totalDividendTokenAt(
                                token1.address,
                                i
                            )
                        ).toNumber(),
                        0
                    );
                }
            });
            it(
                "receives dividends of token on from term1 to term" +
                    (expiration + 2),
                async () => {
                    for (const recipient of recipients) {
                        dividend = Math.floor(
                            (totalDividendOfToken1 *
                                recipient.amountOfERC20Redistribution) /
                                totalSupplyOfERC20Redistribution
                        );
                        assert.equal(
                            (
                                await token1.balanceOf(recipient.account)
                            ).toNumber(),
                            dividend
                        );
                    }
                }
            );
        });
    });
    describe("receiveDividendEth", () => {
        const recipients = [
            {
                account: accounts[2],
                amountOfERC20Redistribution: 10000000000,
                tracker: null
            },
            {
                account: accounts[3],
                amountOfERC20Redistribution: 30000000000,
                tracker: null
            }
        ];
        var totalSupplyOfERC20Redistribution;
        var totalDividendEth;
        beforeEach(async () => {
            for (let i = 1; i <= expiration * 2; i++) {
                await lienToken.setDividendEthAt(i * 10, i);
            }
            for (const recipient of recipients) {
                await contract.mint(
                    recipient.account,
                    recipient.amountOfERC20Redistribution
                );
                recipient.tracker = await balance.tracker(recipient.account);
            }
            totalSupplyOfERC20Redistribution = (
                await contract.totalSupply()
            ).toNumber();
        });
        describe("call at term1", () => {
            beforeEach(async () => {
                for (const recipient of recipients) {
                    await contract.receiveDividendEth({
                        from: recipient.account,
                        gasPrice: 0
                    });
                }
            });
            it("does not change balance of received dividends", async () => {
                assert.equal(await web3.eth.getBalance(contract.address), 0);
            });
            it("does not change records of received dividends", async () => {
                assert.equal(
                    (await contract.totalDividendEthAt(1)).toNumber(),
                    0
                );
            });
            it("does not receive any ether", async () => {
                for (const recipient of recipients) {
                    assert.equal(
                        (await recipient.tracker.delta()).toNumber(),
                        0
                    );
                }
            });
        });
        describe("call at term" + expiration, () => {
            beforeEach(async () => {
                await lienToken.incrementTerm(expiration - 1);
                for (const recipient of recipients) {
                    await contract.receiveDividendEth({
                        from: recipient.account,
                        gasPrice: 0
                    });
                }
                totalDividendEth = arithmeticSeries(10, expiration - 1, 10);
            });
            it("moves dividends on every closed term", async () => {
                assert.equal(
                    await web3.eth.getBalance(contract.address),
                    totalDividendEth / 5
                );
            });
            it("records received dividends", async () => {
                for (let i = 1; i <= expiration - 1; i++) {
                    assert.equal(
                        (await contract.totalDividendEthAt(i)).toNumber(),
                        i * 10
                    );
                }
                for (let i = expiration; i <= expiration * 2; i++) {
                    assert.equal(
                        (await contract.totalDividendEthAt(i)).toNumber(),
                        0
                    );
                }
            });
            it(
                "receives dividends of ether on from term1 to term" +
                    (expiration - 1),
                async () => {
                    for (const recipient of recipients) {
                        dividend = Math.floor(
                            (totalDividendEth *
                                recipient.amountOfERC20Redistribution) /
                                totalSupplyOfERC20Redistribution
                        );
                        assert.equal(
                            (await recipient.tracker.delta()).toNumber(),
                            dividend
                        );
                    }
                }
            );
            describe("when call again", () => {
                beforeEach(async () => {
                    for (const recipient of recipients) {
                        await contract.receiveDividendEth({
                            from: recipient.account,
                            gasPrice: 0
                        });
                    }
                });
                it("does not change balance of received dividends", async () => {
                    assert.equal(
                        await web3.eth.getBalance(contract.address),
                        totalDividendEth / 5
                    );
                });
                it("does not change records of received dividends", async () => {
                    for (let i = 1; i <= expiration - 1; i++) {
                        assert.equal(
                            (await contract.totalDividendEthAt(i)).toNumber(),
                            i * 10
                        );
                    }
                    for (let i = expiration; i <= expiration * 2; i++) {
                        assert.equal(
                            (await contract.totalDividendEthAt(i)).toNumber(),
                            0
                        );
                    }
                });
            });
        });
        describe("call at term" + (expiration + 2), () => {
            beforeEach(async () => {
                await lienToken.incrementTerm(expiration + 1);
                for (const recipient of recipients) {
                    await contract.receiveDividendEth({
                        from: recipient.account,
                        gasPrice: 0
                    });
                }
                totalDividendEth = arithmeticSeries(20, expiration, 10);
            });
            it("moves dividends on every closed term", async () => {
                assert.equal(
                    await web3.eth.getBalance(contract.address),
                    totalDividendEth / 5
                );
            });
            it("records received dividends", async () => {
                assert.equal(
                    (await contract.totalDividendEthAt(1)).toNumber(),
                    0
                );
                for (let i = 2; i <= expiration + 1; i++) {
                    assert.equal(
                        (await contract.totalDividendEthAt(i)).toNumber(),
                        i * 10
                    );
                }
                for (let i = expiration + 2; i <= expiration * 2; i++) {
                    assert.equal(
                        (await contract.totalDividendEthAt(i)).toNumber(),
                        0
                    );
                }
            });
            it(
                "receives dividends of ether on from term2 to term" +
                    (expiration + 1),
                async () => {
                    for (const recipient of recipients) {
                        dividend = Math.floor(
                            (totalDividendEth *
                                recipient.amountOfERC20Redistribution) /
                                totalSupplyOfERC20Redistribution
                        );
                        assert.equal(
                            (await recipient.tracker.delta()).toNumber(),
                            dividend
                        );
                    }
                }
            );
        });
        describe("call at term2 and term" + (expiration + 2), () => {
            beforeEach(async () => {
                await lienToken.incrementTerm(1);
                for (const recipient of recipients) {
                    await contract.receiveDividendEth({
                        from: recipient.account,
                        gasPrice: 0
                    });
                }
                await lienToken.incrementTerm(expiration);
                for (const recipient of recipients) {
                    await contract.receiveDividendEth({
                        from: recipient.account,
                        gasPrice: 0
                    });
                }
                totalDividendEth = arithmeticSeries(10, expiration + 1, 10);
            });
            it("moves dividends on every closed term", async () => {
                assert.equal(
                    await web3.eth.getBalance(contract.address),
                    totalDividendEth / 5
                );
            });
            it("records received dividends", async () => {
                for (let i = 1; i <= expiration + 1; i++) {
                    assert.equal(
                        (await contract.totalDividendEthAt(i)).toNumber(),
                        i * 10
                    );
                }
                for (let i = expiration + 2; i <= expiration * 2; i++) {
                    assert.equal(
                        (await contract.totalDividendEthAt(i)).toNumber(),
                        0
                    );
                }
            });
            it(
                "receives dividends of token on from term1 to term" +
                    (expiration + 1),
                async () => {
                    for (const recipient of recipients) {
                        dividend = Math.floor(
                            (totalDividendEth *
                                recipient.amountOfERC20Redistribution) /
                                totalSupplyOfERC20Redistribution
                        );
                        assert.equal(
                            (await recipient.tracker.delta()).toNumber(),
                            dividend
                        );
                    }
                }
            );
        });
        describe("call at term2 and term" + (expiration + 3), () => {
            beforeEach(async () => {
                await lienToken.incrementTerm(1);
                for (const recipient of recipients) {
                    await contract.receiveDividendEth({
                        from: recipient.account,
                        gasPrice: 0
                    });
                }
                await lienToken.incrementTerm(expiration + 1);
                for (const recipient of recipients) {
                    await contract.receiveDividendEth({
                        from: recipient.account,
                        gasPrice: 0
                    });
                }
                totalDividendEth =
                    arithmeticSeries(10, expiration + 2, 10) - 20;
            });
            it("moves dividends on every closed term", async () => {
                assert.equal(
                    await web3.eth.getBalance(contract.address),
                    totalDividendEth / 5
                );
            });
            it("records received dividends", async () => {
                assert.equal(
                    (await contract.totalDividendEthAt(1)).toNumber(),
                    10
                );
                assert.equal(
                    (await contract.totalDividendEthAt(2)).toNumber(),
                    0
                );
                for (let i = 3; i <= expiration + 2; i++) {
                    assert.equal(
                        (await contract.totalDividendEthAt(i)).toNumber(),
                        i * 10
                    );
                }
                for (let i = expiration + 3; i <= expiration * 2; i++) {
                    assert.equal(
                        (await contract.totalDividendEthAt(i)).toNumber(),
                        0
                    );
                }
            });
            it(
                "receives dividends of token on from term1 to term" +
                    (expiration + 2),
                async () => {
                    for (const recipient of recipients) {
                        dividend = Math.floor(
                            (totalDividendEth *
                                recipient.amountOfERC20Redistribution) /
                                totalSupplyOfERC20Redistribution
                        );
                        assert.equal(
                            (await recipient.tracker.delta()).toNumber(),
                            dividend
                        );
                    }
                }
            );
        });
    });
});
