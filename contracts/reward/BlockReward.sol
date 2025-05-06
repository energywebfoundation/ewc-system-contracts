pragma solidity 0.5.8;

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

    // storage variables for logging reward statistics
    uint256 public mintedTotally;
    uint256 public mintedForCommunity;
    mapping(address => uint256) public mintedForCommunityForAccount;
    mapping(address => uint256) public mintedForAccount;
    mapping(uint256 => uint256) public mintedInBlock;
    mapping(address => mapping(uint256 => uint256)) public mintedForAccountInBlock;

    /// Parity client SYSTEM_ADDRESS: 2^160 - 2
    address internal systemAddress = 0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE;
    /// The constant amount that gets sent to the
    /// community fund with each new block
    uint256 public communityFundAmount;
    /// Address of the community fund. Preferably a multisig wallet
    address public communityFund;
    /// Mapping of addresses and their payout addresses where rewards are minted
    mapping(address => address) public payoutAddresses;

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
    {
        require(
            msg.sender == communityFund,
            "Caller is not the community fund"
        );
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

    /// @notice The function that is called by the client to issue rewards at a new block. The rewards are
    /// minted: the balances of the corresponing addresses are simply increased with the amount
    /// @dev It is a service transaction invoked by system, which doesn't cost anyhting but still can
    /// modify state. Cannot emit events.
    /// @param benefactors List of addresses that can be rewarded
    /// @param kind List of type codes belonging to the benefactors. They determine the category
    /// an address belongs to. 0 is for block authors which we are only interested in
    /// @return List of addreses to be rewarded, and list of corresponding reward amounts in wei
    function reward(address[] calldata benefactors, uint16[] calldata kind)
        external
        returns (address[] memory, uint256[] memory)
    {
        require(msg.sender == systemAddress, "Caller is not the system");
        require(benefactors.length == kind.length, "Benefactors/types list length differs");
        require(benefactors.length == 1, "Benefactors list length is not 1");
        require(kind[0] == 0, "Benefactor is not the block author");

        if (benefactors[0] == address(0) || _checkRewardPeriodEnded(block.number)) {
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
        mintedForCommunity = mintedForCommunity.add(_amount);

        mintedForCommunityForAccount[_account] = mintedForCommunityForAccount[_account].add(_amount);
        
        _logMinted(_account, _amount);
    }

    /// @dev Logs a mint event, and stores related metrics (counters).
    /// @param _account The account address where the tokens are minted
    /// @param _amount The minted amount in wei
    function _logMinted(address _account, uint256 _amount)
        private
    {
        mintedForAccountInBlock[_account][block.number] = mintedForAccountInBlock[_account][block.number].add(_amount);

        mintedForAccount[_account] = mintedForAccount[_account].add(_amount);

        mintedInBlock[block.number] = mintedInBlock[block.number].add(_amount);

        mintedTotally = mintedTotally.add(_amount);
    }
}
