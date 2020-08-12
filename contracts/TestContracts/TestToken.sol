pragma solidity >=0.6.6;

interface ERC20Token {
    function balanceOf(address who) external returns (uint256);

    function transfer(address to, uint256 value) external returns (bool);

    function allowance(address owner, address spender)
        external
        returns (uint256);

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool);

    function approve(address spender, uint256 value) external returns (bool);

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
    event Transfer(address indexed from, address indexed to, uint256 value);
}

library TestSafeMath {
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a * b;
        assert(a == 0 || c / a == b);
        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // assert(b > 0); // Solidity automatically throws when dividing by 0
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold
        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        assert(b <= a);
        return a - b;
    }

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        assert(c >= a);
        return c;
    }
}

contract StandardToken is ERC20Token {
    using TestSafeMath for uint256;

    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) internal allowed;

    function transfer(address _to, uint256 _value)
        external
        override(ERC20Token)
        returns (bool)
    {
        require(_to != address(0));
        require(_value <= balances[msg.sender]);

        // SafeMath.sub will throw if there is not enough balance.
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external override(ERC20Token) returns (bool) {
        require(_to != address(0));
        require(_value <= balances[_from]);
        require(_value <= allowed[_from][msg.sender]);

        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
        emit Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value)
        external
        override(ERC20Token)
        returns (bool)
    {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender)
        external
        override(ERC20Token)
        returns (uint256 remaining)
    {
        return allowed[_owner][_spender];
    }

    function increaseApproval(address _spender, uint256 _addedValue)
        external
        returns (bool success)
    {
        allowed[msg.sender][_spender] = allowed[msg.sender][_spender].add(
            _addedValue
        );
        emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;
    }

    function decreaseApproval(address _spender, uint256 _subtractedValue)
        external
        returns (bool success)
    {
        uint256 oldValue = allowed[msg.sender][_spender];
        if (_subtractedValue > oldValue) {
            allowed[msg.sender][_spender] = 0;
        } else {
            allowed[msg.sender][_spender] = oldValue.sub(_subtractedValue);
        }
        emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;
    }

    function balanceOf(address _owner)
        external
        override(ERC20Token)
        returns (uint256 balance)
    {
        return balances[_owner];
    }
}

contract TestToken is StandardToken {
    string public name;
    string public symbol;
    uint256 public decimals;
    uint256 public totalSupply;
    bool public expired = true;

    constructor() public {
        name = "TESTTOKEN";
        symbol = "test";
        decimals = 8;
    }

    receive() external payable {}

    function mintToken(uint256 amount) external {
        balances[msg.sender] = amount;
        totalSupply = totalSupply.add(amount);
    }

    function setDecimals(uint8 _decimals) public {
        decimals = _decimals;
    }

    function changeExpiredFlag() public {
        expired = !expired;
    }

    function burn(uint256 _amount) external returns (bool) {
        require(_amount > 0);

        if (address(this).balance > 0 && expired) {
            uint256 ethAmount = (address(this).balance).mul(_amount).div(
                totalSupply
            );
            msg.sender.transfer(ethAmount);
            return true;
        } else if (!(expired)) {
            return false;
        }
        return true;
        //msg.sender.transfer(address(this).balance);
    }
}
