pragma solidity 0.6.6;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Snapshot.sol";

/**
 * @dev This contract extends an ERC20Snapshot token, which extends ERC20 and has a snapshot mechanism.
 * When a snapshot is created, the balances and the total supply (state) at the time are recorded for later accesses.
 *
 * This contract records states at regular intervals.
 * When the first transferring, minting, or burning on the term occurring, snapshot is taken to record the state at the end of the previous term.
 * If no action occurs on the next term of one term, state at the end of the term is not snapshotted, but the state is same as the one at the end of next term of it.
 * So, in that case, accessing to the state at the end of the term is internally solved by referencing to the snapshot taken after it has ended.
 * If no action occurs after one term, state at the end of the term is same as the current state and Accessing to the state is solved by referencing the current state.
 */
abstract contract ERC20RegularlyRecord is ERC20Snapshot {
    using SafeMath for uint256;

    /**
     * @dev Interval of records in seconds.
     */
    uint256 public immutable interval;

    /**
     * @dev Starting Time of the first term.
     */
    uint256 public immutable initialTime;

    // term => snapshotId
    mapping(uint256 => uint256) private snapshotsOfTermEnd;

    modifier termValidation(uint256 _term) {
        require(_term != 0, "0 is invalid value as term");
        _;
    }

    /**
     * @param _interval Interval of records in seconds.
     * The first term starts when this contract is constructed.
     */
    constructor(uint256 _interval) public {
        interval = _interval;
        initialTime = now;
    }

    /**
     * @notice Returns term of `time`.
     * The first term is 1, After one interval, the term becomes 2.
     * Term of time T is calculated by the following formula
     * (T - initialTime)/interval + 1
     */
    function termOfTime(uint256 time) public view returns (uint256) {
        return time.sub(initialTime, "time is invalid").div(interval).add(1);
    }

    /**
     * @notice Returns the current term.
     */
    function currentTerm() public view returns (uint256) {
        return termOfTime(now);
    }

    /**
     * @notice Returns when `term` starts.
     * @param term > 0
     */
    function startOfTerm(uint256 term)
        public
        view
        termValidation(term)
        returns (uint256)
    {
        return initialTime.add(term.sub(1).mul(interval));
    }

    /**
     * @notice Returns when `term` ends.
     * @param term > 0
     */
    function endOfTerm(uint256 term)
        public
        view
        termValidation(term)
        returns (uint256)
    {
        return initialTime.add(term.mul(interval)).sub(1);
    }

    /**
     * @notice Retrieves the balance of `account` at the end of the `term`
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
     * @notice Retrieves the total supply at the end of the `term`
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

    /**
     * @dev Takes a snapshot before the first transferring, minting or burning on the term.
     * If snapshot is not taken after the last term ended, take a snapshot to record states at the end of the last term.
     */
    function _snapshotOnTermEnd() private {
        uint256 _currentTerm = currentTerm();
        if (_currentTerm > 1 && !_isSnapshottedOnTermEnd(_currentTerm - 1)) {
            snapshotsOfTermEnd[_currentTerm - 1] = _snapshot();
        }
    }

    /**
     * @dev Returns `true` if snapshot was already taken to record states at the end of the `term`.
     * If it's not, snapshotOfTermEnd[`term`] is 0 as the default value.
     */
    function _isSnapshottedOnTermEnd(uint256 term) private view returns (bool) {
        return snapshotsOfTermEnd[term] != 0;
    }
}
