pragma solidity ^0.5.0;
import "../../../contracts/reward/BlockReward.sol";


contract MockReward is BlockReward {

    function setSystemAddress(address _address)
        public
    {
        SYSTEM_ADDRESS = _address;
    }
}
