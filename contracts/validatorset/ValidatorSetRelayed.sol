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
        /// Is this address an added validator
        bool isAddedValidator;
        /// Is this validator pending to be added or removed
        bool isPendingToBeFinalized;
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

    event NewRelay(address indexed relay);
    event ChangeFinalized(address[] validatorSet);
    event ReportedMalicious(address indexed reporter, address indexed reported, uint indexed blocknum);
    event ReportedBenign(address indexed reporter, address indexed reported, uint indexed blocknum);

    modifier onlyActiveValidator(address _somebody) {
        require(isActiveValidator(_somebody), "Address is not an active validator");
        _;
    }

    modifier onlyRelay() {
        require(msg.sender == address(relaySet), "Caller is not the Relay contract");
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
        require(_blockNumber < block.number, "Block number is not valid");
        _;
    }

    constructor(address _owner, address _relaySet, address[] memory _initial)
        public
    {
        require(_relaySet != address(0), "Relay contract address cannot be 0x0");
        _transferOwnership(_owner);
        _setRelay(_relaySet);

        for (uint i = 0; i < _initial.length; i++) {
            require(_initial[i] != address(0), "Validator address cannot be 0x0");
            
            addressStatus[_initial[i]].isAddedValidator = true;
            addressStatus[_initial[i]].isPendingToBeFinalized = false;
            addressStatus[_initial[i]].index = i;
        }
        pendingValidators = _initial;
        currentValidators = pendingValidators;
        // the initial validator set is finalized by default
        finalized = true;
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
        require(
            _relaySet != address(relaySet),
            "New relay contract address cannot be the same as the current one"
        );
        _setRelay(_relaySet);
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
            if (vstatus.isPendingToBeFinalized) {
                vstatus.isPendingToBeFinalized = false;
            }
        }

        if (toBeRemoved != address(0)) {
            addressStatus[toBeRemoved].isPendingToBeFinalized = false;
            addressStatus[toBeRemoved].index = 0;
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
        whenFinalized
    {
        require(_validator != address(0), "Validator address cannot be 0x0");
        require(!isActiveValidator(_validator), "This validator is already active");
        _addValidator(_validator);
    }

    /// @notice Removes a validator from the pending list and initiates a change.
    /// Can only be called if the validator is in the active list, or
    /// there are no changes to be finalized. Until the validator removal is finalized, it is still
    /// active.
    /// @dev First removes the validator from `pendingValidators`, then calls the `callbackInitiateChange`
    /// of the Relay contract which emits the `InitiateChange` event
    /// @param _validator The address to be removed
    function removeValidator(address _validator)
        external
        onlyOwner
        whenFinalized
        onlyActiveValidator(_validator)
    {
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

    /// @notice Checks whether the address is an added validator.
    /// Not the same as `isActiveValidator`! Returns true for 
    /// validators who are added but not active yet and for validators 
    /// who are active and not pending-to-be-removed. Returns false
    /// for still active but pending-to-be-removed validators and
    /// non-validators.
    /// @return True or false, depending on the check
    function isAddedValidator(address _somebody)
        external
        view
        returns (bool)
    {
        return addressStatus[_somebody].isAddedValidator;
    }

    /// @notice Checks whether the address is a pending-to-be-added or a pending-to-be-removed validator.
    /// @return True or false, depending on the check
    function isPending(address _somebody)
        external
        view
        returns (bool)
    {
        return addressStatus[_somebody].isPendingToBeFinalized;
    }

    /// @notice Checks whether the address is a currently active (sealing) validator
    /// @dev Checks whether validator is active based on its status flags.
    /// @return True or false, depending on the check
    function isActiveValidator(address _somebody)
        public
        view
        returns(bool)
    {
        bool isV = addressStatus[_somebody].isAddedValidator;
        bool isP = addressStatus[_somebody].isPendingToBeFinalized;

        // already in the active set, or in the active set but about to be removed
        return ((isV && !isP) || (!isV && isP));
    }

    /// @dev Sets `finalized` to false and initiates a change
    /// with the Relay contract
    function _triggerChange()
        internal
    {
        finalized = false;
        require(
            relaySet.callbackInitiateChange(blockhash(block.number - 1), pendingValidators),
            "Relay contract InitiateChange callback failed"
        );
    }

    /// @dev Adds validator to pending, sets status flags and triggers change
    function _addValidator(address _validator)
        internal
    {
        addressStatus[_validator].isAddedValidator = true;
        addressStatus[_validator].isPendingToBeFinalized = true;
        addressStatus[_validator].index = pendingValidators.length;
        
        pendingValidators.push(_validator);
        _triggerChange();
    }

    /// @dev Removes validator from pending, sets status flags and triggers change.
    /// Replaces the removed element with the last element. Must not be called with
    /// an empty pending validators list
    function _removeValidator(address _validator)
        internal
    {
        require(pendingValidators.length != 0, "There are no validators to remove from");

        uint256 removedIndex = addressStatus[_validator].index;
        uint256 lastIndex = pendingValidators.length - 1;
        address lastValidator = pendingValidators[lastIndex];
        // Override the removed validator with the last one.
        pendingValidators[removedIndex] = lastValidator;
        addressStatus[lastValidator].index = removedIndex;
        pendingValidators.length--;

        addressStatus[_validator].isAddedValidator = false;
        addressStatus[_validator].isPendingToBeFinalized = true;

        toBeRemoved = _validator;

        _triggerChange();
    }

    /// @dev Sets the relay address and emits the `NewRelay` event
    function _setRelay(address _relaySet)
        private
    {
        relaySet = IValidatorSetRelay(_relaySet);
        emit NewRelay(_relaySet);
    }
}
