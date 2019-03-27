pragma solidity ^0.5.4;

import "../interfaces/IBlockReward.sol";
import "./SCurveProvider.sol";

import "../libs/SafeMath.sol";


/// @title Block reward contract
/// @notice Performs payouts at each new created block. Block authors
/// are rewarded according to an S-curve, while there is a constant payout for
/// a community fund for a certain period of time.
/// @dev Contract is used by the Parity client and its address is
/// specified in the chainspec
contract BlockReward is SCurveProvider, IBlockReward {
    using SafeMath for uint256;

    /// These constants are used for logging reward amounts by category
    bytes32 internal constant MINTED_TOTALLY = keccak256("mintedTotally");
    bytes32 internal constant MINTED_FOR_COMMUNITY = keccak256("mintedForCommunity");
    bytes32 internal constant MINTED_FOR_COMMUNITY_FOR_ACCOUNT = "mintedForCommunityForAccount";
    bytes32 internal constant MINTED_FOR_ACCOUNT = "mintedForAccount";
    bytes32 internal constant MINTED_FOR_ACCOUNT_IN_BLOCK = "mintedForAccountInBlock";
    bytes32 internal constant MINTED_IN_BLOCK = "mintedInBlock";

    // solhint-disable var-name-mixedcase
    /// Parity client SYSTEM_ADDRESS: 2^160 - 2
    address internal SYSTEM_ADDRESS = 0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE;
    /// The constant amount that gets sent to the
    /// community fund with each new block
    uint256 public communityFundAmount;
    /// Address of the community fund. Preferably a multisig wallet
    address public communityFund;
    /// Mapping of addresses and their payout addresses where rewards are minted
    mapping(address => address) public payoutAddresses;
    /// Stores reward amounts
    mapping(bytes32 => uint256) private uintStorage;
    // solhint-enable var-name-mixedcase

    modifier onlySystem {
        require(
            msg.sender == SYSTEM_ADDRESS,
            "Caller is not the system"
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

    /// @notice Sets community fund address. Ideally
    /// it is a multisig wallet address
    /// @param _newFund New community fund address
    function setCommunityFund(address _newFund)
        external
        onlyCommunityFund
    {
        communityFund = _newFund;
    }

    /// @notice Sets payout address. Every sender can only set its own
    /// payout address. The contract only rewards block authors, but it
    /// is not checking who sets an address for itself. The community fund 
    /// can set a payout address too, if desired.
    /// @param _newPayoutAddress The payout address belonging to the sender
    function setPayoutAddress(address _newPayoutAddress)
        external
    {
        payoutAddresses[msg.sender] = _newPayoutAddress;
    }

    /// @notice Resets the payout address. If a payout address is reseted/not set,
    /// the minted amounts get sent to the original one. The sender resets its own 
    /// payout address
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

        _logMinted(receivers[0], rewards[0]);
        _logCommunityMinted(receivers[1], rewards[1]);
    
        return (receivers, rewards);
    }

    /// @notice Stat of how much was minted
    /// for the community fund so far
    /// @return The amount in wei
    function mintedForCommunity()
        public
        view
        returns(uint256)
    {
        return uintStorage[MINTED_FOR_COMMUNITY];
    
    }

    /// @notice Stat of how much was minted
    /// for the community fund for a certain address so far
    /// @param _account The account address to "query"
    /// @return The amount in wei
    function mintedForCommunityForAccount(address _account)
        public
        view
        returns(uint256)
    {
        return uintStorage[
            keccak256(abi.encode(MINTED_FOR_COMMUNITY_FOR_ACCOUNT, _account))
        ];
    }

    /// @notice Stat of how much was minted
    /// for a certain account
    /// @param _account The account address to "query"
    /// @return The amount in wei
    function mintedForAccount(address _account)
        public
        view
        returns(uint256)
    {
        return uintStorage[
            keccak256(abi.encode(MINTED_FOR_ACCOUNT, _account))
        ];
    }

    /// @notice Stat of how much was minted
    /// for a certain account in a certain block
    /// @param _account The account address to "query"
    /// @param _blockNumber The block number to "query"
    /// @return The amount in wei
    function mintedForAccountInBlock(address _account, uint256 _blockNumber)
        public
        view
        returns(uint256)
    {
        return uintStorage[
            keccak256(abi.encode(MINTED_FOR_ACCOUNT_IN_BLOCK, _account, _blockNumber))
        ];
    }

    /// @notice Stat of how much was minted
    /// in total in a certain block
    /// @param _blockNumber The block number to "query"
    /// @return The amount in wei
    function mintedInBlock(uint256 _blockNumber)
        public
        view
        returns(uint256)
    {
        return uintStorage[
            keccak256(abi.encode(MINTED_IN_BLOCK, _blockNumber))
        ];
    }

    /// @notice Stat of how much was minted
    /// totally so far
    /// @return The amount in wei
    function mintedTotally()
        public
        view
        returns(uint256)
    {
        return uintStorage[MINTED_TOTALLY];
    }

    /// @dev Retrieves the payout address of an account if there is any. If not specified 
    /// or resetted, returns the original account
    /// @param _somebody An account address we retrieve the payout address for
    /// @return The payout address
    function _getPayoutAddress(address _somebody)
        private
        view
        returns (address)
    {
        address _payoutAddress = payoutAddresses[_somebody];
        if (_payoutAddress == address(0)) {
            return _somebody;
        }
        return _payoutAddress;
    }
    
    /// @dev Logs a community-mint event. Calls `_logMinted` after setting the
    /// community specific metrics
    /// @param _account The account address where the tokens are minted
    /// @param _amount The minted amount in wei
    function _logCommunityMinted(address _account, uint256 _amount)
        private
    {
        bytes32 _hash;
        
        _hash = MINTED_FOR_COMMUNITY;
        uintStorage[_hash] = uintStorage[_hash].add(_amount);

        _hash = keccak256(abi.encode(MINTED_FOR_COMMUNITY_FOR_ACCOUNT, _account));
        uintStorage[_hash] = uintStorage[_hash].add(_amount);
        
        _logMinted(_account, _amount);
    }

    /// @dev Logs a mint event, and stores related metrics (counters).
    /// @param _account The account address where the tokens are minted
    /// @param _amount The minted amount in wei
    function _logMinted(address _account, uint256 _amount)
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
