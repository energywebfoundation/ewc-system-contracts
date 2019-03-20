pragma solidity ^0.5.4;


/// @title Holding
contract Holding {
    mapping (address => Holder) public holders;
    uint256 initialLockedUpAmount = 0;
    uint256 constant TARGET_AMOUNT = 143;

    struct Holder {
        uint256 availableAmount;
        uint256 lockedUntilBlocktimestamp;
    }
        
    constructor()
        public
        payable
    {
        require(address(this).balance == TARGET_AMOUNT, "Balance should equal target amount.");
                                                                   
        initHoldingData();

        require(initialLockedUpAmount == TARGET_AMOUNT, "Target amount should equal actual amount");
    }

    /// @notice Rlease funds for a specific address
    /// @param _holderAddress the ethereum address which should get its funds
    function releaseFunds(address payable _holderAddress) 
        public 
    {
        Holder storage holder = holders[_holderAddress];
        
        require(holder.availableAmount > 0, "Available amount is 0");
        require(now > holder.lockedUntilBlocktimestamp, "Holding period is not over");
        
        uint256 amountToTransfer = holder.availableAmount;
        holder.availableAmount = 0;
        _holderAddress.transfer(amountToTransfer);
        
    }

    function initHoldingData()
        internal 
    {
        addHolding(0xdD870fA1b7C4700F2BD7f44238821C26f7392148, 99, 2000000000);
        addHolding(0x583031D1113aD414F02576BD6afaBfb302140225, 44, 2000000000);
    }

    function addHolding(address investor, uint256 amountToHold, uint256 lockUntil) 
        internal
    {

        Holder storage holder = holders[address(investor)];

        require(
            holder.availableAmount == 0 && holder.lockedUntilBlocktimestamp == 0,
            "Holding for this address was already set."
        );

        initialLockedUpAmount += amountToHold;
        
        holder.availableAmount = amountToHold;
        holder.lockedUntilBlocktimestamp = lockUntil;
        
    }
    
}
