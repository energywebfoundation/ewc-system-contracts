pragma solidity 0.5.8;


/// @title Reporting validator set relay interface
interface IValidatorSetRelay {

    /// @notice Callback function to signal a desired change in
    /// the validator set in the contract seen by the engine
    /// @dev Should emit `InitiateChange` event
    /// @return True upon successful initiation, false otherwise
    function callbackInitiateChange(bytes32, address[] calldata)
        external
        returns (bool);
}
