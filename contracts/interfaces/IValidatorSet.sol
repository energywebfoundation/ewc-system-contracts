pragma solidity 0.5.8;


/// @title Reporting validator set interface
/// @dev This interface is used by Aura PoA validator contracts to manage active validators and
/// send reports on misbehaving validators
interface IValidatorSet {

    /// @notice Issue this log event to signal a desired change in validator set.
    /// This will not lead to a change in active validator set until
    /// finalizeChange is called
    /// @dev Only the last log event of any block can take effect.
    /// If a signal is issued while another is being finalized it may never
    /// take effect
    /// @param _parentHash The parent block hash. Otherwise the signal will not be recognized
    /// @param _newSet List of addresses of the desired new validator set
    event InitiateChange(bytes32 indexed _parentHash, address[] _newSet);

    /// @notice Called when an initiated change reaches finality and is activated.
    /// It is also called when the contract is first enabled for consensus. In this case,
    /// the "change" finalized is the activation of the initial set
    /// @dev Only valid when msg.sender == SYSTEM (EIP96, 2**160 - 2)
    function finalizeChange()
        external;

    /// @notice Reports benign misbehavior of a validator in the current validator set (e.g. validator offline)
    /// @param validator Address of the validator to report
    /// @param blockNumber The blocknumber to report on
    function reportBenign(address validator, uint256 blockNumber)
        external;

    /// @notice Reports malicious misbehavior of validator of the current validator set
    /// and provides proof of that misbehavor, which varies by engine (e.g. double vote).
    /// @param validator Address of the validator to report.
    /// @param blockNumber The blocknumber to report on.
    /// @param proof Proof attached.
    function reportMalicious(address validator, uint256 blockNumber, bytes calldata proof)
        external;

    /// @notice Get current validator set (last enacted or initial if no changes ever made).
    /// @return List of addresses of the currently active validators.
    function getValidators()
        external
        view
        returns (address[] memory);
}
