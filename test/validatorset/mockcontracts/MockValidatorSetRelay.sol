pragma solidity 0.5.8;
import "../../../contracts/validatorset/ValidatorSetRelay.sol";


contract MockValidatorSetRelay is ValidatorSetRelay {

    constructor(address _owner, address _relayedSet)
        ValidatorSetRelay(_owner, _relayedSet)
        public
    {
    }

    function setSystem(address _systemAddress)
        external
        onlyOwner
        nonDefaultAddress(_systemAddress)
    {
        require(_systemAddress != systemAddress, "New system address cannot be the same as the old one");
        systemAddress = _systemAddress;
    }
}
