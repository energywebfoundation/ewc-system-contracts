pragma solidity ^0.5.4;
pragma experimental ABIEncoderV2;

import "../misc/Ownable.sol";


///@notice Serves as a lookup table. Currently used for the NodeControlContract
contract NodeControlLookUp is Ownable {
    
    address public nodeControlContract;

    constructor(address _nodeControlAddress, address _owner)
        public 
    {
        nodeControlContract = _nodeControlAddress;
        _transferOwnership(_owner);
    }

    ///@notice Sets a address at the given index
    ///@param _nodeControlAddress The address that is written at the index
    function changeAddress(address _nodeControlAddress) 
        external 
        onlyOwner 
    {
        nodeControlContract = _nodeControlAddress;
    }
}
