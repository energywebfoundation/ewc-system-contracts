pragma solidity 0.5.8;
import "../../../contracts/vesting/Holding.sol";


contract HoldingMockB is Holding {

    function initHoldingData()
        internal 
    {
        addHolding(0xdD870fA1b7C4700F2BD7f44238821C26f7392148, 50 ether, 2000000000);
        addHolding(0xdD870fA1b7C4700F2BD7f44238821C26f7392148, 44 ether, 2000000000);
    }
}
