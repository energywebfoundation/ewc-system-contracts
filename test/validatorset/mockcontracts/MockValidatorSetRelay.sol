pragma solidity 0.5.7;
import "../../../contracts/validatorset/ValidatorSetRelay.sol";


contract MockValidatorSetRelay is ValidatorSetRelay {

    bool callbackReturnValue;

    constructor(address _owner, address _relayedSet)
        ValidatorSetRelay(_owner, _relayedSet)
        public
    {
        callbackReturnValue = true;
    }

    function setCallbackRetval(bool _val)
        external
        onlyOwner
    {
        callbackReturnValue = _val;
    }

    function callbackInitiateChange(bytes32 _parentHash, address[] calldata _newSet)
        external
        onlyRelayed
        returns (bool)
    {
        if (callbackReturnValue){
            emit InitiateChange(_parentHash, _newSet);
            return true;
        }
        return false;
    }
}
