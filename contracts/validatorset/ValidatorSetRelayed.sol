pragma solidity 0.5.8;

import "../interfaces/IValidatorSetRelay.sol";
import "../interfaces/IValidatorSetRelayed.sol";
import "../misc/Ownable.sol";


/// @title Relayed Validator Set contract
/// @notice This owned contract holds the actual validator-set logic. The Relay contract
/// relays the function calls to this contract and they communicate through well defined interfaces.
contract ValidatorSetRelayed is IValidatorSetRelayed, Ownable {

    /// Enum for the 4 possible state of validators
    enum ValidatorState {
        /// 1. Non-validator: the default enum option
        NonValidator,
        /// 2. Finalized-validator: validators in the currentValidators list who
        /// are not pending to be removed either. They are active validators,
        /// so they seal blocks
        Finalized,
        /// 3. Pending-to-be-added-validator: about to be added to the
        /// currentValidators list, but not partake in sealing yet, thus not active
        PendingToBeAdded,
        /// 4. Pending-to-be-removed-validators: They are
        /// about to be removed, but still in the currentValidators
        /// list sealing blocks, thus active. They can still be
        /// reported or submit reports
        PendingToBeRemoved
    }

    /// Holds address validator status information
    struct AddressStatus {
        ValidatorState state;
        /// Index in currentValidators list. This index
        /// is only relevant if the validator is active.
        /// Should be ignored otherwise
        uint256 index;
    }

    /// Was the last validator change finalized. Implies currentValidators == migrationValidators
    bool public finalized;

    /// Current list of addresses entitled to participate in the consensus. Active validators
    address[] private currentValidators;
    /// Validators in the migration set. This contains the new list of validators
    address[] private migrationValidators;
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
        require(_initial.length >= 1, "There must be at least 1 validator initially");
        _transferOwnership(_owner);
        _setRelay(_relaySet);

        for (uint i = 0; i < _initial.length; i++) {
            require(_initial[i] != address(0), "Validator address cannot be 0x0");
            
            addressStatus[_initial[i]].state = ValidatorState.Finalized;
            addressStatus[_initial[i]].index = i;
        }
        migrationValidators = _initial;
        currentValidators = migrationValidators;
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

    // solhint-disable no-unused-vars
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
    // solhint-enable no-unused-vars

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

        // Finalizing the addition or removal of a validator
        if (toBeRemoved == address(0)) {
            // Case adding a a validator
            // The new added validator is always the last of `migrationValidators` array
            AddressStatus storage vstatus = addressStatus[migrationValidators[migrationValidators.length - 1]];
            vstatus.state = ValidatorState.Finalized;
            vstatus.index = migrationValidators.length - 1;
        } else {
            // Case removing a validator
            // The to-be-removed validator is explicitly assigned to `toBeRemoved` beforehand
            addressStatus[toBeRemoved].state = ValidatorState.NonValidator;
            addressStatus[toBeRemoved].index = 0;
            toBeRemoved = address(0);
        }

        currentValidators = migrationValidators;
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

    /// @notice Removes a validator from the pending list and initiates a
    /// change. Can only be called if the validator is in the current list, or
    /// there are no changes to be finalized. Until the validator removal
    /// is finalized, it is still active
    /// @dev First removes the validator from `migrationValidators`, then
    /// calls the `callbackInitiateChange` of the Relay contract which
    /// emits the `InitiateChange` event
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

    /// @notice Returns the migration validator set. If there are
    /// no changes in progress, the migration list is the same
    /// as the current list. If there are changes to the set, the
    /// migration validators list is the new active validators
    /// list that awaits finalization
    /// @return The list of addresses of the migration validators
    function getMigrationValidators()
        external
        view
        returns (address[] memory)
    {
        return migrationValidators;
    }

    /// @notice Returns the union of current set and migration set.
    /// Useful for tracking the statuses of all affected validators
    /// in case of a change
    /// @dev Returns the longer of the `current` and `migration` arrays
    /// @return The list of addresses
    function getUnion()
        external
        view
        returns (address[] memory)
    {
        if (migrationValidators.length > currentValidators.length) {
            return migrationValidators;
        }
        return currentValidators;
    }

    /// @notice Returns the count of currently active validators
    /// @return The number of currently active validators
    function getValidatorsNum()
        external
        view
        returns(uint256)
    {
        return currentValidators.length;
    }

    /// @notice Checks whether the address is pending to
    /// be added to the active validators list
    /// @param _somebody The address to be queried
    /// @return True if address is pending to be added, false otherwise
    function isPendingToBeAdded(address _somebody)
        external
        view
        returns (bool)
    {
        return (
            addressStatus[_somebody].state == ValidatorState.PendingToBeAdded
        );
    }

    /// @notice Checks whether the address is pending to
    /// be removed from the active validators list
    /// @param _somebody The address to be queried
    /// @return True if address is pending to be removed, false otherwise
    function isPendingToBeRemoved(address _somebody)
        external
        view
        returns (bool)
    {
        return (
            addressStatus[_somebody].state == ValidatorState.PendingToBeRemoved
        );
    }

    /// @notice Checks whether the address is a pending-to-be-added
    /// or a pending-to-be-removed validator
    /// @param _somebody The address to check
    /// @return True if address is pending, false otherwise
    function isPending(address _somebody)
        external
        view
        returns (bool)
    {
        return (
            addressStatus[_somebody].state == ValidatorState.PendingToBeAdded
            || addressStatus[_somebody].state == ValidatorState.PendingToBeRemoved
        );
    }

    /// @notice Checks whether the address is a currently active (sealing) validator.
    /// Note that it is not the same as `isFinalizedValidator`, because an unfinalized,
    /// pending-to-be-removed validator is still an active one
    /// @param _somebody The address to check
    /// @return True if address is an active validator, false otherwise
    function isActiveValidator(address _somebody)
        public
        view
        returns(bool)
    {
        return (
            addressStatus[_somebody].state == ValidatorState.Finalized
            || addressStatus[_somebody].state == ValidatorState.PendingToBeRemoved
        );
    }

    /// @notice Checks whether the address is a currently active finalized validator.
    /// Note that it is not the same as `isActiveValidator`. This returns false if the
    /// validator is still active but pending to be removed
    /// @param _somebody The address to be queried
    /// @return True if adress is a finalized validator, false otherwise
    function isFinalizedValidator(address _somebody)
        public
        view
        returns(bool)
    {
        return (
            addressStatus[_somebody].state == ValidatorState.Finalized
        );
    }

    /// @dev Sets `finalized` to false and initiates a change
    /// with the Relay contract
    function _triggerChange()
        internal
    {
        finalized = false;
        require(
            relaySet.callbackInitiateChange(blockhash(block.number - 1), migrationValidators),
            "Relay contract InitiateChange callback failed"
        );
    }

    /// @dev Adds validator to the migration set, sets status flags and triggers change
    /// @param _validator The address to add
    function _addValidator(address _validator)
        internal
    {
        addressStatus[_validator].state = ValidatorState.PendingToBeAdded;

        migrationValidators.push(_validator);
        _triggerChange();
    }

    /// @dev Removes validator from migration, sets status flags and triggers change.
    /// Replaces the removed element with the last element. There must be at least 1
    /// remaining validator at all times
    /// @param _validator The address to remove
    function _removeValidator(address _validator)
        internal
    {
        require(migrationValidators.length > 1, "There must be at least 1 validator left");

        uint256 removedIndex = addressStatus[_validator].index;
        uint256 lastIndex = migrationValidators.length - 1;
        address lastValidator = migrationValidators[lastIndex];
        // Override the removed validator with the last one.
        migrationValidators[removedIndex] = lastValidator;
        addressStatus[lastValidator].index = removedIndex;
        migrationValidators.length--;

        addressStatus[_validator].state = ValidatorState.PendingToBeRemoved;

        toBeRemoved = _validator;

        _triggerChange();
    }

    /// @dev Sets the relay address and emits the `NewRelay` event
    /// @param _relaySet The address of the new relay contract
    function _setRelay(address _relaySet)
        private
    {
        relaySet = IValidatorSetRelay(_relaySet);
        emit NewRelay(_relaySet);
    }
}
