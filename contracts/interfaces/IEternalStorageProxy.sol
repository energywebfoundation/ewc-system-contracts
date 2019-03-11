pragma solidity ^0.5.0;


/// @title EternalStorageProxy contract interface
/// @dev This interface must be implemented by a storage proxy contract who allows the
/// upgrade of its implementation.
interface IEternalStorageProxy {
    function upgradeTo(address) external returns(bool);
}
