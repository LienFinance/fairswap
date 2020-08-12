pragma solidity >=0.6.6;
import "../ETHBoxExchange.sol";

contract IDOLvsETHBoxExchange is ETHBoxExchange {
    /**
     * @param _token ERC20 token contract
     * @param _priceCalc Price Calculator contract
     * @param _marketFeeTaker Address of market fee taker (i.e. Lien Token)
     * @param _spreadCalc Spread Calculator contract
     * @param _oracle Oracle contract of ETH/USD
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
}
