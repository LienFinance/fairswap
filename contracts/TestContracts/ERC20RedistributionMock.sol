pragma solidity >=0.6.6;

import "../BoxExchange/TokenBoxExchange/IDOLvsERC20/IDOLvsLien/ERC20Redistribution.sol";
import "../../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20RedistributionMock is ERC20Redistribution {
    constructor(LienTokenInterface _lien, uint256 totalSupply)
        public
        ERC20("ERC20RedistributionMock", "ERC20RedistributionMock")
        ERC20Redistribution(_lien)
    {
        _mint(msg.sender, totalSupply);
    }

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external {
        _burn(account, amount);
    }
}
