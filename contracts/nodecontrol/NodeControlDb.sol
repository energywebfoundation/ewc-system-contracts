pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "./NodeControlInterface.sol";


contract NodeControlDb {
    mapping (address => NodeControlInterface.ValidatorState) public currentState;

    address public nodeControlLogic;
    address public owner;

    modifier onlyLogic {
        require(msg.sender == nodeControlLogic, "Error: onlyLogic Db");
        _;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Error: onlyOwner Db");
        _;
    }

    ///@notice constructor that sets the owner of the database
    constructor() public {
        owner = msg.sender;
    }

    ///@notice changes the logic contract (can only be called by the owner of the database)
    ///@param _newLogic the new logic that is allowed to write data
    function changeLogicContract(address _newLogic) public onlyOwner {
        require(_newLogic != address(0x0), "Error: newLogic is not allowed to be 0x0");
        nodeControlLogic = _newLogic;
    }

    ///@notice sets the state for a validator
    ///@param _targetValidator The validator whos state needs to be updated
    ///@param _dockerSha The sha of the dockerfile
    ///@param _dockerName The name of the dockerfile
    ///@param _chainSpecSha The sha of the chainSpecFile
    ///@param _chainSpecUrl The url where the chainSpecFile can be found
    ///@param _isSigning Indicates if the validator shall sign blocks
    function setState (
        address _targetValidator, 
        bytes memory _dockerSha, 
        string memory _dockerName, 
        bytes memory _chainSpecSha, 
        string memory _chainSpecUrl, 
        bool _isSigning) public onlyLogic 
    {
        currentState[_targetValidator].dockerSha = _dockerSha;
        currentState[_targetValidator].dockerName = _dockerName;
        currentState[_targetValidator].chainSpecSha = _chainSpecSha;
        currentState[_targetValidator].chainSpecUrl = _chainSpecUrl;
        currentState[_targetValidator].isSigning = _isSigning;
        currentState[_targetValidator].updateIntroduced = now;
    }

    ///@notice sets the confirm
    ///@param _targetValidator the validator that confirms the update
    function setUpdateConfirmed(address _targetValidator) public onlyLogic {
        currentState[_targetValidator].updateConfirmed = now;
    }

    ///@notice sets a new owner
    ///@param _newOwner the new owner
    function setOwner(address _newOwner) public onlyOwner {
        require(_newOwner != address(0x0), "Error: Owner is not allowed to be 0x0");
        owner = _newOwner;
    }

    ///@notice gets the state for a validator
    ///@param _targetValidator The validator whos state you want
    function getState(address _targetValidator) public view onlyLogic 
    returns (NodeControlInterface.ValidatorState memory) 
    {
        return currentState[_targetValidator];
    }

    ///@notice gets the dockerSha
    ///@param _targetValidator The validator whos dockerSha you want
    function getDockerSha(address _targetValidator) public view onlyLogic returns(bytes memory) {
        return currentState[_targetValidator].dockerSha;
    }

    ///@notice gets the dockerName
    ///@param _targetValidator The validator whos dockerName you want
    function getDockerName(address _targetValidator) public view onlyLogic returns(string memory) {
        return currentState[_targetValidator].dockerName;
    }

    ///@notice gets the chainSpecSha
    ///@param _targetValidator The validator whos chainSpecSha you want
    function getChainSpecSha(address _targetValidator) public view onlyLogic returns(bytes memory) {
        return currentState[_targetValidator].chainSpecSha;
    }

    ///@notice gets the chainSpecUrl
    ///@param _targetValidator The validator whos chainSpecUrl you want
    function getChainSpecUrl(address _targetValidator) public view onlyLogic returns(string memory) {
        return currentState[_targetValidator].chainSpecUrl;
    }

    ///@notice gets the isSigning
    ///@param _targetValidator The validator you want to know of if they are signing
    function getIsSigning(address _targetValidator) public view onlyLogic returns(bool) {
        return currentState[_targetValidator].isSigning;
    }
}