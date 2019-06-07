pragma solidity 0.5.8;

import "../misc/Ownable.sol";


/// @notice Serves as a lookup table. Currently used for the NodeControlContract
contract NodeControlLookUp is Ownable {

    address public nodeControlContract;

    event NewNodeControlAddress(address indexed _newNodeControlAddress);

    constructor(address _nodeControlAddress, address _owner)
        public 
    {
        _transferOwnership(_owner);
        nodeControlContract = _nodeControlAddress;
        emit NewNodeControlAddress(_nodeControlAddress);
    }

    /// @notice Sets a address at the given index
    /// @param _nodeControlAddress The address that is written at the index
    function changeAddress(address _nodeControlAddress) 
        external 
        onlyOwner 
    {
        nodeControlContract = _nodeControlAddress;
        emit NewNodeControlAddress(_nodeControlAddress);
    }
}
