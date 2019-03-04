pragma solidity ^0.5.0;
import "../../../contracts/validatorset/ValidatorFoo.sol";


contract FooMock is ValidatorFoo {

    constructor(uint _x)
        public
        ValidatorFoo(_x + 1)
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
