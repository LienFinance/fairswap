pragma solidity >=0.6.6;
import "../Interfaces/ERC20Interface.sol";

interface LBTExchangeInterface {
    function removeAfterMaturity() external;

    function addLiquidity(
        uint256 _timeout,
        uint256 _baseTokenAmount,
        uint256 _settlementTokenAmount,
        uint256 _minShares
    ) external;
}

interface EthExchangeInterface is ERC20Interface {
    function addLiquidity(uint256 timeout, uint256 _minShares) external payable;

    function removeLiquidity(
        uint256 timeout,
        uint256 minEth,
        uint256 minTokens,
        uint256 sharesBurned
    ) external;
}

contract TestGetETH {
    address owner;

    constructor() public {
        owner = msg.sender;
    }

    receive() external payable {
        require(owner == msg.sender, "ETH should be sent by owner");
    }

    function addLiquidityLBT(
        address idolAddress,
        address lbtAddress,
        address exchangeAddress
    ) public {
        ERC20Interface LBT = ERC20Interface(lbtAddress);
        ERC20Interface IDOL = ERC20Interface(idolAddress);
        uint256 lbtbalance = LBT.balanceOf(address(this));
        uint256 idolbalance = IDOL.balanceOf(address(this));
        LBT.approve(exchangeAddress, lbtbalance);
        IDOL.approve(exchangeAddress, idolbalance);
        LBTExchangeInterface exchange = LBTExchangeInterface(
            payable(exchangeAddress)
        );
        exchange.addLiquidity(10, idolbalance, lbtbalance, 0);
    }

    function removeAfterMaturityLBT(address exchangeAddress) public {
        LBTExchangeInterface exchange = LBTExchangeInterface(
            payable(exchangeAddress)
        );
        exchange.removeAfterMaturity();
    }

    function addLiquidityETH(address idolAddress, address exchangeAddress)
        public
    {
        ERC20Interface IDOL = ERC20Interface(idolAddress);
        uint256 idolbalance = IDOL.balanceOf(address(this));
        IDOL.approve(exchangeAddress, idolbalance);
        EthExchangeInterface exchange = EthExchangeInterface(
            payable(exchangeAddress)
        );
        exchange.addLiquidity{value: address(this).balance}(10, 0);
    }

    function removeLiquidityETH(address exchangeAddress) public {
        EthExchangeInterface exchange = EthExchangeInterface(
            payable(exchangeAddress)
        );
        uint256 share = exchange.balanceOf(address(this));
        exchange.removeLiquidity(0, 0, 0, share);
    }
}
