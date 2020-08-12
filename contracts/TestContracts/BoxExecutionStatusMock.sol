pragma solidity >=0.6.6;

import {
    BoxExecutionStatus,
    BoxExecutionStatusLibrary
} from "../Libraries/ExecutionStatus.sol";

import {OrderType} from "../Libraries/Enums.sol";

contract BoxExecutionStatusMock {
    using BoxExecutionStatusLibrary for BoxExecutionStatus;

    function refundRate(
        OrderType partiallyRefundOrderType,
        uint64 partiallyRefundRate, // refundAmount/inAmount
        OrderType orderType
    ) public pure returns (uint256) {
        BoxExecutionStatus memory boxExecutionStatus = BoxExecutionStatus({
            partiallyRefundOrderType: partiallyRefundOrderType,
            partiallyRefundRate: partiallyRefundRate, // refundAmount/inAmount
            rate: 0,
            onGoing: false,
            boxNumber: 0
        });
        return boxExecutionStatus.refundRate(orderType);
    }
}
