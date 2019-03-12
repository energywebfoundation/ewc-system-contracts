pragma solidity ^0.5.0;


interface IValidatorSetRelay {
    function callbackInitiateChange(bytes32, address[] calldata)
        external
        returns (bool);
}
