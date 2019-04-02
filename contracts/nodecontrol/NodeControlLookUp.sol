pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;


///@notice Serves as a lookup table. Currently used for the NodeControlContract
contract NodeControlLookUp {
    
    address public nodeControlContract;
    address public owner;

    modifier onlyOwner {
        require(msg.sender == owner, "Error: You are not the owner");
        _;
    }

    constructor() public {
        owner = msg.sender;
    }

    ///@notice Sets a address at the given index
    ///@param _nodeControlAddress The address that is written at the index
    function changeAddress(address _nodeControlAddress) external onlyOwner {
        nodeControlContract = _nodeControlAddress;
    }
}
