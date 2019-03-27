pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;


interface NodeControlInterface {
    struct ValidatorState {
        bytes dockerSha;
        string dockerName;
        bytes chainSpecSha;
        string chainSpecUrl;
        bool isSigning;
        uint updateIntroduced;
        uint updateConfirmed;
    }

    event UpdateAvailable(address indexed targetValidator);

    ///@notice set the timestamp in the validatorstate
    function confirmUpdate() external;

    ///@notice gets the state stored in the validatorstate mapping
    ///@param _targetValidator the validator whos state you want
    ///@return a struct representing the stored state for the validator
    function retrieveExpectedState(address _targetValidator) external view returns (ValidatorState memory);

    ///@notice view function to check if a validator has updated to the latest state
    ///@param _targetValidator The validator you want to check
    ///@return true if it is up to date, false if not
    function isUpdateConfirmed(address _targetValidator) external view returns(bool);
}