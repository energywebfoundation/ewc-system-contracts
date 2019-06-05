pragma solidity 0.5.8;


/// @title S Curve Reward provider
/// @notice Provides the appropriate block author rewards
/// based on points of a discrete, inverse S curve
contract SCurveProvider {

    /// Required length of the discrete S curve
    uint256 public constant REQUIRED_CURVE_LENGTH = 120;

    /// Discrete points of the curve
    uint256[] public sCurve;
    /// Discrete step size
    uint256 public blockStepSize;
    /// End of the reward period (both block- and community reward)
    /// expressed in block number
    uint256 public rewardPeriodEnd;

    constructor()
        public
    {
        _initCurve();
        // This check is for protecting against some tampering
        // for chainspec deployment
        require(sCurve.length == REQUIRED_CURVE_LENGTH, "Reward curve is not the required length");
    }

    /// @notice Returns the block reward amount based on the block number
    /// and points of the S curve
    /// @param _currentBlock The block number to calculate the reward to
    /// @return The block reward amount in wei
    function getBlockReward(uint256 _currentBlock)
        public
        view
        returns (uint256)
    {
        if (_checkRewardPeriodEnded(_currentBlock)) {
            return 0;
        }
        return sCurve[_currentBlock / blockStepSize];
    }

    /// @notice Checks whether the reward period is over or not (block and community)
    /// @return True if the reward period has ended, false otherwise
    function checkRewardPeriodEnded()
        public
        view
        returns (bool)
    {
        return _checkRewardPeriodEnded(block.number);
    }

    /// @notice Checks whether the block reward period is over or not
    /// @param _currentBlock The block number to check on
    /// @return True if the block reward period has ended, false otherwise
    function _checkRewardPeriodEnded(uint256 _currentBlock)
        internal
        view
        returns (bool)
    {
        return (_currentBlock >= rewardPeriodEnd);
    }

    // solhint-disable function-max-lines
    /// @dev Inits the S curve. Values are hardcoded,
    /// everyhting is calculated beforehand
    function _initCurve()
        private
    {   
        sCurve = [
            uint256(304418979390926464),
            304418979390926464,
            304418979390926464,
            304418979390926464,
            304418979390926464,
            304418979390926464,
            304418979390926464,
            304369560376526464,
            304221303333326464,
            303974208261326464,
            303628275160526464,
            303183504030926464,
            302639894872526464,
            301997447685326464,
            301256162469326464,
            300416039224526464,
            299477077950926464,
            298439278648526464,
            297302641317326464,
            296067165957326464,
            294732852568526464,
            293299701150926464,
            291767711704526464,
            290136884229326464,
            288407218725326464,
            286578715192526464,
            284651373630926464,
            282625194040526464,
            280500176421326464,
            278276320773326464,
            275953627096526464,
            273532095390926464,
            271011725656526464,
            268392517893326464,
            265674472101326464,
            262857588280526464,
            259941866430926464,
            256927306552526464,
            253813908645326464,
            250601672709326464,
            247290598744526464,
            243880686750926464,
            240371936728526464,
            236764348677326464,
            233057922597326464,
            229252658488526464,
            225348556350926464,
            221345616184526464,
            217243837989326464,
            213043221765326464,
            208743767512526464,
            204345475230926464,
            199848344920526464,
            195252376581326464,
            190557570213326464,
            185763925816526464,
            180871443390926464,
            175880122936526464,
            170789964453326464,
            165600967941326464,
            160117606656000000,
            154824830213760000,
            149621007997440000,
            144506140007040000,
            139480226242560000,
            134543266704000000,
            129695261391360000,
            124936210304640000,
            120266113443840000,
            115684970808960000,
            111192782400000000,
            106789548216960000,
            102475268259840000,
            98249942528640000,
            94113571023360000,
            90066153744000000,
            86107690690560000,
            82238181863040000,
            78457627261440000,
            74766026885760000,
            71163380736000000,
            67649688812160000,
            64224951114240000,
            60889167642240000,
            57642338396160000,
            54484463376000000,
            51415542581760000,
            48435576013440000,
            45544563671040000,
            42742505554560000,
            40029401664000000,
            37405251999360000,
            34870056560640000,
            32423815347840000,
            30066528360960000,
            27798195600000000,
            25618817064960000,
            23528392755840000,
            21526922672640000,
            19614406815360000,
            17790845184000000,
            16056237778560000,
            14410584599040000,
            12853885645440000,
            11386140917760000,
            10007350416000000,
            8717514140160000,
            7516632090240000,
            6404704266240000,
            5381730668160000,
            4447711296000000,
            3602646149760000,
            2846535229440000,
            2179378535040000,
            1601176066560000,
            1111927824000000,
            711633807360000,
            400294016640000,
            177908451840000,
            44477112960000
        ];
        // roughly 1 month with a 5 sec step size
        blockStepSize = 525600;
        //roughly 10 years with a 5 sec step size
        rewardPeriodEnd = blockStepSize * REQUIRED_CURVE_LENGTH;
    }

    // solhint-enable function-max-lines
}
