pragma solidity 0.5.8;
import "../../../contracts/validatorset/ValidatorSetRelayed.sol";


contract MockValidatorSetRelayed is ValidatorSetRelayed {

    event AddSuccess();
    event AddFail();
    event RemoveSuccess();
    event RemoveFail();
    event CallbackSuccess();

    constructor(address _owner, address _relayedSet, address[] memory _initial)
        ValidatorSetRelayed(_owner, _relayedSet, _initial)
        public
    {
           
    }

    function triggerRelayCallbackWithEvent(bytes32 _bHash, address[] calldata _vals)
        external
        onlyOwner
    {
        if (relaySet.callbackInitiateChange(_bHash, _vals)) {
            emit CallbackSuccess();
            return;
        }
    }

    function triggerRemoveValidator(address _validator)
        external
        onlyOwner
    {
        _removeValidator(_validator);
    }
}
