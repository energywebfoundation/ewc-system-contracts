pragma solidity ^0.5.4;


/// @title Holding
contract Holding {
    mapping (address => Holder) public holders;

    struct Holder {
        uint256 availableAmount;
        uint256 time;
    }

    /// @notice Rlease funds for a specific address
    /// @param _holderAddress the ethereum address which should get its funds
    function releaseFunds(address payable _holderAddress) 
        public 
    {
        Holder storage holder = holders[_holderAddress];
        
        require(holder.availableAmount > 0, "Available amount is 0");
        require(now > holder.time, "Holding period is not over");
        
        uint256 amountToTransfer = holder.availableAmount;
        holder.availableAmount = 0;
        _holderAddress.transfer(amountToTransfer);
        
    }
    
}
