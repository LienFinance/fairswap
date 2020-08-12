pragma solidity >=0.6.6;
import "../Interfaces/BondMakerInterface.sol";

contract TestBondMaker is BondMakerInterface {
    uint256 _maturity;
    address lbtAddress;
    uint64[] strikePrices = [1000000, 0]; //$100
    bytes32[] bondIDs;
    uint256 i = 0;

    constructor(address _lbtAddress) public {
        bondIDs.push(bytes32("a"));
        bondIDs.push(bytes32("b"));
        lbtAddress = _lbtAddress;
        _maturity = now + 1000000;
    }

    function getBond(bytes32 bondID)
        external
        override(BondMakerInterface)
        view
        returns (
            address bondAddress,
            uint256 maturity,
            uint64 solidStrikePrice,
            bytes32 fnMapID
        )
    {
        if (bondID == bondIDs[0]) {
            solidStrikePrice = strikePrices[0];
        } else {
            solidStrikePrice = strikePrices[1];
        }
        return (lbtAddress, _maturity, solidStrikePrice, bytes32("b"));
    }

    function getBondGroup(uint256 bondGroupID)
        external
        override(BondMakerInterface)
        view
        returns (bytes32[] memory, uint256)
    {
        return (bondIDs, _maturity);
    }

    function changeMaturity(uint256 newMaturity) public {
        _maturity = newMaturity;
    }
}

contract TestBondMakerLBT is BondMakerInterface {
    uint256 _maturity;
    address lbtAddress;
    uint64[] strikePrices = [1000000, 0]; //$100
    bytes32[] bondIDs;
    uint256 i = 0;

    constructor(address _lbtAddress) public {
        bondIDs.push(bytes32("a"));
        bondIDs.push(bytes32("b"));
        lbtAddress = _lbtAddress;
        _maturity = now + 1000000;
    }

    function getBond(bytes32 bondID)
        external
        override(BondMakerInterface)
        view
        returns (
            address bondAddress,
            uint256 maturity,
            uint64 solidStrikePrice,
            bytes32 fnMapID
        )
    {
        return (lbtAddress, _maturity, 0, bytes32("b"));
    }

    function getBondGroup(uint256 bondGroupID)
        external
        override(BondMakerInterface)
        view
        returns (bytes32[] memory, uint256)
    {
        return (bondIDs, _maturity);
    }
}

contract TestBondMakerMultiple is BondMakerInterface {
    uint256 _maturity;
    address lbtAddress;
    uint64[] strikePrices = [1000000, 0]; //$100
    bytes32[] bondIDs;
    uint256 i = 0;

    constructor(address _lbtAddress) public {
        bondIDs.push(bytes32("a"));
        bondIDs.push(bytes32("b"));
        bondIDs.push(bytes32("c"));
        lbtAddress = _lbtAddress;
        _maturity = now + 1000000;
    }

    function getBond(bytes32 bondID)
        external
        override(BondMakerInterface)
        view
        returns (
            address bondAddress,
            uint256 maturity,
            uint64 solidStrikePrice,
            bytes32 fnMapID
        )
    {
        if (bondID == bondIDs[0]) {
            solidStrikePrice = strikePrices[0];
        } else {
            solidStrikePrice = strikePrices[1];
        }
        return (lbtAddress, _maturity, solidStrikePrice, bytes32("b"));
    }

    function getBondGroup(uint256 bondGroupID)
        external
        override(BondMakerInterface)
        view
        returns (bytes32[] memory, uint256)
    {
        return (bondIDs, _maturity);
    }
}
