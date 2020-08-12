pragma solidity >=0.6.6;

contract TestOracle {
    uint256 price = 10000000000;
    uint256 volatility = 100000000;

    function changeData(uint256 _price, uint256 _volatility) external {
        price = _price;
        volatility = _volatility;
    }

    function latestPrice() external returns (uint256) {
        return price;
    }

    function getVolatility() external returns (uint256) {
        return volatility;
    }

    function latestId() external returns (uint256) {
        return 25;
    }
}
