pragma solidity ^0.5.0;

contract NodeControlProxy {

    ////@dev Logic Layout
    address public nodeControlDb;
    address public owner;

    ///@dev Proxy Layout
    address public nodeControlLogic;

    modifier onlyOwner { require(msg.sender == owner, "Error: onlyOwner Proxy"); _; }

    ///@notice fallback function that redirects each call to the logic contract
    function() external {
        (bool result, ) = nodeControlLogic.delegatecall(msg.data);
        require(result, "Error: executing delegatecall");
    }

    ///@notice constructor to set logic contract and the owner of proxy
    ///@param _nodeControlLogic the logic contract that should receive all calls
    constructor(address _nodeControlLogic) public {
        nodeControlLogic = _nodeControlLogic;
        owner = msg.sender;
    }

    ///@notice sets the logic contract
    ///@param _nodeControlLogic the new logic contract
    function setNodeControlLogic(address _nodeControlLogic) public onlyOwner {
        nodeControlLogic = _nodeControlLogic;
    }

    ///@notice sets a new owner
    ///@param _newOwner the new owner
    function setOwner(address _newOwner) public onlyOwner {
        require(_newOwner != address(0x0), "Error: Owner is not allowed to be 0x0");
        owner = _newOwner;
    }
}