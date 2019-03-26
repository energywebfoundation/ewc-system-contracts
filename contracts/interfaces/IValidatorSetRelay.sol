pragma solidity ^0.5.4;


interface IValidatorSetRelay {
    function callbackInitiateChange(bytes32, address[] calldata)
        external
        returns (bool);
}
