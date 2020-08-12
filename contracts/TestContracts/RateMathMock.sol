pragma solidity >=0.6.6;

import "../Libraries/RateMath.sol";

contract RateMathMock {
    function getRate(uint256 a, uint256 b) public pure returns (uint256) {
        return RateMath.getRate(a, b);
    }

    function divByRate(uint256 value, uint256 rate)
        public
        pure
        returns (uint256)
    {
        return RateMath.divByRate(value, rate);
    }

    function mulByRate(uint256 value, uint256 rate)
        public
        pure
        returns (uint256)
    {
        return RateMath.mulByRate(value, rate);
    }
}
