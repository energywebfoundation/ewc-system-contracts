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

    uint256 public constant COMMUNITY_FUND_AMOUNT = 1 ether;
    address internal SYSTEM_ADDRESS = 0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE;
    // Needs
    address public communityFund = 0x0000000000000000000000000000000000000000;

    mapping(address => address) public payoutAddresses;

    event Rewarded(address[] receivers, uint256[] rewards);

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
        require(benefactors.length == kind.length);
        require(benefactors.length == 1);
        require(kind[0] == 0);

        if (benefactors[0] == address(0)) {
            return (new address[](0), new uint256[](0));
        }

        address[] memory receivers = new address[](2);
        uint256[] memory rewards = new uint256[](receivers.length);

        receivers[0] = _getPayoutAddress(benefactors[0]);
        rewards[0] = getBlockReward(block.number);
        
        receivers[1] = _getPayoutAddress(communityFund);
        rewards[1] = COMMUNITY_FUND_AMOUNT;

        _trackMinted(rewards[0], receivers[0]);
        _trackCommunityMinted(rewards[0], receivers[1]);
        
        // We might take this out cause service transactions
        // cannot emit events
        emit Rewarded(receivers, rewards);
    
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

    function _trackCommunityMinted(uint256 _amount, address _account)
        private
    {
        bytes32 hash;
        
        hash = MINTED_FOR_COMMUNITY;
        uintStorage[hash] = uintStorage[hash].add(_amount);

        hash = keccak256(abi.encode(MINTED_FOR_COMMUNITY_FOR_ACCOUNT, _account));
        uintStorage[hash] = uintStorage[hash].add(_amount);
        
        _trackMinted(_amount, _account);
    }

    function _trackMinted(uint256 _amount, address _account)
        private
    {
        bytes32 hash;

        hash = keccak256(abi.encode(MINTED_FOR_ACCOUNT_IN_BLOCK, _account, block.number));
        uintStorage[hash] = _amount;

        hash = keccak256(abi.encode(MINTED_FOR_ACCOUNT, _account));
        uintStorage[hash] = uintStorage[hash].add(_amount);

        hash = keccak256(abi.encode(MINTED_IN_BLOCK, block.number));
        uintStorage[hash] = uintStorage[hash].add(_amount);

        hash = MINTED_TOTALLY;
        uintStorage[hash] = uintStorage[hash].add(_amount);
    }
}
