pragma solidity >=0.6.6;
import "../ETHBoxExchange.sol";

contract ERC20vsETHBoxExchange is ETHBoxExchange {
    /**
     * @param _token ERC20 contract
     * @param _priceCalc Price Calculator contract
     * @param _marketFeeTaker Address of market fee taker (i.e. Lien Token)
     * @param _spreadCalc Spread Calculator contract
     * @param _oracle Oracle contract of ERC20/ETH
     * @param _name Name of share token
     **/
    constructor(
        ERC20Interface _token,
        PriceCalculatorInterface _priceCalc,
        address _marketFeeTaker,
        SpreadCalculatorInterface _spreadCalc,
        OracleInterface _oracle,
        string memory _name
    )
        public
        ETHBoxExchange(
            _token,
            _priceCalc,
            _marketFeeTaker,
            _spreadCalc,
            _oracle,
            _name
        )
    {}

    /**
     * @notice Updates reserves and market fee pools
     * @param spreadRate Spread rate in the box
     * @param executingAmount0WithoutSpread Executed amount of TOKEN0 in this box
     * @param executingAmount1WithoutSpread Executed amount of TOKEN1 in this box
     * @param rate Rate of swap
     **/
    function _updateReservesAndMarketFeePoolByExecution(
        uint256 spreadRate,
        uint256 executingAmount0WithoutSpread,
        uint256 executingAmount1WithoutSpread,
        uint256 rate
    ) internal virtual override {
        uint256 newReserve0;
        uint256 newReserve1;
        uint256 newMarketFeePool1;
        uint256 marketFee0;
        {
            (newReserve0, marketFee0) = _calculateNewReserveAndMarketFeePool(
                spreadRate,
                executingAmount0WithoutSpread,
                executingAmount1WithoutSpread,
                rate,
                Token.TOKEN0
            );
            newReserve0 = newReserve0 + reserve0;
        }
        {
            (
                uint256 differenceOfReserve,
                uint256 differenceOfMarketFee
            ) = _calculateNewReserveAndMarketFeePool(
                spreadRate,
                executingAmount1WithoutSpread,
                executingAmount0WithoutSpread,
                rate,
                Token.TOKEN1
            );
            newReserve1 = reserve1 + differenceOfReserve;
            newMarketFeePool1 = marketFeePool1 + differenceOfMarketFee;
        }
        {
            uint256 convertedSpread0to1 = marketFee0
                .mulByRate(newReserve1.divByRate(newReserve0.add(marketFee0)))
                .divByRate(RateMath.RATE_POINT_MULTIPLIER);
            newReserve0 += marketFee0;
            newReserve1 -= convertedSpread0to1;
            newMarketFeePool1 += convertedSpread0to1;
        }
        _updateReserve(newReserve0.toUint128(), newReserve1.toUint128());
        _updateMarketFeePool(newMarketFeePool1.toUint128());
    }

    /**
     * updates only pool0
     */
    function _updateMarketFeePool(uint256 newMarketFeePool1) internal {
        marketFeePool1 = newMarketFeePool1.toUint128();
    }
}
