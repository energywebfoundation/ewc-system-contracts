pragma solidity ^0.5.0;
import "../../../contracts/vesting/VestingFoo.sol";


contract FooMock is VestingFoo {

    constructor(uint _x)
        public
        VestingFoo(_x + 1)
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