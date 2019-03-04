pragma solidity ^0.5.0;
import "../../../contracts/nodecontrol/NodeControlFoo.sol";


contract FooMock is NodeControlFoo {

    constructor(uint _x)
        public
        NodeControlFoo(_x + 1)
    {

    }

    function setX(uint _x)
        external
        returns (bool)
    {
        x = _x + 1;
        return true;
    }
}