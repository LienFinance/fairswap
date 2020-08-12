pragma solidity >=0.6.6;

import "../BoxExchange/TokenBoxExchange/IDOLvsERC20/ERC20BoxExchange.sol";

contract testLienBoxExchange is ERC20BoxExchange {
    constructor(
        ERC20Interface _idol,
        ERC20Interface _token,
        PriceCalculatorInterface calc,
        address _marketFeeTaker,
        SpreadCalculatorInterface _spreadCalc,
        OracleInterface _oracle
    )
        public
        ERC20BoxExchange(
            _idol,
            _token,
            calc,
            _marketFeeTaker,
            _spreadCalc,
            _oracle,
            "SHARE"
        )
    {}

    function getUpdatedData(
        uint256 spreadRate,
        uint256 executingAmount0,
        uint256 executingAmount1,
        uint256 rate
    )
        external
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        _updateReservesAndMarketFeePoolByExecution(
            spreadRate,
            executingAmount0,
            executingAmount1,
            rate
        );
        return (reserve0, reserve1, marketFeePool0);
    }
}
