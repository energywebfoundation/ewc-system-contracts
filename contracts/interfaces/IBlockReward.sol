pragma solidity 0.5.8;


/// @title BlockReward contract interface
/// @dev This interface must be implemented by a system contract that implements the
/// reward logic
interface IBlockReward {

    /// @notice Produces rewards for the given benefactors,
    /// with corresponding reward codes
    /// @dev Should only be callable by `SYSTEM_ADDRESS`
    /// @param benefactors The list of addresses who can be rewarded
    /// @param kind The corresponding list of benefactor types
    /// @return The list of addresses to be rewarded and the corresponding list of reward amounts
    function reward(address[] calldata benefactors, uint16[] calldata kind)
        external
        returns (address[] memory, uint256[] memory);
}
