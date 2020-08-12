pragma solidity >=0.6.6;

import "../../../../../node_modules/@openzeppelin/contracts/token/ERC20/ERC20Snapshot.sol";
import "../../../../../node_modules/@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "../../../../../node_modules/@openzeppelin/contracts/math/Math.sol";
import "../../../../Interfaces/LienTokenInterface.sol";
import "../../../../Interfaces/ERC20Interface.sol";

abstract contract ERC20Redistribution is ERC20Snapshot {
    using SafeERC20 for ERC20Interface;

    struct Dividend {
        mapping(ERC20Interface => uint256) tokens;
        uint256 eth;
    }

    LienTokenInterface public lien;
    mapping(uint256 => uint256) private snapshotsOfTermEnd;
    mapping(uint256 => Dividend) private totalDividendsAt;
    mapping(address => mapping(ERC20Interface => uint256))
        private lastReceivedTermsOfTokens;
    mapping(address => uint256) private lastReceivedTermsOfEth;

    event ReceiveDividendETH(address indexed recipient, uint256 amount);
    event ReceiveDividendToken(
        address indexed recipient,
        address indexed tokenAddress,
        uint256 amount
    );

    modifier termValidation(uint256 _term) {
        require(_term > 0, "0 is invalid value as term");
        _;
    }

    receive() external payable {}

    constructor(LienTokenInterface _lien) public {
        lien = _lien;
    }

    /**
     * @notice Transfers ERC20 token dividend to Liquidity Provider
     * @notice Before transfer dividend, this exchange withdraws dividend in this ERC20 token from Lien Token
     * @param token Target ERC20 token to be received
     */
    function receiveDividendToken(ERC20Interface token) public {
        uint256 _currentTerm = currentTerm();
        if (_currentTerm == 1) {
            return;
        }
        _moveDividendTokenFromLIEN(token, _currentTerm);
        uint256 lastReceivedTerm = lastReceivedTermsOfTokens[msg.sender][token];
        lastReceivedTermsOfTokens[msg.sender][token] = _currentTerm - 1;
        uint256 dividend;
        for (uint256 term = lastReceivedTerm + 1; term < _currentTerm; term++) {
            dividend += dividendTokenAt(msg.sender, token, term);
        }
        emit ReceiveDividendToken(msg.sender, address(token), dividend);
        token.safeTransfer(msg.sender, dividend);
    }

    /**
     * @notice Transfers ETH dividend to Liquidity Provider
     * @notice Before transfer dividend, this exchange withdraws dividend in ETH from Lien Token
     */
    function receiveDividendEth() public {
        uint256 _currentTerm = currentTerm();
        if (_currentTerm == 1) {
            return;
        }
        _moveDividendEthFromLIEN(_currentTerm);
        uint256 lastReceivedTerm = lastReceivedTermsOfEth[msg.sender];
        lastReceivedTermsOfEth[msg.sender] = _currentTerm - 1;
        uint256 dividend;
        for (uint256 term = lastReceivedTerm + 1; term < _currentTerm; term++) {
            dividend += dividendEthAt(msg.sender, term);
        }
        emit ReceiveDividendETH(msg.sender, dividend);
        // solhint-disable-next-line avoid-low-level-calls
        (bool success, ) = msg.sender.call{value: dividend}("");
        require(success, "ETH transfer failed");
    }

    /**
     * @notice Gets current term in Lien Token
     **/
    function currentTerm() public view returns (uint256) {
        return lien.currentTerm();
    }

    /**
     * @notice Gets amount of ERC20 token dividend LP can get in the `term`
     * @param account Target account
     * @param token Target ERC20 token
     * @param term Target term
     **/
    function dividendTokenAt(
        address account,
        ERC20Interface token,
        uint256 term
    ) public view returns (uint256) {
        uint256 balanceAtTermEnd = balanceOfAtTermEnd(account, term);
        uint256 totalSupplyAtTermEnd = totalSupplyAtTermEnd(term);
        uint256 totalDividend = totalDividendTokenAt(token, term);
        return totalDividend.mul(balanceAtTermEnd).div(totalSupplyAtTermEnd);
    }

    /**
     * @notice Gets Amount of ETH dividend LP can get in the `term`
     * @param account Target account
     * @param term Target term
     **/
    function dividendEthAt(address account, uint256 term)
        public
        view
        returns (uint256)
    {
        uint256 balanceAtTermEnd = balanceOfAtTermEnd(account, term);
        uint256 totalSupplyAtTermEnd = totalSupplyAtTermEnd(term);
        uint256 totalDividend = totalDividendEthAt(term);
        return totalDividend.mul(balanceAtTermEnd).div(totalSupplyAtTermEnd);
    }

    /**
     * @notice Gets total amount of ERC20 token dividend this exchange received in the `term`
     * @param token Target ERC20 token
     * @param term Target term
     **/
    function totalDividendTokenAt(ERC20Interface token, uint256 term)
        public
        view
        returns (uint256)
    {
        return totalDividendsAt[term].tokens[token];
    }

    /**
     * @notice Gets total amount of ETH dividend this exchange received in the `term`
     * @param term Target term
     **/
    function totalDividendEthAt(uint256 term) public view returns (uint256) {
        return totalDividendsAt[term].eth;
    }

    /**
     * @notice Retrieves the balance of `account` at the end of the term `term`
     * @param account Target account
     * @param term Target term
     */
    function balanceOfAtTermEnd(address account, uint256 term)
        public
        view
        termValidation(term)
        returns (uint256)
    {
        uint256 _currentTerm = currentTerm();
        for (uint256 i = term; i < _currentTerm; i++) {
            if (_isSnapshottedOnTermEnd(i)) {
                return balanceOfAt(account, snapshotsOfTermEnd[i]);
            }
        }
        return balanceOf(account);
    }

    /**
     * @notice Retrieves the total supply at the end of the term `term`
     * @param term Target term
     */
    function totalSupplyAtTermEnd(uint256 term)
        public
        view
        termValidation(term)
        returns (uint256)
    {
        uint256 _currentTerm = currentTerm();
        for (uint256 i = term; i < _currentTerm; i++) {
            if (_isSnapshottedOnTermEnd(i)) {
                return totalSupplyAt(snapshotsOfTermEnd[i]);
            }
        }
        return totalSupply();
    }

    function _transfer(
        address from,
        address to,
        uint256 value
    ) internal virtual override {
        _snapshotOnTermEnd();
        super._transfer(from, to, value);
    }

    function _mint(address account, uint256 value) internal virtual override {
        _snapshotOnTermEnd();
        super._mint(account, value);
    }

    function _burn(address account, uint256 value) internal virtual override {
        _snapshotOnTermEnd();
        super._burn(account, value);
    }

    function _snapshotOnTermEnd() private {
        uint256 _currentTerm = currentTerm();
        if (_currentTerm > 1 && !_isSnapshottedOnTermEnd(_currentTerm - 1)) {
            snapshotsOfTermEnd[_currentTerm - 1] = _snapshot();
        }
    }

    function _isSnapshottedOnTermEnd(uint256 term) private view returns (bool) {
        return snapshotsOfTermEnd[term] != 0;
    }

    /**
     * @notice Withdraws dividends in ETH and iDOL from Lien Token
     * @dev At first, this function registers amount of dividends from Lien Token, and thereafter withdraws it
     **/
    function _moveDividendTokenFromLIEN(
        ERC20Interface token,
        uint256 _currentTerm
    ) private {
        uint256 expiration = lien.expiration();
        uint256 start;
        uint256 totalNewDividend;
        if (_currentTerm > expiration) {
            start = _currentTerm - expiration;
        } else {
            start = 1;
        }
        //get and register dividend amount in the exchange from Lien Token contract
        for (uint256 i = _currentTerm - 1; i >= start; i--) {
            if (totalDividendsAt[i].tokens[token] != 0) {
                break;
            }
            uint256 dividend = lien.dividendAt(
                address(token),
                address(this),
                i
            );
            totalDividendsAt[i].tokens[token] = dividend;
            totalNewDividend += dividend;
        }
        if (totalNewDividend == 0) {
            return;
        }
        lien.receiveDividend(address(token), address(this));
    }

    /**
     * @notice Withdraws dividends in ETH and iDOL from lienToken
     * @dev At first, this function registers amount of dividend from Lien Token, and thereafter withdraws it
     **/
    function _moveDividendEthFromLIEN(uint256 _currentTerm) private {
        uint256 expiration = lien.expiration();
        uint256 start;
        uint256 totalNewDividend;
        if (_currentTerm > expiration) {
            start = _currentTerm - expiration;
        } else {
            start = 1;
        }
        //get and register dividend amount in the exchange from Lien Token contract
        for (uint256 i = _currentTerm - 1; i >= start; i--) {
            if (totalDividendsAt[i].eth != 0) {
                break;
            }
            uint256 dividend = lien.dividendAt(address(0), address(this), i);
            totalDividendsAt[i].eth = dividend;
            totalNewDividend += dividend;
        }
        if (totalNewDividend == 0) {
            return;
        }
        lien.receiveDividend(address(0), address(this));
    }
}
