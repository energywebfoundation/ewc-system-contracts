pragma solidity ^0.5.4;


contract SCurveProvider {

    function getBlockReward(uint256 _currentBlock)
        public
        view
        returns (uint256)
    {
        return 5;
    }
}