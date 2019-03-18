pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;


///@notice Serves as a lookup table. Currently used for the NodeControlContract
contract NodeControlLookUp {
    ///@notice 0 reserved for NodeControlLogic
    mapping (uint => address) public list;
    address public owner;

    modifier onlyOwner {
        require(msg.sender == owner, "Error: You are not the owner");
        _;
    }

    constructor() public {
        owner = msg.sender;
    }

    ///@notice sets a address at the given index
    ///@param _index the index at which the address should be set
    ///@param _address the address that is written at the index
    function addAddress(uint _index, address _address) external onlyOwner {
        list[_index] = _address;
    }
}