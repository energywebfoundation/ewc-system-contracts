pragma solidity ^0.5.4;

import "../libs/SafeMath.sol";

contract VestingContract {
    event LogCommunityFundWithdrawal(uint);

    ///@dev overall payout is PAYOUT_PER_BLOCK * (STOP_AT_BLOCK + 1)
    uint256 constant public PAYOUT_PER_BLOCK = 5;
    uint256 constant public STOP_AT_BLOCK = 1000;
    
    uint256 public nextPossiblePayoutBlock;
    address payable public payoutAddress;
   

   constructor (address payable _payoutAddress) 
        public
        payable
    {
        payoutAddress = _payoutAddress;
        nextPossiblePayoutBlock = 0;
    }


    function withdraw()
        public
    {

        require(nextPossiblePayoutBlock <= STOP_AT_BLOCK, "Stop block reached.");

        uint256 relevantBlockNumber = block.number < STOP_AT_BLOCK ? block.number : STOP_AT_BLOCK;

        require(relevantBlockNumber >= nextPossiblePayoutBlock, "Function already called for this block.");

        uint256 blocksToPayFor =  relevantBlockNumber - nextPossiblePayoutBlock + 1;
        nextPossiblePayoutBlock = relevantBlockNumber + 1;

        uint256 payout = SafeMath.mul(blocksToPayFor, PAYOUT_PER_BLOCK);

        payoutAddress.transfer(payout);

        emit LogCommunityFundWithdrawal(payout);
    }


   
}
