pragma solidity ^0.5.0;

import "../interfaces/IValidatorSetRelay.sol";
import "../interfaces/IValidatorSetRelayed.sol";
import "../misc/Ownable.sol";


contract ValidatorSetRelayed is IValidatorSetRelayed, Ownable {

    struct AddressStatus {
        // Is this address a validator
        bool isValidator;
        // Is this validator pending
        bool isPending;
        // Index in currentValidators list
        uint256 index;
    }

    // Was the last validator change finalized. Implies currentValidators == pendingValidators
    bool public finalized;

    // Current list of addresses entitled to participate in the consensus.
    address[] private currentValidators;
    address[] private pendingValidators;
    mapping(address => AddressStatus) public addressStatus;
    // address of validator pending to be removed
    address private toBeRemoved;

    // The relay validator contract
    IValidatorSetRelay public relaySet;

    event ChangeFinalized(address[] currentSet);
    event ReportedMalicious(address indexed reporter, address indexed reported, uint indexed blocknum);
    event ReportedBenign(address indexed reporter, address indexed reported, uint indexed blocknum);

    modifier onlyActiveValidator(address _someone) {
        require(_isActiveValidator(_someone), "Address is not an active validator");
        _;
    }

    modifier onlyRelay() {
        require(msg.sender == address(relaySet), "Caller is not the relay contract");
        _;
    }

    modifier whenFinalized() {
        require(finalized, "Validator set is not finalized yet");
        _;
    }

    modifier whenNotFinalized() {
        require(!finalized, "Validator set is finalized");
        _;
    }

    modifier blockNumberValid(uint _blockNumber) {
        require(_blockNumber < block.number, "Block number is not valid.");
        _;
    }

    constructor(address _relaySet, address[] memory _initial)
        public
    {
        require(_relaySet != address(0), "Relay contract address cannot be 0x0");
        
        relaySet = IValidatorSetRelay(_relaySet);

        for (uint i = 0; i < _initial.length; i++) {
            require(_initial[i] != address(0), "Initial validator address cannot be 0x0");
            
            addressStatus[_initial[i]].isValidator = true;
            addressStatus[_initial[i]].isPending = false;
            addressStatus[_initial[i]].index = i;
        }
        pendingValidators = _initial;
        currentValidators = pendingValidators;
    }

    function reportBenign(address _reporter, address _validator, uint _blockNumber)
        external
        onlyActiveValidator(_reporter)
        onlyActiveValidator(_validator)
        blockNumberValid(_blockNumber)
        onlyRelay
    {
        emit ReportedBenign(_reporter, _validator, _blockNumber);
    }

    function reportMalicious(
        address _reporter,
        address _validator,
        uint _blockNumber,
        bytes calldata _proof
    )
        external
        onlyActiveValidator(_reporter)
        onlyActiveValidator(_validator)
        blockNumberValid(_blockNumber)
        onlyRelay
    {
        emit ReportedMalicious(_reporter, _validator, _blockNumber);
    }

    function setRelay(address _relaySet)
        external
        onlyOwner
    {
        relaySet = IValidatorSetRelay(_relaySet);
    }

    function finalizeChange()
        external
        whenNotFinalized
        onlyRelay
    {
        finalized = true;
        
        for (uint256 i = 0; i < pendingValidators.length; i++) {
            AddressStatus storage vstatus = addressStatus[pendingValidators[i]];
            if (vstatus.isPending) {
                vstatus.isPending = false;
            }
        }

        if (toBeRemoved != address(0)) {
            addressStatus[toBeRemoved].isPending = false;
            toBeRemoved = address(0);
        }  

        currentValidators = pendingValidators;
        emit ChangeFinalized(currentValidators);
    }

    function getValidators()
        external
        view
        returns (address[] memory)
    {
        return currentValidators;
    }

    function getPendingValidators()
        external
        view
        returns (address[] memory)
    {
        return pendingValidators;
    }

    function getValidatorsNum()
        external
        view
        returns(uint256)
    {
        return currentValidators.length;
    }

    function isValidator(address _somebody)
        external
        view
        returns (bool)
    {
        return addressStatus[_somebody].isValidator;
    }

    function isFinalizedValidator(address _somebody)
        external
        view
        returns (bool)
    {
        return _isActiveValidator(_somebody);
    }

    function isPending(address _somebody)
        external
        view
        returns (bool)
    {
        return addressStatus[_somebody].isPending;
    }

    function addValidator(address _validator)
        public
        onlyOwner
        returns(bool)
    {
        if (_addValidatorAllowed(_validator)) {
            _addValidator(_validator);
            return true;
        }
        return false;
    }

    function removeValidator( address _validator)
        public
        onlyOwner
        returns(bool)
    {
        if (_removeValidatorAllowed(_validator)) {
            _removeValidator(_validator);
            return true;
        }
        return false;
    }

    function _triggerChange()
        private
        whenFinalized
    {
        finalized = false;
        _initiateChange();
    }

    function _initiateChange()
        private
    {
        relaySet.callbackInitiateChange(blockhash(block.number - 1), pendingValidators);
    }

    function _addValidatorAllowed(address _validator)
        private
        view
        returns (bool)    
    {
        if (_validator == address(0) || _isActiveValidator(_validator)) {
            return false;
        }
        return true;
    }

    function _isActiveValidator(address _someone)
        private
        view
        returns(bool)
    {
        bool isV = addressStatus[_someone].isValidator;
        bool isP = addressStatus[_someone].isPending;

        // already in the active set, or in the active set but about to be removed
        return ((isV && !isP) || (!isV && isP));
    }

    function _addValidator(address _validator)
        private
    {
        addressStatus[_validator].isValidator = true;
        addressStatus[_validator].isPending = true;
        addressStatus[_validator].index = pendingValidators.length;
        
        pendingValidators.push(_validator);
        _triggerChange();
    }

    function _removeValidatorAllowed(address _validator)
        private
        view
        returns(bool)
    {
        if (pendingValidators.length == 0 || !_isActiveValidator(_validator)) {
            return false;
        }
        return true;
    }

    function _removeValidator(address _validator)
        private
    {
        uint256 removedIndex = addressStatus[_validator].index;
        // Cannot remove the last validator.
        uint256 lastIndex = pendingValidators.length - 1;
        address lastValidator = pendingValidators[lastIndex];
        // Override the removed validator with the last one.
        pendingValidators[removedIndex] = lastValidator;
        addressStatus[lastValidator].index = removedIndex;
        pendingValidators.length--;

        addressStatus[_validator].index = 0;
        addressStatus[_validator].isValidator = false;
        addressStatus[_validator].isPending = true;

        toBeRemoved = _validator;

        _triggerChange();
    }
}
