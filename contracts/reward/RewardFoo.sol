pragma solidity ^0.5.0;

import "../interfaces/SetX.sol";


contract RewardFoo is SetX {
    
    uint public x;

    constructor(uint _x)
        public
    {
        x = _x;
    }

    function setX(uint _x)
        external
        returns (bool)
    {
        x = _x;
    }
}
