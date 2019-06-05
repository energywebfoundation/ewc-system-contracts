pragma solidity 0.5.8;

import "../../../contracts/reward/BlockReward.sol";


contract MockSystem {

    event Rewarded(address[] receivers, uint256[] rewards);

    address private _tester;
    BlockReward public _rewardContract;

    modifier onlyTester() {
        require(msg.sender == _tester, "Not the tester");
        _;
    }

    constructor(address _rContract)
        public
    {
        _tester = msg.sender;
        _rewardContract = BlockReward(_rContract);
    }

    function setRewardContract(address _newAddress)
        onlyTester
        public
    {
        _rewardContract = BlockReward(_newAddress);
    }

    function rewardWithEvent(address[] memory _benefactors, uint16[] memory _kind)
        public
        onlyTester
    {
        address[] memory _receivers;
        uint256[] memory _rewards;
        (_receivers, _rewards) = _rewardContract.reward(_benefactors, _kind);
        emit Rewarded(_receivers, _rewards);
    }
}
