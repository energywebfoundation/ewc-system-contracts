pragma solidity ^0.5.0;
import "../../../contracts/validatorset/ValidatorSetRelay.sol";


contract MockValidatorSetRelay is ValidatorSetRelay {

    constructor(address _relayedSet)
        ValidatorSetRelay(_relayedSet)
        public
    {
        
    }

/*
    function callbackInitiateChange(bytes32, address[] calldata)
        external
        returns (bool)
    {
        return true;
    }
*/
    function setSystem(address _system)
        external
        onlyOwner
    {
        SYSTEM_ADDRESS = _system;
    }
}
