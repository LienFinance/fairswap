pragma solidity >=0.6.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
    constructor(address account, uint256 value) public ERC20("", "") {
        _mint(account, value);
    }
}
