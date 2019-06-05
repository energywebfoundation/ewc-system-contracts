pragma solidity 0.5.8;
pragma experimental ABIEncoderV2;

import "../interfaces/INodeControl.sol";
import "./NodeControlLookUp.sol";
import "../misc/Ownable.sol";


contract NodeControlDb is Ownable {
    mapping (address => INodeControl.ValidatorState) public currentState;

    NodeControlLookUp public nodeControlLookUp;

    modifier onlyLogic {
        require(msg.sender == nodeControlLookUp.nodeControlContract(), "Error: onlyLogic Db");
        _;
    }

    /// @notice Constructor that sets the owner of the database
    constructor(NodeControlLookUp _lookUpContract, address _owner)
        public 
    {
        nodeControlLookUp = _lookUpContract;
        _transferOwnership(_owner);
    }

    /// @notice Changes the logic contract (can only be called by the owner of the database)
    /// @param _newLookUp the new logic that is allowed to write data
    function changeLookUpContract(address _newLookUp) 
        external 
        onlyOwner 
    {
        require(_newLookUp != address(0x0), "Error: newLookUp is not allowed to be 0x0");
        nodeControlLookUp = NodeControlLookUp(_newLookUp);
    }

    /// @notice Sets the state for a validator
    /// @param _targetValidator The validator whos state needs to be updated
    /// @param _dockerSha The sha of the dockerfile
    /// @param _dockerName The name of the dockerfile
    /// @param _chainSpecSha The sha of the chainSpecFile
    /// @param _chainSpecUrl The url where the chainSpecFile can be found
    /// @param _isSigning Indicates if the validator shall sign blocks
    function setState (
        address _targetValidator, 
        bytes calldata _dockerSha, 
        string calldata _dockerName, 
        bytes calldata _chainSpecSha, 
        string calldata _chainSpecUrl, 
        bool _isSigning
    )   
        external 
        onlyLogic 
    {
        currentState[_targetValidator].dockerSha = _dockerSha;
        currentState[_targetValidator].dockerName = _dockerName;
        currentState[_targetValidator].chainSpecSha = _chainSpecSha;
        currentState[_targetValidator].chainSpecUrl = _chainSpecUrl;
        currentState[_targetValidator].isSigning = _isSigning;
        currentState[_targetValidator].updateIntroduced = block.number;
    }

    /// @notice Sets the confirm
    /// @param _targetValidator The validator that confirms the update
    function setUpdateConfirmed(address _targetValidator) 
        external 
        onlyLogic 
    {
        currentState[_targetValidator].updateConfirmed = block.number;
    }

    /// @notice View method to check if an update was confirmed by the validator
    /// @param _targetValidator The validator that is supposed to be checked
    function isUpdateConfirmed(address _targetValidator) 
        external 
        view 
        returns(bool) 
    {
        return (currentState[_targetValidator].updateIntroduced < currentState[_targetValidator].updateConfirmed);
    }

    /// @notice Gets the state for a validator
    /// @param _targetValidator The validator whos state you want
    function getState(address _targetValidator) 
        external 
        view 
        onlyLogic 
        returns (INodeControl.ValidatorState memory)
    {
        return currentState[_targetValidator];
    }

    /// @notice Gets the dockerSha
    /// @param _targetValidator The validator whos dockerSha you want
    function getDockerSha(address _targetValidator) 
        external 
        view 
        onlyLogic 
        returns(bytes memory) 
    {
        return currentState[_targetValidator].dockerSha;
    }

    /// @notice Gets the dockerName
    /// @param _targetValidator The validator whos dockerName you want
    function getDockerName(address _targetValidator) 
        external 
        view 
        onlyLogic 
        returns(string memory) 
    {
        return currentState[_targetValidator].dockerName;
    }

    /// @notice Gets the chainSpecSha
    /// @param _targetValidator The validator whos chainSpecSha you want
    function getChainSpecSha(address _targetValidator) 
        external 
        view 
        onlyLogic 
        returns(bytes memory) 
    {
        return currentState[_targetValidator].chainSpecSha;
    }

    /// @notice Gets the chainSpecUrl
    /// @param _targetValidator The validator whos chainSpecUrl you want
    function getChainSpecUrl(address _targetValidator) 
        external 
        view 
        onlyLogic 
        returns(string memory) 
    {
        return currentState[_targetValidator].chainSpecUrl;
    }

    /// @notice Gets the isSigning
    /// @param _targetValidator The validator you want to know of if they are signing
    function getIsSigning(address _targetValidator) 
        external 
        view 
        onlyLogic 
        returns(bool) 
    {
        return currentState[_targetValidator].isSigning;
    }
}
