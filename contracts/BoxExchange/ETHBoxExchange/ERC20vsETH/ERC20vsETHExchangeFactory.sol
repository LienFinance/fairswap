pragma solidity >=0.6.6;
import "./ERC20vsETHBoxExchange.sol";

contract ETHExchangeFactory {
    event ExchangeLaunch(address indexed exchange, address indexed token);
    PriceCalculatorInterface private immutable priceCalc;
    SpreadCalculatorInterface private immutable spreadCalc;
    address private immutable marketFeeTaker;
    mapping(address => mapping(address => address))
        internal oracleToTokenToExchange;

    /**
     * @param _marketFeeTaker Address of market fee taker (i.e. Lien Token)
     * @param _priceCalc Price Calculator contract
     * @param _spreadCalc Spread Calculator contract
     **/
    constructor(
        address _marketFeeTaker,
        PriceCalculatorInterface _priceCalc,
        SpreadCalculatorInterface _spreadCalc
    ) public {
        marketFeeTaker = _marketFeeTaker;
        priceCalc = _priceCalc;
        spreadCalc = _spreadCalc;
    }

    /**
     * @notice Launches new exchange
     * @param token ERC20 token of target exchange
     * @param tokenAmount Initial liquidity in ERC20 token
     * @param initialShare Initial supply of share token
     * @param oracle Oracle of ERC20/ETH. If there is no oracle, use address(0)
     **/
    function launchExchange(
        ERC20Interface token,
        uint256 tokenAmount,
        uint256 initialShare,
        OracleInterface oracle
    ) external payable returns (address exchange) {
        require(
            oracleToTokenToExchange[address(oracle)][address(token)] ==
                address(0),
            "Exchange is already launched the pair of token and oracle"
        ); //There can be only one exchange per one pair of token and oracle
        require(
            address(token) != address(0) && address(token) != address(this),
            "Invalid token address"
        );

        string memory namePrefix = "SHARE-";
        string memory nameSuffix = "-ETH";
        string memory tokenName = token.name();
        string memory shareName = string(
            abi.encodePacked(namePrefix, tokenName, nameSuffix)
        );

        ERC20vsETHBoxExchange newExchange = new ERC20vsETHBoxExchange(
            token,
            priceCalc,
            marketFeeTaker,
            spreadCalc,
            oracle,
            shareName
        );
        address exchangeAddress = address(newExchange);
        oracleToTokenToExchange[address(oracle)][address(
            token
        )] = exchangeAddress;
        emit ExchangeLaunch(exchangeAddress, address(token));
        _initializeExchange(
            token,
            address(oracle),
            msg.value,
            tokenAmount,
            initialShare
        );
        return exchangeAddress;
    }

    /**
     * @notice Gets exchange address from Address of ERC20 token and oracle
     * @param tokenAddress Address of ERC20 token
     * @param oracleAddress Address of oracle
     **/
    function tokenToExchangeLookup(address tokenAddress, address oracleAddress)
        external
        view
        returns (address exchange)
    {
        return oracleToTokenToExchange[oracleAddress][tokenAddress];
    }

    /**
     * @dev If there is no share token, user can reinitialize exchange
     * @param token Address of ERC20 token of target exchange
     * @param oracleAddress Address of oracle of target exchange
     * @param tokenAmount Amount of ERC20 token to be provided
     * @param initialShare Initial supply of share token
     **/
    function initializeExchange(
        ERC20Interface token,
        address oracleAddress,
        uint256 tokenAmount,
        uint256 initialShare
    ) external payable {
        _initializeExchange(
            token,
            oracleAddress,
            msg.value,
            tokenAmount,
            initialShare
        );
    }

    function _initializeExchange(
        ERC20Interface token,
        address oracleAddress,
        uint256 ethAmount,
        uint256 tokenAmount,
        uint256 initialShare
    ) private {
        require(ethAmount != 0, "You should transfer ETH");
        require(
            token.transferFrom(msg.sender, address(this), tokenAmount),
            "ERC20: cannot receive your token"
        );


            address exchangeAddress
         = oracleToTokenToExchange[oracleAddress][address(token)];
        require(exchangeAddress != address(0), "Exchange does not exist");
        token.approve(exchangeAddress, tokenAmount);
        ETHBoxExchange Exchange = ETHBoxExchange(payable(exchangeAddress));

        Exchange.initializeExchange{value: ethAmount}(
            tokenAmount,
            initialShare
        );
        Exchange.transfer(msg.sender, initialShare);
    }
}
