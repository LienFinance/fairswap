const BoxExecutionStatusMock = artifacts.require("BoxExecutionStatusMock");

contract("BoxExecutionStatus", function (accounts) {
    var contract;
    beforeEach(async () => {
        contract = await BoxExecutionStatusMock.new();
    });
    describe("#refundRate", () => {
        const partiallyRefundRate = "300000000000000000"; // 30%
        const allRefundRate = "1000000000000000000"; // 100%
        const orderTypes = {
            FLEX_0_1: 0,
            FLEX_1_0: 1,
            STRICT_0_1: 2,
            STRICT_1_0: 3
        };
        const testCases = [
            {
                partiallyRefundOrderType: "FLEX_0_1",
                expected: [
                    {
                        input: "FLEX_0_1",
                        output: partiallyRefundRate
                    },
                    {
                        input: "STRICT_0_1",
                        output: allRefundRate
                    },
                    {
                        input: "FLEX_1_0",
                        output: 0
                    },
                    {
                        input: "STRICT_1_0",
                        output: 0
                    }
                ]
            },
            {
                partiallyRefundOrderType: "FLEX_1_0",
                expected: [
                    {
                        input: "FLEX_0_1",
                        output: 0
                    },
                    {
                        input: "STRICT_0_1",
                        output: 0
                    },
                    {
                        input: "FLEX_1_0",
                        output: partiallyRefundRate
                    },
                    {
                        input: "STRICT_1_0",
                        output: allRefundRate
                    }
                ]
            },
            {
                partiallyRefundOrderType: "STRICT_0_1",
                expected: [
                    {
                        input: "FLEX_0_1",
                        output: 0
                    },
                    {
                        input: "STRICT_0_1",
                        output: partiallyRefundRate
                    },
                    {
                        input: "FLEX_1_0",
                        output: 0
                    },
                    {
                        input: "STRICT_1_0",
                        output: 0
                    }
                ]
            },
            {
                partiallyRefundOrderType: "STRICT_1_0",
                expected: [
                    {
                        input: "FLEX_0_1",
                        output: 0
                    },
                    {
                        input: "STRICT_0_1",
                        output: 0
                    },
                    {
                        input: "FLEX_1_0",
                        output: 0
                    },
                    {
                        input: "STRICT_1_0",
                        output: partiallyRefundRate
                    }
                ]
            }
        ];
        for (const testCase of testCases) {
            describe(
                "partiallyRefundOrderType:" +
                    testCase.partiallyRefundOrderType,
                () => {
                    for (const {input, output} of testCase.expected) {
                        it(
                            "refundRate of " + input + " = " + output,
                            async () => {
                                assert.equal(
                                    (
                                        await contract.refundRate(
                                            orderTypes[
                                                testCase
                                                    .partiallyRefundOrderType
                                            ],
                                            partiallyRefundRate,
                                            orderTypes[input]
                                        )
                                    ).toString(),
                                    output
                                );
                            }
                        );
                    }
                }
            );
        }
    });
});
