pragma solidity ^0.5.4;
import "../../../contracts/reward/BlockReward.sol";


contract MockReward is BlockReward {

    address private _tester;
    uint256[] public _steps;

    constructor(address _communityFundAddress, uint256 _communityFundAmount)
        BlockReward(_communityFundAddress, _communityFundAmount)
        public
    {
        _tester = msg.sender;
        _steps = [uint256(10), 20, 30, 40, 50, 60, 70, 80, 90, 100];
    }

    function setSystemAddress(address _address)
        public
    {
        require(_tester == msg.sender, "Not the tester");
        SYSTEM_ADDRESS = _address;
    }

    /// We mock the blockreward for the tests only
    function getBlockReward(uint256 _currentBlock)
        public
        view
        returns (uint256)
    {
        uint256 rem = _currentBlock % 100;

        uint i;
        for (i = 0; i < _steps.length; i++) {
            if (rem <= _steps[i]) {
                return 110 - _steps[i];
            }
        }
        return 0;
    }
}
