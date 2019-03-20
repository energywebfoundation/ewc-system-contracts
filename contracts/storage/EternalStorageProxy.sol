// Adapted from https://github.com/
// poanetwork/poa-network-consensus-contracts/blob/master/contracts/eternal-storage/EternalStorageProxy.sol
pragma solidity ^0.5.0;

import "./EternalStorage.sol";
import "../interfaces/IEternalStorageProxy.sol";
import "../misc/Ownable.sol";


/// @title EternalStorageProxy
/// @dev This proxy holds the storage contract and delegates every call to the current implementation set.
/// Besides, it allows to upgrade the token's behaviour towards further implementations, and provides
/// authorization control functionalities
contract EternalStorageProxy is EternalStorage, IEternalStorageProxy, Ownable {

    /// @dev This event will be emitted every time the implementation gets upgraded
    /// @param version representing the version number of the upgraded implementation
    /// @param implementation representing the address of the upgraded implementation
    event Upgraded(uint256 version, address indexed implementation);

    constructor(address _implementationAddress)
        public
    {
        require(_implementationAddress != address(0), "Implementation address is 0x0.");
        
        _implementation = _implementationAddress;
    }

    /// @dev Fallback function allowing to perform a delegatecall to the given implementation.
    /// This function will return whatever the implementation call returns
    // solhint-disable-next-line no-complex-fallback
    function()
        external
    {
        require(_implementation != address(0), "Implementation address cannot be 0x0.");
        address _impl = _implementation;

        // solhint-disable-next-line no-inline-assembly
        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // Solidity scratch pad at memory position 0
            calldatacopy(0, 0, calldatasize)

            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet
            let result := delegatecall(gas, _impl, 0, calldatasize, 0, 0)

            // Copy the returned data
            returndatacopy(0, 0, returndatasize)

            switch result
            // delegatecall returns 0 on error
            case 0 { revert(0, returndatasize) }
            default { return(0, returndatasize) }
        }
    }

    /// @dev Tells the address of the current implementation
    /// @return address of the current implementation
    function implementation()
        public
        view
        returns(address)
    {
        return _implementation;
    }

    /// @dev Allows ProxyStorage contract to upgrade the current implementation.
    /// @param newImplementation representing the address of the new implementation to be set.
    function upgradeTo(address newImplementation)
        public
        onlyOwner
        returns(bool)
    {
        if (newImplementation == address(0)) {
            return false;
        }

        if (_implementation == newImplementation) {
            return false;
        }

        uint256 newVersion = _version + 1;
        if (newVersion <= _version) {
            return false;
        }

        _version = newVersion;
        _implementation = newImplementation;

        emit Upgraded(newVersion, newImplementation);
        return true;
    }

    /// @dev Tells the version number of the current implementation
    /// @return uint representing the number of the current version
    function version()
        public
        view
        returns(uint256)
    {
        return _version;
    }
}
