pragma solidity ^0.5.0;
import "../../../contracts/vesting/Holding.sol";


contract HoldingMock is Holding {

    constructor(uint _time)
        public
    {
        holders[address(0xdD870fA1b7C4700F2BD7f44238821C26f7392148)] = Holder({
            availableAmount: 99,
            time: _time
        });
    }


}