pragma solidity >=0.6.6;

import "../ERC20BoxExchange.sol";
import "./ERC20Redistribution.sol";

contract LienBoxExchange is ERC20BoxExchange, ERC20Redistribution {
    /**
     * @param _idol iDOL contract
     * @param _priceCalc Price Calculator contract
     * @param _lien Lien Token contract
     * @param _spreadCalc Spread Calculator contract
     * @param _name Name of share token
     **/
    constructor(
        ERC20Interface _idol,
        PriceCalculatorInterface _priceCalc,
        LienTokenInterface _lien,
        SpreadCalculatorInterface _spreadCalc,
        string memory _name
    )
        public
        ERC20Redistribution(_lien)
        ERC20BoxExchange(
            _idol,
            ERC20Interface(address(_lien)),
            _priceCalc,
            address(_lien),
            _spreadCalc,
            OracleInterface(address(0)),
            _name
        )
    {}

    // overriding ERC20 functions
    function _transfer(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Redistribution) {
        ERC20Redistribution._transfer(from, to, value);
    }

    function _burn(address account, uint256 value)
        internal
        override(ERC20, ERC20Redistribution)
    {
        ERC20Redistribution._burn(account, value);
    }

    function _mint(address account, uint256 value)
        internal
        override(ERC20, ERC20Redistribution)
    {
        ERC20Redistribution._mint(account, value);
    }
}
