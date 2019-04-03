pragma solidity ^0.5.4;
import "../../../contracts/reward/BlockReward.sol";


contract MockReward is BlockReward {

    address private _tester;

    constructor(address _communityFundAddress, uint256 _communityFundAmount)
        BlockReward(_communityFundAddress, _communityFundAmount)
        public
    {
        _tester = msg.sender;
    }

    function setSystemAddress(address _address)
        public
    {
        require(_tester == msg.sender, "Not the tester");
        SYSTEM_ADDRESS = _address;
    }

    function calcBlockReward(uint256 _blockNumber)
        public
        view
        returns (uint256)
    {
        return getBlockReward(_blockNumber);
    }

    function setRewardPeriodLimit(uint256 _blockNumber)
        public
    {
        require(_tester == msg.sender, "Not the tester");
        rewardPeriodEnd = _blockNumber;
    }
}
