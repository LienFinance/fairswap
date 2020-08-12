pragma solidity >=0.6.6;

import "../Interfaces/LienTokenInterface.sol";
import "../../node_modules/@openzeppelin/contracts/math/Math.sol";
import "../../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../Interfaces/ERC20Interface.sol";
import "../../node_modules/@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

contract LienTokenMock is LienTokenInterface, ERC20("LienTokenMock", "LIEN") {
    using SafeERC20 for ERC20Interface;
    uint256 public _expiration;

    uint256 private _currentTerm = 1;
    mapping(address => mapping(uint256 => uint256)) private dividendsOfTokensAt;
    mapping(uint256 => uint256) private dividendsOfEthAt;

    receive() external payable {}

    constructor(uint256 expiration) public {
        _expiration = expiration;
    }

    function incrementTerm(uint256 num) external {
        _currentTerm += num;
    }

    function setDividendTokenAt(
        address token,
        uint256 amount,
        uint256 term
    ) public {
        dividendsOfTokensAt[token][term] = amount;
    }

    function expiration() external override view returns (uint256) {
        return _expiration;
    }

    function setDividendEthAt(uint256 amount, uint256 term) public {
        dividendsOfEthAt[term] = amount;
    }

    function currentTerm() external virtual override view returns (uint256) {
        return _currentTerm;
    }

    function receiveDividend(address token, address recipient)
        external
        override
    {
        if (token == address(0)) {
            _receiveDividendOfEth(recipient);
        } else {
            uint256 amount = 0;
            uint256 start;
            if (_currentTerm > _expiration) {
                start = _currentTerm - _expiration;
            } else {
                start = 1;
            }
            //get and register dividend amount of exchange from lienToken Contract
            for (uint256 i = start; i < _currentTerm; i++) {
                amount += dividendAt(token, msg.sender, i);
                setDividendTokenAt(token, 0, i);
            }
            ERC20Interface(token).safeTransfer(recipient, amount);
        }
    }

    function _receiveDividendOfEth(address recipient) internal {
        uint256 amount = 0;
        uint256 start;
        if (_currentTerm > _expiration) {
            start = _currentTerm - _expiration;
        } else {
            start = 1;
        }
        for (uint256 i = start; i < _currentTerm; i++) {
            amount += dividendAt(address(0), msg.sender, i);
            setDividendEthAt(0, i);
        }
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer failed");
    }

    function dividendAt(
        address token,
        address,
        uint256 term
    ) public override view returns (uint256) {
        if (token == address(0)) {
            return dividendsOfEthAt[term];
        } else {
            return dividendsOfTokensAt[token][term];
        }
    }
}
