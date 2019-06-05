pragma solidity 0.5.8;


/// @title Reporting validator set interface
/// @dev This interface is used by Aura PoA validator contracts to manage active validators and
/// send reports on misbehaving validators
interface IValidatorSetRelayed {

    /// @notice Called when an initiated change reaches finality and is activated
    /// It is also called when the contract is first enabled for consensus. In this case,
    /// the "change" finalized is the activation of the initial set
    /// @dev Should only be valid when msg.sender == SYSTEM (EIP96, 2**160 - 2)
    function finalizeChange()
        external;

    /// @notice Reports benign misbehavior of a validator in the current validator set (e.g. validator offline)
    /// @param reporter Address of the reporter
    /// @param validator Address of the validator to report
    /// @param blockNumber The blocknumber to report on
    function reportBenign(
        address reporter,
        address validator,
        uint256 blockNumber
    )
        external;

    /// @notice Reports malicious misbehavior of validator of the current validator set
    /// and provides proof of that misbehavor, which varies by engine (e.g. double vote)
    /// @param reporter Address of the reporter
    /// @param validator Address of the validator to report
    /// @param blockNumber The blocknumber to report on
    /// @param proof Proof attached
    function reportMalicious(
        address reporter,
        address validator,
        uint256 blockNumber,
        bytes calldata proof
    )
        external;

    /// @notice Get current validator set (last enacted or initial if no changes ever made)
    /// @return List of addresses of the currently active validators
    function getValidators()
        external
        view
        returns (address[] memory);
}
