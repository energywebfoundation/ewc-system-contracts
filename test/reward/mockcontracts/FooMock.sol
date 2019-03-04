pragma solidity ^0.5.0;
import "../../../contracts/reward/RewardFoo.sol";


contract FooMock is RewardFoo {

    constructor(uint _x)
        public
        RewardFoo(_x + 1)
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