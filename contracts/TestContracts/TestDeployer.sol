pragma solidity >=0.6.6;
import "./TestBondMaker.sol";
import "../utils/PriceCalculator.sol";
import "../utils/SpreadCalculator.sol";
import "./TestToken.sol";
import "./TestOracle.sol";

contract TestDeployer {
    address public underlyingToken;
    address public baseToken;
    address payable public settlementToken;
    address public bondMaker;
    address public factory;
    address public calc;
    address public spreadCalc;
    address public oracle;
    address public lienToken;

    constructor() public {
        TestToken _baseToken = new TestToken();
        baseToken = address(_baseToken);
        TestToken _settlementToken = new TestToken();
        settlementToken = address(_settlementToken);
        TestBondMaker _bondMaker = new TestBondMaker(settlementToken);
        bondMaker = address(_bondMaker);

        PriceCalculator _calc = new PriceCalculator();
        calc = address(_calc);
        SpreadCalculator _spreadCalc = new SpreadCalculator();
        spreadCalc = address(_spreadCalc);
        TestOracle _oracle = new TestOracle();
        oracle = address(_oracle);

        TestToken _lienToken = new TestToken();
        lienToken = address(_lienToken);
        /*
        ExchangeFactory _factory = new ExchangeFactory(underlyingToken, bondMaker);
        factory = address(_factory);
        */
    }

    function getAddresses()
        public
        view
        returns (
            address,
            address,
            address,
            address,
            address,
            address,
            address
        )
    {
        return (
            baseToken,
            settlementToken,
            bondMaker,
            calc,
            lienToken,
            spreadCalc,
            oracle
        );
    }
}
