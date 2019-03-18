pragma solidity ^0.5.0;
import "../../../contracts/validatorset/ValidatorSetRelay.sol";


contract MockValidatorSetRelay is ValidatorSetRelay {

    constructor(address _relayedSet)
        ValidatorSetRelay(_relayedSet)
        public
    {
        
    }
}
