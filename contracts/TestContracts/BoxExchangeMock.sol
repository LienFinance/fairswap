pragma solidity >=0.6.6;

import "../BoxExchange/BoxExchange.sol";
import "../../node_modules/@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "../Interfaces/ERC20Interface.sol";
import "../Interfaces/PriceCalculatorInterface.sol";

contract BoxExchangeMock is BoxExchange {
    using SafeERC20 for ERC20Interface;

    ERC20Interface public token0;
    ERC20Interface public token1;

    bool private isBoxExpired;
    uint256 private spreadRate;

    constructor(
        ERC20Interface _token0,
        ERC20Interface _token1,
        PriceCalculatorInterface calc,
        uint256 _feeRate,
        address _marketFeeTaker
    ) public BoxExchange(calc, _marketFeeTaker, "SHARE") {
        token0 = _token0;
        token1 = _token1;
        spreadRate = _feeRate;
    }

    function _feeRate() internal override returns (uint128) {
        return uint128(spreadRate);
    }

    function _receiveTokens(
        Token token,
        address from,
        uint256 amount
    ) internal override {
        _IERC20(token).safeTransferFrom(from, address(this), amount);
    }

    function _sendTokens(
        Token token,
        address to,
        uint256 amount
    ) internal override {
        _IERC20(token).safeTransfer(to, amount);
    }

    function _payForOrderExecution(
        Token token,
        address to,
        uint256 amount
    ) internal override {
        _IERC20(token).safeTransfer(to, amount);
    }

    function _payMarketFee(
        address _marketFeeTaker,
        uint256 amount0,
        uint256 amount1
    ) internal override {
        token0.safeTransfer(_marketFeeTaker, amount0);
        token1.safeTransfer(_marketFeeTaker, amount1);
    }

    function _isCurrentOpenBoxExpired() internal override view returns (bool) {
        return isBoxExpired;
    }

    function _openNewBox() internal override {
        isBoxExpired = false;
        super._openNewBox();
    }

    function expireBox() external {
        isBoxExpired = true;
    }

    function _IERC20(Token token) internal view returns (ERC20Interface) {
        if (token == Token.TOKEN0) {
            return token0;
        }
        return token1;
    }

    function init(
        uint128 amount0,
        uint128 amount1,
        uint256 initialShare
    ) external {
        _init(amount0, amount1, initialShare);
    }

    function addLiquidity(
        uint256 amount0,
        uint256 minShare,
        Token tokenType
    ) external {
        (uint256 _reserve0, uint256 _reserve1) = _getReserves(); // gas savings
        _addLiquidity(_reserve0, _reserve1, amount0, minShare, tokenType);
    }

    function removeLiquidity(
        uint256 minAmount0,
        uint256 minAmount1,
        uint256 share
    ) external {
        _removeLiquidity(minAmount0, minAmount1, share);
    }

    function addOrder(
        OrderType orderType,
        uint256 inAmount,
        address recipient
    ) external {
        _addOrder(orderType, inAmount, recipient);
    }

    function executeOrders(uint8 maxOrderNum) external {
        _triggerExecuteOrders(maxOrderNum);
    }

    function payMarketFee() external {
        _triggerPayMarketFee();
    }

    function otherAmountBasedOnRate(
        Token inToken,
        uint256 inAmount,
        uint256 rate0Per1
    ) external pure returns (uint256) {
        return _otherAmountBasedOnRate(inToken, inAmount, rate0Per1);
    }

    function executeOrder(
        Token inToken,
        address recipient,
        uint256 inAmount,
        uint256 refundRate,
        uint256 rate,
        uint256 _feeRate
    ) external {
        _executeOrder(inToken, recipient, inAmount, refundRate, rate, _feeRate);
    }

    function calculatePriceWrapper(
        uint256 flexToken0In,
        uint256 strictToken0In,
        uint256 flexToken1In,
        uint256 strictToken1In,
        uint256 _reserve0,
        uint256 _reserve1
    )
        external
        view
        returns (
            uint256 rate,
            uint256 refundStatus,
            uint256 refundRate,
            uint256 executingAmount0,
            uint256 executingAmount1
        )
    {
        return
            _calculatePriceWrapper(
                flexToken0In,
                strictToken0In,
                flexToken1In,
                strictToken1In,
                _reserve0,
                _reserve1
            );
    }

    function getReserves()
        external
        view
        returns (uint256 _reserve0, uint256 _reserve1)
    {
        return _getReserves();
    }

    function getMarketFeePools()
        external
        view
        returns (uint256 _marketFeePool0, uint256 _marketFeePool1)
    {
        return _getMarketFeePools();
    }
}
