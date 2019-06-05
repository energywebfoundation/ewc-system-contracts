pragma solidity 0.5.8;

import "../misc/Ownable.sol";
import "../interfaces/IValidatorSetRelay.sol";
import "../interfaces/IValidatorSet.sol";
import "../interfaces/IValidatorSetRelayed.sol";


/// @title Validator Set Relay contract
/// @notice This owned contract is present in the chainspec file. The Relay contract
/// relays the function calls to a logic contract called Relayed for upgradeability
contract ValidatorSetRelay is IValidatorSet, IValidatorSetRelay, Ownable {

    /// System address, used by the block sealer
    /// Not constant cause it is changed for testing
    address public systemAddress = 0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE;
    
    /// Address of the inner validator set contract
    IValidatorSetRelayed public relayedSet;

    /// Emitted in case a new Relayed contract is set
    event NewRelayed(address indexed old, address indexed current);

    modifier nonDefaultAddress(address _address) {
        require(_address != address(0), "Address cannot be 0x0");
        _;
    }

    modifier onlySystem() {
        require(msg.sender == systemAddress, "Sender is not system");
        _;
    }

    modifier onlyRelayed() {
        require(msg.sender == address(relayedSet), "Sender is not the Relayed contract");
        _;
    }

    constructor(address _owner, address _relayedSet)
        public
    {
        _transferOwnership(_owner);
        _setRelayed(_relayedSet);
    }

    /// @notice This function is used by the Relayed logic contract
    /// to iniate a change in the active validator set
    /// @dev emits `InitiateChange` which is listened by the Parity client
    /// @param _parentHash Blockhash of the parent block
    /// @param _newSet List of addresses of the desired active validator set
    /// @return True if event was emitted
    function callbackInitiateChange(bytes32 _parentHash, address[] calldata _newSet)
        external
        onlyRelayed
        returns (bool)
    {
        emit InitiateChange(_parentHash, _newSet);
        return true;
    }

    /// @notice Finalizes changes of the active validator set.
    /// Called by SYSTEM
    function finalizeChange()
        external
        onlySystem
    {
        relayedSet.finalizeChange();
    }

    /// @notice This function is used by validators to submit Benign reports
    /// on other validators. Can only be called by the validator who submits
    /// the report
    /// @dev emits `ReportedBenign` event in the Relayed logic contract
    /// @param _validator The validator to report
    /// @param _blockNumber The blocknumber to report on
    function reportBenign(address _validator, uint256 _blockNumber)
        external
    {
        relayedSet.reportBenign(
            msg.sender,
            _validator,
            _blockNumber
        );
    }

    /// @notice This function is used by validators to submit Malicious reports
    /// on other validators. Can only be called by the validator who submits
    /// the report
    /// @dev emits `ReportedMalicious` event in the Relayed logic contract
    /// @param _validator The validator to report
    /// @param _blockNumber The blocknumber to report on
    /// @param _proof Proof to submit. Right now it is not used for anything
    function reportMalicious(address _validator, uint256 _blockNumber, bytes calldata _proof)
        external
    {
        relayedSet.reportMalicious(
            msg.sender,
            _validator,
            _blockNumber,
            _proof
        );
    }

    /// @notice Sets the Relayed logic contract address. Only callable by the owner.
    /// The address is assumed to belong to a contract that implements the
    /// `IValidatorSetRelayed` interface
    /// @param _relayedSet The contract address
    function setRelayed(address _relayedSet)
        external
        onlyOwner
    {
        _setRelayed(_relayedSet);
    }

    /// @notice Returns the currently active validators
    /// @return The list of addresses of currently active validators
    function getValidators()
        external
        view
        returns (address[] memory)
    {
        return relayedSet.getValidators();
    }

    /// @dev The actual logic of setting the Relayed contract
    function _setRelayed(address _relayedSet)
        private
        nonDefaultAddress(_relayedSet)
    {
        require(
            _relayedSet != address(relayedSet),
            "New relayed contract address cannot be the same as the current one"
        );
        address oldRelayed = address(relayedSet);
        relayedSet = IValidatorSetRelayed(_relayedSet);
        emit NewRelayed(oldRelayed, _relayedSet);
    }
}
