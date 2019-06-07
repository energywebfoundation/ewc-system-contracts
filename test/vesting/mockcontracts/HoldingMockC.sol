pragma solidity 0.5.8;
import "../../../contracts/vesting/Holding.sol";


contract HoldingMockC is Holding {

    function initHoldingData()
        internal 
    {
        addHolding(0x2526AeE4A3b281a5F17324E1F306a051bb4607Ae, 99 ether, 2000000000);
        addHolding(0x0733e48DC2a92DcA29CDA3c6EAE4d23EB11BEa60, 44 ether, 2000000000);
        addHolding(0xE286aBBC34d6E5D0F057D3e6f5343e5fB31e4c32, 41198064933333333690000000, 0);
    }
}
