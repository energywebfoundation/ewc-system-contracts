pragma solidity ^0.5.4;

import "../interfaces/IBlockReward.sol";
import "../storage/EternalStorage.sol";
import "./SCurveProvider.sol";

import "../libs/SafeMath.sol";


/// @dev Might remove Eternal Storage alltogether. This contract is not expected to be upgraded
/// and only stores uints
contract BlockReward is EternalStorage, SCurveProvider, IBlockReward {
    using SafeMath for uint256;

    bytes32 internal constant MINTED_TOTALLY = keccak256("mintedTotally");
    bytes32 internal constant MINTED_FOR_COMMUNITY = keccak256("mintedForCommunity");
    bytes32 internal constant MINTED_FOR_COMMUNITY_FOR_ACCOUNT = "mintedForCommunityForAccount";
    bytes32 internal constant MINTED_FOR_ACCOUNT = "mintedForAccount";
    bytes32 internal constant MINTED_FOR_ACCOUNT_IN_BLOCK = "mintedForAccountInBlock";
    bytes32 internal constant MINTED_IN_BLOCK = "mintedInBlock";

    // solhint-disable var-name-mixedcase
    
    /// SYSTEM_ADDRESS: 2^160 - 2
    address internal SYSTEM_ADDRESS = 0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE;
    /// The constant amount that gets sent to the
    /// community fund with each new block. It is a constant
    /// value but can be set in the constructor.
    uint256 public communityFundAmount;
    address public communityFund;
    mapping(address => address) public payoutAddresses;
    // solhint-enable var-name-mixedcase

    modifier onlySystem {
        require(
            msg.sender == SYSTEM_ADDRESS,
            "Caller is not the SYSTEM"
        );
        _;
    }

    modifier onlyCommunityFund {
        require(
            msg.sender == communityFund,
            "Caller is not the community fund"
        );
        _;
    }

    constructor(address _communityFundAddress, uint256 _communityFundAmount)
        public
    {
        communityFund = _communityFundAddress;
        communityFundAmount = _communityFundAmount;
    }

    function setCommunityFund(address _newFund)
        external
        onlyCommunityFund
    {
        communityFund = _newFund;
    }

    function setPayoutAddress(address _newPayoutAddress)
        external
    {
        payoutAddresses[msg.sender] = _newPayoutAddress;
    }

    function resetPayoutAddress()
        external
    {
        delete payoutAddresses[msg.sender];
    }

    function reward(address[] calldata benefactors, uint16[] calldata kind)
        external
        onlySystem
        returns (address[] memory, uint256[] memory)
    {
        require(benefactors.length == kind.length, "Benefactors/types length differs");
        require(benefactors.length == 1, "Benefactors length is not 1");
        require(kind[0] == 0, "Benefactor is not the block author.");

        if (benefactors[0] == address(0)) {
            return (new address[](0), new uint256[](0));
        }

        address[] memory receivers = new address[](2);
        uint256[] memory rewards = new uint256[](receivers.length);

        receivers[0] = _getPayoutAddress(benefactors[0]);
        rewards[0] = getBlockReward(block.number);
        
        receivers[1] = _getPayoutAddress(communityFund);
        rewards[1] = communityFundAmount;

        _logMinted(rewards[0], receivers[0]);
        _logCommunityMinted(rewards[1], receivers[1]);
    
        return (receivers, rewards);
    }

    function mintedForCommunity()
        public
        view
        returns(uint256)
    {
        return uintStorage[MINTED_FOR_COMMUNITY];
    }

    function mintedForCommunityForAccount(address _account)
        public
        view
        returns(uint256)
    {
        return uintStorage[
            keccak256(abi.encode(MINTED_FOR_COMMUNITY_FOR_ACCOUNT, _account))
        ];
    }

    function mintedForAccount(address _account)
        public
        view
        returns(uint256)
    {
        return uintStorage[
            keccak256(abi.encode(MINTED_FOR_ACCOUNT, _account))
        ];
    }

    function mintedForAccountInBlock(address _account, uint256 _blockNumber)
        public
        view
        returns(uint256)
    {
        return uintStorage[
            keccak256(abi.encode(MINTED_FOR_ACCOUNT_IN_BLOCK, _account, _blockNumber))
        ];
    }

    function mintedInBlock(uint256 _blockNumber)
        public
        view
        returns(uint256)
    {
        return uintStorage[
            keccak256(abi.encode(MINTED_IN_BLOCK, _blockNumber))
        ];
    }

    function mintedTotally()
        public
        view
        returns(uint256)
    {
        return uintStorage[MINTED_TOTALLY];
    }

    function _getPayoutAddress(address _blockAuthor)
        private
        view
        returns (address)
    {
        address _payoutAddress = payoutAddresses[_blockAuthor];
        if (_payoutAddress == address(0)) {
            return _blockAuthor;
        }
        return _payoutAddress;
    }

    function _logCommunityMinted(uint256 _amount, address _account)
        private
    {
        bytes32 _hash;
        
        _hash = MINTED_FOR_COMMUNITY;
        uintStorage[_hash] = uintStorage[_hash].add(_amount);

        _hash = keccak256(abi.encode(MINTED_FOR_COMMUNITY_FOR_ACCOUNT, _account));
        uintStorage[_hash] = uintStorage[_hash].add(_amount);
        
        _logMinted(_amount, _account);
    }

    function _logMinted(uint256 _amount, address _account)
        private
    {
        bytes32 _hash;

        _hash = keccak256(abi.encode(MINTED_FOR_ACCOUNT_IN_BLOCK, _account, block.number));
        uintStorage[_hash] = uintStorage[_hash].add(_amount);

        _hash = keccak256(abi.encode(MINTED_FOR_ACCOUNT, _account));
        uintStorage[_hash] = uintStorage[_hash].add(_amount);

        _hash = keccak256(abi.encode(MINTED_IN_BLOCK, block.number));
        uintStorage[_hash] = uintStorage[_hash].add(_amount);

        _hash = MINTED_TOTALLY;
        uintStorage[_hash] = uintStorage[_hash].add(_amount);
    }
}
