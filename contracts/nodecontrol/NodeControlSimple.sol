pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "./NodeControlInterface.sol";
import "./NodeControlDb.sol";


contract NodeControlSimple is NodeControlInterface {

    NodeControlDb public nodeControlDb;
    address public owner;

    modifier onlyOwner {
        require(msg.sender == owner, "Error: Not owner");
        _;
    }

    ///@notice Constructor
    ///@dev Change 'msg.sender' to an actual admin address since this contract will be deployed via chainspec
    ///@param _nodeControlDb The db contract that should be used
    constructor(NodeControlDb _nodeControlDb) public {
        owner = msg.sender;
        nodeControlDb = _nodeControlDb;
    }

    ///@notice Lets the validator confirm the update
    function confirmUpdate() external {
        require(nodeControlDb.getDockerSha(msg.sender).length != 0, "Error: You are not a validator!");
        nodeControlDb.setUpdateConfirmed(msg.sender);
    }

    ///@notice Returns the expected state of a validator
    ///@param _targetValidator The validator whos state you want
    ///@return The state of the validator
    function retrieveExpectedState(address _targetValidator) external view returns (ValidatorState memory) {
        ValidatorState memory vs = nodeControlDb.getState(_targetValidator);
        return vs;
    }

    ///@notice View method to check if an update was confirmed by the validator
    ///@param _targetValidator The validator that is supposed to be checked
    function isUpdateConfirmed(address _targetValidator) external view returns(bool) {
        return nodeControlDb.isUpdateConfirmed(_targetValidator);
    }

    ///@notice sets the state for a validator and emits update event
    ///@param _targetValidator The validator whos state needs to be updated
    ///@param _dockerSha The sha of the dockerfile
    ///@param _dockerName The name of the dockerfile
    ///@param _chainSpecSha The sha of the chainSpecFile
    ///@param _chainSpecUrl The url where the chainSpecFile can be found
    ///@param _isSigning Indicates if the validator shall sign blocks
    function updateValidator(
        address _targetValidator, 
        bytes memory _dockerSha, 
        string memory _dockerName, 
        bytes memory _chainSpecSha,
        string memory _chainSpecUrl,
        bool _isSigning
    ) 
        public 
        onlyOwner 
    {
        require(
            !(sha256(bytes(nodeControlDb.getDockerSha(_targetValidator))) == 
            sha256(bytes(_dockerSha)) && sha256(bytes(nodeControlDb.getDockerName(_targetValidator))) == 
            sha256(bytes(_dockerName)) && sha256(bytes(nodeControlDb.getChainSpecSha(_targetValidator))) == 
            sha256(bytes(_chainSpecSha)) && sha256(bytes(nodeControlDb.getChainSpecUrl(_targetValidator))) == 
            sha256(bytes(_chainSpecUrl)) && nodeControlDb.getIsSigning(_targetValidator) == _isSigning), 
            "Error: No changes in the passed State");
        
        nodeControlDb.setState(
            _targetValidator, 
            _dockerSha, 
            _dockerName, 
            _chainSpecSha, 
            _chainSpecUrl, 
            _isSigning);

        emit UpdateAvailable(_targetValidator);
    }

    ///@notice Changes the owner of the NodeControlContract
    ///@param _newOwner The new owner of the contract. Can not be null.
    function setOwner(address _newOwner) public onlyOwner {
        require(_newOwner != address(0x0), "Error: New owner can not be null");
        owner = _newOwner;
    }
}
