pragma solidity ^0.5.0;
import "../../../contracts/validatorset/ValidatorSetRelayed.sol";


contract MockValidatorSetRelayed is ValidatorSetRelayed {

    event AddSuccess();
    event AddFail();
    event RemoveSuccess();
    event RemoveFail();
    event CallbackSuccess();

    constructor(address _relayedSet, address[] memory _initial)
        ValidatorSetRelayed(_relayedSet, _initial)
        public
    {
           
    }

    function addValidatorWithEvent(address _validator)
        external
    {
        if (addValidator(_validator)) {
            emit AddSuccess();
            return;
        }
        emit AddFail();
    }

    function removeValidatorWithEvent(address _validator)
        external
    {
        if (removeValidator(_validator)) {
            emit RemoveSuccess();
            return;
        }
        emit RemoveFail();
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
}
