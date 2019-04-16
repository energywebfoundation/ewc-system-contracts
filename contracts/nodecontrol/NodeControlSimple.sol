pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import "../interfaces/INodeControl.sol";
import "./NodeControlDb.sol";
import "../misc/Ownable.sol";


contract NodeControlSimple is INodeControl, Ownable {

    NodeControlDb public nodeControlDb;

    ///@notice Constructor
    ///@param _nodeControlDb The db contract that should be used
    constructor(NodeControlDb _nodeControlDb, address _owner)
        public 
    {
        nodeControlDb = _nodeControlDb;
        _transferOwnership(_owner);
    }

    ///@notice Lets the validator confirm the update
    function confirmUpdate() 
        external 
    {
        require(nodeControlDb.getDockerSha(msg.sender).length != 0, "Error: You are not a validator!");
        nodeControlDb.setUpdateConfirmed(msg.sender);
    }

    ///@notice Returns the expected state of a validator
    ///@param _targetValidator The validator whos state you want
    ///@return The state of the validator
    function retrieveExpectedState(address _targetValidator) 
        external 
        view 
        returns (ValidatorState memory) 
    {
        ValidatorState memory vs = nodeControlDb.getState(_targetValidator);
        return vs;
    }

    ///@notice View method to check if an update was confirmed by the validator
    ///@param _targetValidator The validator that is supposed to be checked
    function isUpdateConfirmed(address _targetValidator) 
        external 
        view 
        returns(bool) 
    {
        return nodeControlDb.isUpdateConfirmed(_targetValidator);
    }

    ///@notice Sets the state for a validator and emits update event
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
            "Error: No changes in the passed State"
        );
        
        nodeControlDb.setState(
            _targetValidator, 
            _dockerSha, 
            _dockerName, 
            _chainSpecSha, 
            _chainSpecUrl, 
            _isSigning
        );

        emit UpdateAvailable(_targetValidator);
    }
}
