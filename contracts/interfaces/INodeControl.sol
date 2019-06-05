pragma solidity 0.5.8;
pragma experimental ABIEncoderV2;


interface INodeControl {
    struct ValidatorState {
        bytes dockerSha;
        string dockerName;
        bytes chainSpecSha;
        string chainSpecUrl;
        bool isSigning;
        uint updateIntroduced;
        uint updateConfirmed;
    }

    event UpdateAvailable(address indexed _targetValidator);

    ///@notice Set the timestamp in the validatorstate
    function confirmUpdate() external;

    ///@notice Gets the state stored in the validatorstate mapping
    ///@param _targetValidator The validator whos state you want
    ///@return A struct representing the stored state for the validator
    function retrieveExpectedState(address _targetValidator)
        external
        view
        returns (ValidatorState memory);

    ///@notice View function to check if a validator has updated to the latest state
    ///@param _targetValidator The validator you want to check
    ///@return True if it is up to date, false if not
    function isUpdateConfirmed(address _targetValidator)
        external
        view
        returns(bool);
}
