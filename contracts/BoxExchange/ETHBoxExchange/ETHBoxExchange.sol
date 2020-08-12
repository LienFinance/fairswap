pragma solidity >=0.6.6;
import "../BoxExchange.sol";
import "../../../node_modules/@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "../../Interfaces/ERC20Interface.sol";
import "../../Interfaces/SpreadCalculatorInterface.sol";
import "../../Interfaces/OracleInterface.sol";

abstract contract ETHBoxExchange is BoxExchange {
    using SafeERC20 for ERC20Interface;

    ERC20Interface public immutable token; // token0
    // ETH is token1
    SpreadCalculatorInterface internal immutable spreadCalc;
    OracleInterface internal immutable oracle;

    mapping(address => uint256) internal ethBalances; // This balance increased by execution or refund

    event SpreadRate(uint128 indexed boxNumber, uint128 spreadRate);

    /**
     * @param _token ERC20 contract
     * @param _priceCalc Price Calculator contract
     * @param _marketFeeTaker Address of market fee taker (i.e. Lien Token)
     * @param _spreadCalc Spread Calculator contract
     * @param _oracle Oracle contract of token/ETH
     * @param _name Name of share token
     **/

    constructor(
        ERC20Interface _token,
        PriceCalculatorInterface _priceCalc,
        address _marketFeeTaker,
        SpreadCalculatorInterface _spreadCalc,
        OracleInterface _oracle,
        string memory _name
    ) public BoxExchange(_priceCalc, _marketFeeTaker, _name) {
        token = _token;
        spreadCalc = _spreadCalc;
        oracle = _oracle;
    }

    /**
     * @notice User can decide first supply of Share token
     **/
    function initializeExchange(uint256 tokenAmount, uint256 initialShare)
        external
        payable
    {
        _init(uint128(tokenAmount), uint128(msg.value), initialShare);
    }

    /**
     * @param timeout Revert if nextBoxNumber exceeds `timeout`
     * @param recipient Recipient of swapped token. If recipient == address(0), recipient is msg.sender
     * @param isLimit Whether the order restricts a large slippage.
     * @dev if isLimit is true and reserve0/reserve1 * 0.999 < rate, the order will be executed, otherwise ETH will be refunded
     * @dev if isLimit is false and reserve0/reserve1 * 0.95 < rate, the order will be executed, otherwise ETH will be refunded
     **/
    function orderEthToToken(
        uint256 timeout,
        address recipient,
        bool isLimit
    ) external payable isAmountSafe(msg.value) isInTime(timeout) {
        OrderType orderType = _getTokenType(false, isLimit);
        _addOrder(orderType, msg.value, recipient);
    }

    /**
     * @param timeout Revert if nextBoxNumber exceeds timeout
     * @param recipient Recipient of swapped token. If recipient == address(0), recipient is msg.sender
     * @param tokenAmount Amount of token that should be approved before executing this function
     * @param isLimit Whether the order restricts a large slippage.
     * @dev if isLimit is true and reserve0/reserve1 * 1.001 >  `rate`, the order will be executed, otherwise token will be refunded
     * @dev if isLimit is false and reserve0/reserve1 * 1.05 > `rate`, the order will be executed, otherwise token will be refunded
     **/
    function orderTokenToEth(
        uint256 timeout,
        address recipient,
        uint256 tokenAmount,
        bool isLimit
    ) external isAmountSafe(tokenAmount) isInTime(timeout) {
        OrderType orderType = _getTokenType(true, isLimit);
        _addOrder(orderType, tokenAmount, recipient);
    }

    /**
     * @notice LP provides liquidity and receives share token.
     * @notice iDOL required is calculated based on msg.value
     * @param timeout Revert if nextBoxNumber exceeds `timeout`
     * @param _minShares Minimum amount of share token LP will receive. If amount of share token is less than  `_minShares`, revert the transaction
     **/
    function addLiquidity(uint256 timeout, uint256 _minShares)
        external
        payable
        isAmountSafe(msg.value)
        isInTime(timeout)
    {
        (uint256 _reserve0, uint256 _reserve1) = _getReserves(); // gas savings
        _addLiquidity(
            _reserve0,
            _reserve1,
            msg.value,
            _minShares,
            Token.TOKEN1
        );
    }

    /**
     * @notice LP burns share token and receives ERC20 token and ETH.
     * @param timeout Revert if nextBoxNumber exceeds `timeout`
     * @param minEth Minimum amount of ETH LP will receive. If amount of ERC20 token is less than `minEth`, revert the transaction
     * @param minTokens Minimum amount of ERC20 token  LP will receive. If amount of LBT is less than `minTokens`, revert the transaction
     * @param sharesBurned Amount of share token to be burned
     **/
    function removeLiquidity(
        uint256 timeout,
        uint256 minEth,
        uint256 minTokens,
        uint256 sharesBurned
    ) external isInTime(timeout) {
        _removeLiquidity(minTokens, minEth, sharesBurned);
    }

    /**
     * @notice Executes orders that are unexecuted
     * @param maxOrderNum Max number of orders to be executed
     **/
    function executeUnexecutedBox(uint8 maxOrderNum) external {
        _triggerExecuteOrders(maxOrderNum);
    }

    /**
     * @notice Sends market fee to Lien Token
     **/
    function sendMarketFeeToLien() external {
        _triggerPayMarketFee();
    }

    // definitions of unique functions
    /**
     * @notice Withdraws ETH in ethBalances and set ethBalance of msg.sender to 0
     **/
    function withdrawETH() external {
        uint256 ethBalance = ethBalances[msg.sender];
        ethBalances[msg.sender] = 0;
        _transferEth(msg.sender, ethBalance);
    }

    /**
     * @notice Gets ethBalance of `recipient`
     * @param recipient Target address
     **/
    function getETHBalance(address recipient) external view returns (uint256) {
        return ethBalances[recipient];
    }

    // definition of abstract functions
    function _feeRate() internal override returns (uint128) {
        return spreadCalc.calculateSpreadByAssetVolatility(oracle);
    }

    function _receiveTokens(
        Token tokenType,
        address from,
        uint256 amount
    ) internal override {
        if (tokenType == Token.TOKEN0) {
            token.safeTransferFrom(from, address(this), amount);
        } else {
            require(msg.value == amount, "Incorrect ETH amount");
        }
    }

    function _sendTokens(
        Token tokenType,
        address to,
        uint256 amount
    ) internal override {
        if (tokenType == Token.TOKEN0) {
            token.safeTransfer(to, amount);
        } else {
            _transferEth(to, amount);
        }
    }

    function _payMarketFee(
        address _marketFeeTaker,
        uint256 amount0,
        uint256 amount1
    ) internal override {
        if (amount0 != 0) {
            token.safeTransfer(_marketFeeTaker, amount0);
        }
        if (amount1 != 0) {
            _transferEth(_marketFeeTaker, amount1);
        }
    }

    function _payForOrderExecution(
        Token tokenType,
        address to,
        uint256 amount
    ) internal override {
        if (tokenType == Token.TOKEN0) {
            token.safeTransfer(to, amount);
        } else {
            ethBalances[to] += amount;
        }
    }

    function _isCurrentOpenBoxExpired() internal override view returns (bool) {
        return block.number >= orderBoxes[_currentOpenBoxId()].expireAt;
    }

    function _openNewBox() internal override {
        super._openNewBox();
        uint256 _boxNumber = _currentOpenBoxId();
        emit SpreadRate(
            _boxNumber.toUint128(),
            orderBoxes[_boxNumber].spreadRate
        );
    }

    function _transferEth(address to, uint256 amount) internal {
        // solhint-disable-next-line avoid-low-level-calls
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed.");
    }
}
