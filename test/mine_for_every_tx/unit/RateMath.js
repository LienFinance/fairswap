const RateMathMock = artifacts.require("RateMathMock");

contract("RateMath", function () {
    var rateMath;
    beforeEach(async () => {
        rateMath = await RateMathMock.new();
    });
    describe("getRates", () => {
        const testCases = [
            ["100", "100", "1000000000000000000"],
            ["100", "10", "10000000000000000000"],
            ["1", "10", "100000000000000000"]
        ];
        for (const testCase of testCases) {
            it(
                testCase[0] + "/" + testCase[1] + "=" + testCase[2],
                async () => {
                    assert.equal(
                        (
                            await rateMath.getRate(testCase[0], testCase[1])
                        ).toString(),
                        testCase[2]
                    );
                }
            );
        }
    });
    describe("mulByRate", () => {
        const testCases = [
            ["100", "1000000000000000000", "100"],
            ["100", "100000000000000000", "10"],
            ["10", "10000000000000000000", "100"]
        ];
        for (const testCase of testCases) {
            it(
                testCase[0] + "*" + testCase[1] + "=" + testCase[2],
                async () => {
                    assert.equal(
                        (
                            await rateMath.mulByRate(testCase[0], testCase[1])
                        ).toString(),
                        testCase[2]
                    );
                }
            );
        }
    });
    describe("divByRate", () => {
        const testCases = [
            ["100", "1000000000000000000", "100"],
            ["100", "10000000000000000000", "10"],
            ["10", "100000000000000000", "100"]
        ];
        for (const testCase of testCases) {
            it(
                testCase[0] + "/" + testCase[1] + "=" + testCase[2],
                async () => {
                    assert.equal(
                        (
                            await rateMath.divByRate(testCase[0], testCase[1])
                        ).toString(),
                        testCase[2]
                    );
                }
            );
        }
    });
});
