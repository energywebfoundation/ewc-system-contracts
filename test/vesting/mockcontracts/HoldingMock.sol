pragma solidity ^0.5.0;
import "../../../contracts/vesting/Holding.sol";


contract HoldingMock is Holding {

    constructor(address _account, uint256 _funding, uint _time)
        public
        payable
    {
        holders[_account] = Holder({
            availableAmount: _funding,
            time: _time
        });
    }


}
