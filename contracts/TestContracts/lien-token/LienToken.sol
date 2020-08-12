pragma solidity 0.6.6;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./ERC20Vestable.sol";
import "./ERC20RegularlyRecord.sol";

/**
 * @notice ERC20 Token with dividend mechanism.
 * It accepts ether and ERC20 tokens as assets for profit, and distributes them to the token holders pro rata to their shares.
 * Total profit and dividends of each holders are settled regularly at the pre specified interval.
 * Even after moving tokens, the holders keep the right to receive already settled dividends because this contract records states(the balances of accounts and the total supply of token) at the moment of settlement.
 * There is a pre specified length of period for right to receive dividends.
 * When the period expires, unreceived dividends are carried over to a new term and distributed to the holders on the new term.
 * It also have token vesting mechanism.
 * The beneficiary of the grant cannot transfer the granted token before vested, but can earn dividends for the granted tokens.
 */
contract LienToken is ERC20RegularlyRecord, ERC20Vestable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address public constant ETH_ADDRESS = address(0);

    // Profit and paid balances of a certain asset.
    struct Balances {
        uint256 profit;
        uint256 paid;
    }

    // Expiration term number for the right to receive dividends.
    uint256 public immutable expiration;

    // account address => token => term
    mapping(address => mapping(address => uint256)) public lastTokenReceived;

    // term => token => balances
    mapping(uint256 => mapping(address => Balances)) private balancesMap;

    event SettleProfit(
        address indexed token,
        uint256 indexed term,
        uint256 amount
    );
    event ReceiveDividend(
        address indexed token,
        address indexed recipient,
        uint256 amount
    );

    /**
     * @param _interval Length of a term in second
     * @param _expiration Number of term for expiration
     * @param totalSupply Total supply of this token
     **/
    constructor(
        uint256 _interval,
        uint256 _expiration,
        uint256 totalSupply
    ) public ERC20RegularlyRecord(_interval) ERC20("lien", "LIEN") {
        _setupDecimals(8);
        ERC20._mint(msg.sender, totalSupply);
        expiration = _expiration;
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    /**
     * @notice Recognizes the unsettled profit in the form of token occurred in the current term.
     * Carried over dividends are also counted.
     */
    function settleProfit(address token) external {
        uint256 amount = unsettledProfit(token);
        uint256 currentTerm = currentTerm();
        Balances storage b = balancesMap[currentTerm][token];
        uint256 newProfit = b.profit.add(amount);
        b.profit = newProfit;
        emit SettleProfit(token, currentTerm, newProfit);
    }

    /**
     * @notice Receives all the valid dividends in the form of token.
     * @param recipient recipient of dividends.
     */
    function receiveDividend(address token, address recipient) external {
        uint256 i;
        uint256 total;
        uint256 divAt;
        uint256 currentTerm = currentTerm();
        for (
            i = Math.max(
                _oldestValidTerm(),
                lastTokenReceived[recipient][token]
            );
            i < currentTerm;
            i++
        ) {
            divAt = dividendAt(token, recipient, i);
            balancesMap[i][token].paid = balancesMap[i][token].paid.add(divAt);
            total = total.add(divAt);
        }
        lastTokenReceived[recipient][token] = i;
        emit ReceiveDividend(token, recipient, total);
        if (token == ETH_ADDRESS) {
            (bool success, ) = recipient.call{value: total}("");
            require(success, "transfer failed");
        } else {
            IERC20(token).safeTransfer(recipient, total);
        }
    }

    /**
     * @notice Returns settled profit in the form of `token` on `term`.
     */
    function profitAt(address token, uint256 term)
        public
        view
        returns (uint256)
    {
        return balancesMap[term][token].profit;
    }

    /**
     * @notice Returns the balance of already-paid dividends in `token` on `term`.
     */
    function paidAt(address token, uint256 term) public view returns (uint256) {
        return balancesMap[term][token].paid;
    }

    /**
     * @notice Returns the balance of dividends in `token` on `term` to `account`.
     */
    function dividendAt(
        address token,
        address account,
        uint256 term
    ) public view returns (uint256) {
        return
            _dividend(
                profitAt(token, term),
                balanceOfAtTermEnd(account, term),
                totalSupply()
            );
    }

    /**
     * @notice Returns the balance of unrecognized profit in `token`.
     * It includes carried over dividends.
     */
    function unsettledProfit(address token) public view returns (uint256) {
        uint256 remain;
        uint256 tokenBalance;
        uint256 currentTerm = currentTerm();
        for (uint256 i = _oldestValidTerm(); i <= currentTerm; i++) {
            Balances memory b = balancesMap[i][token];
            uint256 remainAt = b.profit.sub(b.paid);
            remain = remain.add(remainAt);
        }
        if (token == ETH_ADDRESS) {
            tokenBalance = address(this).balance;
        } else {
            tokenBalance = IERC20(token).balanceOf(address(this));
        }
        return tokenBalance.sub(remain);
    }

    /**
     * @notice Returns the balance of valid dividends in `token`.
     * @param recipient recipient of dividend.
     */
    function unreceivedDividend(address token, address recipient)
        external
        view
        returns (uint256)
    {
        uint256 i;
        uint256 total;
        uint256 divAt;
        uint256 currentTerm = currentTerm();
        for (
            i = Math.max(
                _oldestValidTerm(),
                lastTokenReceived[recipient][token]
            );
            i < currentTerm;
            i++
        ) {
            divAt = dividendAt(token, recipient, i);
            total = total.add(divAt);
        }
        return total;
    }

    /**
     * @dev It Overrides ERCVestable and ERC20RegularlyRecord.
     * To record states regularly, it calls `transfer` of ERC20RegularlyRecord.
     * To restrict value to be less than max spendable balance, it uses `spendable` modifier of ERC20Vestable.
     */
    function _transfer(
        address from,
        address to,
        uint256 value
    )
        internal
        virtual
        override(ERC20Vestable, ERC20RegularlyRecord)
        spendable(from, value)
    {
        ERC20RegularlyRecord._transfer(from, to, value);
    }

    /**
     * @dev It overrides ERC20Vestable and ERC20RegularlyRecord.
     * Both of these base class define `_burn`, so this contract must override `_burn` expressly.
     */
    function _burn(address account, uint256 value)
        internal
        virtual
        override(ERC20, ERC20RegularlyRecord)
    {
        ERC20RegularlyRecord._burn(account, value);
    }

    /**
     * @dev It overrides ERC20Vestable and ERC20RegularlyRecord.
     * Both of these base class define `_mint`, so this contract must override `_mint` expressly.
     */
    function _mint(address account, uint256 value)
        internal
        virtual
        override(ERC20, ERC20RegularlyRecord)
    {
        ERC20RegularlyRecord._mint(account, value);
    }

    function _oldestValidTerm() private view returns (uint256) {
        uint256 currentTerm = currentTerm();
        if (currentTerm <= expiration) {
            return 1;
        }
        return currentTerm.sub(expiration);
    }

    /**
     * @dev Returns the value of dividend pro rata share of token.
     * dividend = profit * balance / totalSupply
     */
    function _dividend(
        uint256 profit,
        uint256 balance,
        uint256 totalSupply
    ) private pure returns (uint256) {
        return profit.mul(balance).div(totalSupply);
    }
}
