pragma solidity ^0.5.4;

import "../interfaces/IValidatorSetRelay.sol";
import "../interfaces/IValidatorSetRelayed.sol";
import "../misc/Ownable.sol";


/// @title Relayed Validator Set contract
/// @notice This owned contract holds the actual validator-set logic. The Relay contract
/// relays the function calls to this contract and they communicate through well defined interfaces.
contract ValidatorSetRelayed is IValidatorSetRelayed, Ownable {

    /// Holds address validator status information
    struct AddressStatus {
        /// Is this address a validator
        bool isValidator;
        /// Is this validator pending to be added or removed
        bool isPending;
        /// Index in currentValidators list
        uint256 index;
    }

    /// Was the last validator change finalized. Implies currentValidators == pendingValidators
    bool public finalized;

    /// Current list of addresses entitled to participate in the consensus. Active validators.
    address[] private currentValidators;
    /// New list of validators pending to be approved
    address[] private pendingValidators;
    mapping(address => AddressStatus) public addressStatus;
    // address of validator pending to be removed
    address private toBeRemoved;

    /// The Relay validator-set contract
    IValidatorSetRelay public relaySet;

    event ChangeFinalized(address[] validatorSet);
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

    /// @notice throws if blocknumber is in the future
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

    /// @notice called to log a benign report event
    /// @param _reporter the reporting validator
    /// @param _reported the validator who is reported
    /// @param _blockNumber the block number which the report is for
    function reportBenign(address _reporter, address _reported, uint _blockNumber)
        external
        onlyActiveValidator(_reporter)
        onlyActiveValidator(_reported)
        blockNumberValid(_blockNumber)
        onlyRelay
    {
        emit ReportedBenign(_reporter, _reported, _blockNumber);
    }

    /// @notice called to log a malicious report event
    /// @param _reporter the reporting validator
    /// @param _reported the validator who is reported
    /// @param _blockNumber the block number which the report is for
    /// @param _proof the proof. It is not used right now
    function reportMalicious(
        address _reporter,
        address _reported,
        uint _blockNumber,
        bytes calldata _proof
    )
        external
        onlyActiveValidator(_reporter)
        onlyActiveValidator(_reported)
        blockNumberValid(_blockNumber)
        onlyRelay
    {
        emit ReportedMalicious(_reporter, _reported, _blockNumber);
    }

    /// @notice Sets the Relay contract address
    /// @dev The contract is assumed to implement the `IValidatorSetRelay` interface.
    /// Only callable by the contract owner
    /// @param _relaySet The new relay contract address
    function setRelay(address _relaySet)
        external
        onlyOwner
    {
        require(_relaySet != address(0), "Relay contract address cannot be 0x0");
        require(_relaySet != address(relaySet),
            "New relay contract address cannot be the same as the current one.");
        relaySet = IValidatorSetRelay(_relaySet);
    }

    /// @notice Called by the relay to finalize changes made to the validator set.
    /// Callable only if there are changes to be finalized.
    /// @dev The contract is assumed to implement the `IValidatorSetRelay` interface
    /// Only callable by the relay contract, which forwards the call from SYSTEM
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

    /// @notice Adds a validator to the pending list and initiates a change.
    /// Can only be called if the validator is not in the active list, or
    /// there are no changes to be finalized. The validator only becomes active when it is finalized.
    /// @dev First adds the validator to the pending list, then calls the `callbackInitiateChange`
    /// of the Relay contract which emits the `InitiateChange` event
    /// @param _validator The address to be added as validator
    function addValidator(address _validator)
        external
        onlyOwner
    {
        require(_addValidatorAllowed(_validator), "Adding (this) validator is not allowed");
        _addValidator(_validator);
    }

    /// @notice Removes a validator from the pending list and initiates a change.
    /// Can only be called if the validator is in the active list, or
    /// there are no changes to be finalized. Until the validator removal is finalized, it is still
    /// active.
    /// @dev First removes the validator from `pendingValidators`, then calls the `callbackInitiateChange`
    /// of the Relay contract which emits the `InitiateChange` event
    /// @param _validator The address to be removed
    function removeValidator( address _validator)
        external
        onlyOwner
    {
        require(_removeValidatorAllowed(_validator), "Removing (this) validator is not allowed");
        _removeValidator(_validator);
    }

    /// @notice Returns currently active validators
    /// @return The list of addresses of currently active validators
    function getValidators()
        external
        view
        returns (address[] memory)
    {
        return currentValidators;
    }

    /// @notice Returns pending validators list
    /// @return The list of addresses of pending validators
    function getPendingValidators()
        external
        view
        returns (address[] memory)
    {
        return pendingValidators;
    }

    /// @notice Returns the count of currently active validators
    /// @return The number of currently active validators. Uint256 type.
    function getValidatorsNum()
        external
        view
        returns(uint256)
    {
        return currentValidators.length;
    }

    /// @notice Checks whether the address is an added validator. Returns true
    /// also for validators who are added but not active yet, but returns false for
    /// still active but pending-to-be-removed validators.
    /// @return True or false, depending on the check
    function isAddedValidator(address _somebody)
        external
        view
        returns (bool)
    {
        return addressStatus[_somebody].isValidator;
    }

    /// @notice Checks whether the address is a currently active validator
    /// @return True or false, depending on the check
    function isActiveValidator(address _somebody)
        external
        view
        returns (bool)
    {
        return _isActiveValidator(_somebody);
    }

    /// @notice Checks whether the address is a pending-to-be-added or a pending-to-be-removed validator.
    /// @return True or false, depending on the check
    function isPending(address _somebody)
        external
        view
        returns (bool)
    {
        return addressStatus[_somebody].isPending;
    }

    /// @dev Sets `finalized` to false and initiates a change
    /// with the Relay contract
    function _triggerChange()
        private
        whenFinalized
    {
        finalized = false;
        _initiateChange();
    }

    /// @dev Calls Relay callback to emit
    /// the `InitiateChange` event for the
    /// Parity client
    function _initiateChange()
        private
    {
        relaySet.callbackInitiateChange(blockhash(block.number - 1), pendingValidators);
    }

    /// @dev Checks whether a certain address can be added. Only checks
    /// if the address is valid and whether the validator is already active.
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

    /// @dev Checks whether validator is active based on its status flags.
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

    /// @dev Adds validator to pending, sets status flags and triggers change
    function _addValidator(address _validator)
        private
    {
        addressStatus[_validator].isValidator = true;
        addressStatus[_validator].isPending = true;
        addressStatus[_validator].index = pendingValidators.length;
        
        pendingValidators.push(_validator);
        _triggerChange();
    }

    /// @dev Checks whether a certain validator can be removed. Only checks
    /// pending list size and whether the validator is active.
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

    /// @dev Removes validator from pending, sets status flags and triggers change.
    /// Replaces the removed element with the last element. Must not be called with
    /// an empty pending validators list
    function _removeValidator(address _validator)
        private
    {
        uint256 removedIndex = addressStatus[_validator].index;
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
