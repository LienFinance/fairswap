pragma solidity >=0.6.6;

import "../BoxExchange/ETHBoxExchange/ERC20vsETH/ERC20vsETHBoxExchange.sol";

contract testERC20vsETHBoxExchange is ERC20vsETHBoxExchange {
    constructor(
        ERC20Interface _token,
        PriceCalculatorInterface calc,
        address _marketFeeTaker,
        SpreadCalculatorInterface _spreadCalc,
        OracleInterface _oracle
    )
        public
        ERC20vsETHBoxExchange(
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
        return (reserve0, reserve1, marketFeePool1);
    }
}
