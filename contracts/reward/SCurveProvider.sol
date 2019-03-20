pragma solidity ^0.5.4;

import "../libs/SafeMath.sol";


//solhint-disable max-line-length
contract SCurveProvider {

    /*
    using SafeMath for uint256;

    uint256 internal blockTime ; //block time in seconds
    uint256 internal rewardDuration; //reward duration in years
    uint256 internal blocks; //'blockTime' seconds per block | 60min * 24h * 365d * 'rewardDuration'years
    uint256 internal block1; //block number for constant phase end
    uint256 internal block2; //block number to start asymptomical phase

    uint256 internal quotient; // integral quotient to calibrate to defined reward tokens, is calculated by "CalculateReward"
    uint256 internal rewardtokens; // number of total reward tokens (in ether!)
    uint256 internal maxreward; //maximum reward in Wei, paid only in the constant phase, later it becomes less. Is calculated by "CalculateReward"


    constructor() 
        public
    {
        blockTime = 5;
        rewardDuration = 10;
        blocks = ((((uint256(60).div(blockTime)).mul(60)).mul(24)).mul(365)).mul(rewardDuration); 
        block1 = blocks.mul(t1);
        block2 = blocks.mul(t2);

        quotient = 32586770;
        rewardtokens = 10000000 ether;
        maxreward = rewardtokens.mul(quotient) wei;
    }

    function F1(uint256 _currentblock)
        internal
        view
        returns (uint256)
    {
        return maxreward;
    }

    function F2(uint256 _currentblock)
        internal
        view
        returns (uint256)
    {
        // constants - can be outsourced into a init function
        uint256 _a = block2.sub(blocks);
        uint256 _b = block2.sub(block1);
        uint256 _c = blocks.mul(blocks.sub(block1.add(block2))) + block1.mul(block2);
        // help variable
        uint256 _d = block1.sub(currentblock);
        // calculation
        //final long y = (long) ((double) maxreward * d * d * a / c / b + maxreward);
        //final long y = maxreward  * a * d * d / b / c + maxreward; //if numerical possible
        uint256 _y = maxreward.div(_c).mul(_a) * _d / _b * _d + maxreward;

        return _y;
    }

    function F3(uint256 currentblock)
        internal
        view
        returns (uint256)
    {
        // constants - can be outsourced into a init function
        final long c = blocks * (blocks - (block1 + block2)) + block1 * block2;
        // help variable
        final long d = blocks - currentblock;
        // calculation
        //final long y = (long) ((double) maxreward * d * d / c);
        //final long y = maxreward  * d * d / c; //if numerical possible
        final long y = maxreward / c * d * d;

        return y;
    }

    function calculateBlockReward(uint256 _currentblock)
        internal
        view
        returns (uint256)
    {
        if (_currentblock < block1) {
            return F1(_currentblock);
        }
        else if (_currentblock < block2) {
            return F2(_currentblock);
        }
        return F3(_currentblock);
    }
    */
    
    function getBlockReward(uint256 _currentBlock)
        internal
        pure
        returns (uint256)
    {
        return 5;
    }
}
//solhint-enable max-line-length