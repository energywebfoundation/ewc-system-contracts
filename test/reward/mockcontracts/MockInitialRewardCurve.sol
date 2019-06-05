pragma solidity 0.5.8;

import "../../../contracts/reward/BlockReward.sol";


contract MockInitialRewardCurve is BlockReward {

    constructor(address _communityFundAddress, uint256 _communityFundAmount)
        BlockReward(_communityFundAddress, _communityFundAmount)
        public
    {
    }

    function _initCurve()
        private
    {   
        // a shorter than expected S curve
        sCurve = [uint256(304418979390926464)];
        blockStepSize = 525600;
        rewardPeriodEnd = blockStepSize * REQUIRED_CURVE_LENGTH;
    }
}
