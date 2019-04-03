pragma solidity ^0.5.4;
pragma experimental ABIEncoderV2;


///@notice Serves as a lookup table. Currently used for the NodeControlContract
contract NodeControlLookUp {
    
    address public nodeControlContract;
    address public owner;

    modifier onlyOwner {
        require(msg.sender == owner, "Error: You are not the owner");
        _;
    }

    constructor(address _owner) 
        public 
    {
        owner = _owner;
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
