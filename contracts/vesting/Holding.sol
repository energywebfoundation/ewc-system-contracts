pragma solidity ^0.5.4;


/// @title Holding
contract Holding {
    mapping (address => Holder) public holders;
    uint256 public initialLockedUpAmount = 0;
    uint256 public constant TARGET_AMOUNT = 80000000 ether;

    struct Holder {
        uint256 availableAmount;
        uint256 lockedUntilBlocktimestamp;
    }

    ///@notice loads holding data and checks for sanity
    constructor()
        public
        payable
    {
        require(address(this).balance == TARGET_AMOUNT, "Balance should equal target amount.");
                                                                   
        initHoldingData();

        require(initialLockedUpAmount == TARGET_AMOUNT, "Target amount should equal actual amount");
    }

    /// @notice Rlease funds for a specific address
    /// @param holderAddress the ethereum address which should get its funds
    function releaseFunds(address payable holderAddress) 
        public 
    {
        Holder storage holder = holders[holderAddress];
        
        require(holder.availableAmount > 0, "Available amount is 0");
        require(block.timestamp > holder.lockedUntilBlocktimestamp, "Holding period is not over");
        
        uint256 amountToTransfer = holder.availableAmount;
        holder.availableAmount = 0;
        holderAddress.transfer(amountToTransfer);
    }

    // solhint-disable function-max-lines
    ///@notice loads holding data
    function initHoldingData()
        internal 
    {
        addHolding(0x2526AeE4A3b281a5F17324E1F306a051bb4607Ae, 99 ether, 2000000000);
        addHolding(0x0733e48DC2a92DcA29CDA3c6EAE4d23EB11BEa60, 44 ether, 2000000000);
        addHolding(0xE286aBBC34d6E5D0F057D3e6f5343e5fB31e4c32, 79999660 ether, 2000000000);
        addHolding(0x935599bA25AC6Bdf02eF06E7b6D18D791b36a9d0, 1 ether, 2000000000);
        addHolding(0x736CD7D42920E8981800bAe58F0dFE84716409e4, 1 ether, 2000000000);
        addHolding(0xf22262051777969705D72f54C229e24c8933c472, 1 ether, 2000000000);
        addHolding(0xef716ffFC7E3ABC47879eA26eeBd141be96a0538, 1 ether, 2000000000);
        addHolding(0xBA9e742415Ea32Ec1b82568B619a7466F6787eb8, 1 ether, 2000000000);
        addHolding(0xF9a9efAEFdeb991999878C2Bd64A700eC2eD6f5E, 1 ether, 2000000000);
        addHolding(0x1dA9C2817EbA133F5bD6883cb07F26e369e6F318, 1 ether, 2000000000);
        addHolding(0x365ae6D9EC36F221173eD732877ABA4656644c06, 1 ether, 2000000000);
        addHolding(0x8a2b32A3136d0b669d2e74028dd3B96d2e159aE1, 1 ether, 2000000000);
        addHolding(0x678E51dda0B2aC9953125Fbf434E89d6BaBd504D, 1 ether, 2000000000);
        addHolding(0xdc94c2c32B59F431CB9123C90c390AB9D1c99d09, 1 ether, 2000000000);
        addHolding(0x1Af1C9eF5D107f1572122Dd500d9d44Da42DECEC, 1 ether, 2000000000);
        addHolding(0xf7ac551639d18103B136cCA22EC4Da8aed074CBc, 1 ether, 2000000000);
        addHolding(0xb663dFDe8fa9Ae707114A946B61837dabb1e63c8, 1 ether, 2000000000);
        addHolding(0x56845aBa5d6De62edA3148dE193eFe7C6909A99F, 1 ether, 2000000000);
        addHolding(0x097894E58368e158acee5C0d2AB0CD710D2F10B3, 1 ether, 2000000000);
        addHolding(0x8bfFdd0B808419eEFB724B36F0cb434a97275C91, 1 ether, 2000000000);
        addHolding(0x068f59F4c8abD71E83102A4E5348DD6e6A7FC264, 1 ether, 2000000000);
        addHolding(0xc04043A866569864Cba9991860d01c0e71C1b2FA, 1 ether, 2000000000);
        addHolding(0x63b58A02D7d208d9c6a9E4885E503d3E9Ba3d673, 1 ether, 2000000000);
        addHolding(0x6b9086a96deC70d9c3FDBCCD0E349e6612637573, 1 ether, 2000000000);
        addHolding(0xf360FC0Ab0d4D616dB9e9a5f571e417242894A16, 1 ether, 2000000000);
        addHolding(0x2A5312807935ba8512Cd412F14D9D61E6836043d, 1 ether, 2000000000);
        addHolding(0xcb5459B9c3b06382AD38d38C3733D691984fe2fB, 1 ether, 2000000000);
        addHolding(0x11B60E004B249Bf97d8A784BC8F6147f92900d42, 1 ether, 2000000000);
        addHolding(0x798dBb7AF31F64A90060645B220b9294C56f58ab, 1 ether, 2000000000);
        addHolding(0x0BbcE893FA969f281E38323eCD89d13Bb787A95E, 1 ether, 2000000000);
        addHolding(0x9F4854F0c1c63CBd941cC7a73683969E90157da3, 1 ether, 2000000000);
        addHolding(0x1381a901C8710c47d49F4d7cAb7CF8950144f44b, 1 ether, 2000000000);
        addHolding(0xFb0fA002F029A2F3663ddc31D927d359BF957F0b, 1 ether, 2000000000);
        addHolding(0x67F2A42e37377E1D6c5a5A02DC32242b3Ec56858, 1 ether, 2000000000);
        addHolding(0xA8015dEe399107cB99c4F2C4f790E904591Ea4fD, 1 ether, 2000000000);
        addHolding(0x89078c642CD3F0bCc2aC3D0d9456D1195ab97721, 1 ether, 2000000000);
        addHolding(0x3Fa6C19F23d576393f54C55ADeDdc5d7f25d7444, 1 ether, 2000000000);
        addHolding(0x8B0cbc5090796344DC7EB799D9753E2ddFCc92c1, 1 ether, 2000000000);
        addHolding(0xC54FA48184B33df2aA3519694A4Da5BC51113DD6, 1 ether, 2000000000);
        addHolding(0x94203Ee30f1Ac0b4993b4a60b67ADAf508Ee0de1, 1 ether, 2000000000);
        addHolding(0xcbDD37b275578d56b6d21DbDD2056b96e4115Aff, 1 ether, 2000000000);
        addHolding(0x625D9f9938C8f482B52fE95429c6E100015b92a7, 1 ether, 2000000000);
        addHolding(0x4880eA9C56eb68A1131166CC340596bf47F8fF4B, 1 ether, 2000000000);
        addHolding(0x308B6566dEF7Fed198fc13Fd54f9d351DFF0A2a3, 1 ether, 2000000000);
        addHolding(0x95B71dfA0ABe223E45223851D695DddD560BA3F9, 1 ether, 2000000000);
        addHolding(0x75b809AFFA6b90eA5Adf5b9632de7037774060D8, 1 ether, 2000000000);
        addHolding(0xf0297741c6ADaEc39b7a443A56877B4Af1873d32, 1 ether, 2000000000);
        addHolding(0x84db4Bdb13F49d554CcADae28CF1b95eB7455f0a, 1 ether, 2000000000);
        addHolding(0x4806e39fC269C12Cc6FAF51Bf2000A9fC28c85Dc, 1 ether, 2000000000);
        addHolding(0x14a1f091c6891174973F6516612b76740cDbe11E, 1 ether, 2000000000);
        addHolding(0x9c2Fb606488dB737f129FEfC5c270Af9d52Bb1c4, 1 ether, 2000000000);
        addHolding(0xefdcF1c09eCBDa9bEEd1b498FAE9D4cf73Aa1bA1, 1 ether, 2000000000);
        addHolding(0xf99823b27f20507b211a3e6E361493AA152a4Dc7, 1 ether, 2000000000);
        addHolding(0x76893cCDD1c1b104a50242bD3Cae42904906CE68, 1 ether, 2000000000);
        addHolding(0x9Bd2269462D9447D23f02227164497F9c5119c93, 1 ether, 2000000000);
        addHolding(0xd0aA90c11D609a57a999BA2BE3692DF57C409dc3, 1 ether, 2000000000);
        addHolding(0x82e2A6228A9F675b9AbceBfa3D8f9b14D4BD8211, 1 ether, 2000000000);
        addHolding(0x2C6B6E1157C1503576CB72C72c031F7fF2094E10, 1 ether, 2000000000);
        addHolding(0x1A01135ebF323685ed0445EE30d6820550e8897A, 1 ether, 2000000000);
        addHolding(0x170B2AA445699504EC1D7496c34cfe01f32b26CF, 1 ether, 2000000000);
        addHolding(0xF3632cb0a1ba9b63F830F5d0D4e9056F3b8EeA63, 1 ether, 2000000000);
        addHolding(0xaa8408b0111ed2601450304dd3C58456cC954d34, 1 ether, 2000000000);
        addHolding(0x4Eb57FD2A621BD51cA11b30bfDB9ec1dCA678f5D, 1 ether, 2000000000);
        addHolding(0x347668E8Dd5D2e04f229a54529F532038936830d, 1 ether, 2000000000);
        addHolding(0x77854d1F2ec3b268334E5AE5c6d3022756b727DE, 1 ether, 2000000000);
        addHolding(0xC4654666Bd165bc674a31E79A29cC2B5415637AE, 1 ether, 2000000000);
        addHolding(0x0aa605123eEdda1A2b5d85A02E33dc29cDE277Ac, 1 ether, 2000000000);
        addHolding(0x6dF7c34752105D92e9ceE35ecCa36351EA0BA943, 1 ether, 2000000000);
        addHolding(0xdC1497A6cF92D828A2FF2A95f7526934BabE08cc, 1 ether, 2000000000);
        addHolding(0x0fafbDe285DF00552363E83e2d3d62E29FF9A6Ec, 1 ether, 2000000000);
        addHolding(0xaC041298391f500Aca8D4c6943695284dcD47150, 1 ether, 2000000000);
        addHolding(0xeD8A8f3EC13bEF3d15ab0a68B99d070E7A8A9A03, 1 ether, 2000000000);
        addHolding(0xeCaB8dc4f0FBC78dE8b3098256622dea82860342, 1 ether, 2000000000);
        addHolding(0x011b5C2381df3B321f479AC03b90a6CF67430dfB, 1 ether, 2000000000);
        addHolding(0xCD2b565B7619b454A6e1cCEC51398E879Acf5e5E, 1 ether, 2000000000);
        addHolding(0x535D8F5eab8c08388db765bF5532Fe69d7892E36, 1 ether, 2000000000);
        addHolding(0x95262035BA2D49A7759d2E1000D9443EC36450c3, 1 ether, 2000000000);
        addHolding(0xfA6D9f7D00c988040A4B756531B9C05e46d14a8b, 1 ether, 2000000000);
        addHolding(0x69e99948763422f63F8BCC02aDB3A1DF9bb7026f, 1 ether, 2000000000);
        addHolding(0x4576D3C56655109B180aF284D8552F886d6565Bf, 1 ether, 2000000000);
        addHolding(0xda4b7A3767a58E39C4f2c8d1878Bd3Bfb1a207e4, 1 ether, 2000000000);
        addHolding(0x08851C41cdd8C52312d359254a4c7381c8eD62C9, 1 ether, 2000000000);
        addHolding(0xDe0cb15a05C97a2842977912c96D663cA8a144dA, 1 ether, 2000000000);
        addHolding(0x36E7bC30AD6f2C912c9c09Ce5B519f123e78be07, 1 ether, 2000000000);
        addHolding(0x59C977a0671EFc056f6Db2eC1D6091351F793aC9, 1 ether, 2000000000);
        addHolding(0x69fE2029570c21A4487f544696818041e114AcDF, 1 ether, 2000000000);
        addHolding(0xC2C6dFC2eEd607bF5e10454D1EBEd5d8a1F3E0C3, 1 ether, 2000000000);
        addHolding(0x27916c7702a04577FD65841cCf51Aeb8Cb768392, 1 ether, 2000000000);
        addHolding(0x9A0D0ddEA3F40c172dB295D954CF2B4c3D20DDF0, 1 ether, 2000000000);
        addHolding(0x04e29E11A0210DD753C2D86BA03143701E2673fb, 1 ether, 2000000000);
        addHolding(0xaF263522640c30a46B03392F126d9ea69b72C8a9, 1 ether, 2000000000);
        addHolding(0x3Ba60E1d42306CD3FF37a15C7d1FdcCe4253343B, 1 ether, 2000000000);
        addHolding(0xdC8c0d18DDE183B76Fa6619b55cc252cb4F8f32c, 1 ether, 2000000000);
        addHolding(0x0c5A05A9F37762A362e580ED1bE1db664c2F5bA6, 1 ether, 2000000000);
        addHolding(0x9953c96E93861F117187BFcA22D5fc0881ca7d0B, 1 ether, 2000000000);
        addHolding(0x1812af67308b8324C2d39b7F850341F67E1FA86D, 1 ether, 2000000000);
        addHolding(0x0efBD751440608669Dd711AdFda4062f02AFF6e1, 1 ether, 2000000000);
        addHolding(0x59aE0714f1b5Bf70fBf14Dd987b99378A98A76a0, 1 ether, 2000000000);
        addHolding(0x5c31E79C442C3Aa9FC2FE14809c87C9620C9DCd6, 1 ether, 2000000000);
        addHolding(0xb860d7158b3D03cC963ef11e010837DF1e1B88DF, 1 ether, 2000000000);
        addHolding(0xf54ae21F1B3B7f0a9771128379E825D22a24304e, 1 ether, 2000000000);
        addHolding(0xfcb2A9f93648bEFC6256bD17C319F3019735431C, 1 ether, 2000000000);
        addHolding(0x7E57a392370A9a649C6a7a0dC32ffCffF0c3cF9a, 1 ether, 2000000000);
        addHolding(0x0DCaD6CC8F9b193607F1E784fc6581d8b760c864, 1 ether, 2000000000);
        addHolding(0x3A5D226ed9049d5a57A95465546347c43aA95d24, 1 ether, 2000000000);
        addHolding(0xb821a5d78B46871288DaC5FFB8a387e6CF8Ad442, 1 ether, 2000000000);
        addHolding(0x98dc22B4e89EC3E8CbFe237bBFc819d573d60cc0, 1 ether, 2000000000);
        addHolding(0x7805dB6D82cEccdB2Da38D3918B194B03EF69df7, 1 ether, 2000000000);
        addHolding(0x4e2F1F136a595e5c258BE528412B0bBC2403B51e, 1 ether, 2000000000);
        addHolding(0x7B7A4406EEbaFc2Cd2E9C12aEA4dB8b709E692Ff, 1 ether, 2000000000);
        addHolding(0xb92C30BBF806b6ba861dCf3AFfc47fbd52FD133F, 1 ether, 2000000000);
        addHolding(0xC715bBBf2062934cf4d1347a202348A396B6aaB4, 1 ether, 2000000000);
        addHolding(0x4AbB1CD93ca5e5FF20bc6508E78f64F30cD00A9f, 1 ether, 2000000000);
        addHolding(0x98621E70d7c39E30B5803A72913a1E40A50daBdC, 1 ether, 2000000000);
        addHolding(0xF7fc156eAF351708b68E6dbc7AF66B51D6238846, 1 ether, 2000000000);
        addHolding(0x1851B0c7E560D2625BDF88b557517d281B081240, 1 ether, 2000000000);
        addHolding(0xD614dDf3410773DEef5155E5c9E4e6C734Af294f, 1 ether, 2000000000);
        addHolding(0xB2f6c4e17dB2c16Ae258b6B7b50BC4673Ec7ab3d, 1 ether, 2000000000);
        addHolding(0x4627D7420bC7B012C17C8D7F756a5BAB004F5781, 1 ether, 2000000000);
        addHolding(0xD67B1C444AcD95250C64a4ea06714c64Aaf40CAe, 1 ether, 2000000000);
        addHolding(0x36b240CE4b8515868af6Aca2e650DB4717847d78, 1 ether, 2000000000);
        addHolding(0x6d4DFb41D7431263b8138368178ae11510e3B6bB, 1 ether, 2000000000);
        addHolding(0xa38a9132Ea091F6839514949f57Ce46B1e2D9652, 1 ether, 2000000000);
        addHolding(0x62b3dB5D41ffeAc5da095639db036f4572A9d8D9, 1 ether, 2000000000);
        addHolding(0x99EE9A8657480D60AD83a375B72ac45780B845c1, 1 ether, 2000000000);
        addHolding(0x728b841C20c6cCB57e32485d8d271D5e75561F43, 1 ether, 2000000000);
        addHolding(0x3E24C27505AFE6144217aDc9c00Ff6642b3Af2BA, 1 ether, 2000000000);
        addHolding(0xf2cf431d7B4F61955B65b036cf92E0d44b32D22f, 1 ether, 2000000000);
        addHolding(0x56c1FFafE7Cc5634388cf9dc910B85E45EE8bf84, 1 ether, 2000000000);
        addHolding(0xA9a33E941d3d41809B71d913BF4D7428920091a2, 1 ether, 2000000000);
        addHolding(0x255d0f83bdcfEd7B0DA99c26bc7019a8B38c200B, 1 ether, 2000000000);
        addHolding(0x8E04b919898fa7858D2D9e55Bcce0b16332867fA, 1 ether, 2000000000);
        addHolding(0x6ee7a507014a062de37DF846bF647365a20bD988, 1 ether, 2000000000);
        addHolding(0x83123DBC0C9F5Fae34403E9f01ab5cc60306422D, 1 ether, 2000000000);
        addHolding(0x414A93BDe127Fa4Bd4120C8bB16Bf4B2E24dF991, 1 ether, 2000000000);
        addHolding(0x5225B572D0402826cc92f186D033D718aF84a13f, 1 ether, 2000000000);
        addHolding(0x410Ed55fB29c4A6CEb11B24b387Ed4a2380Bd48E, 1 ether, 2000000000);
        addHolding(0xe9d59D5D0cA38c48e8111e258808E4C8247b9c0C, 1 ether, 2000000000);
        addHolding(0x1e12F0B61651Bb441A604947E89b63F7F3a3e133, 1 ether, 2000000000);
        addHolding(0x02ce34921C20c13B3298169FAbB28c5e4c759522, 1 ether, 2000000000);
        addHolding(0xF5640BF046512F4188B2C8F60c5Ffa062B7A8aCb, 1 ether, 2000000000);
        addHolding(0x4b71FEd15eFB7e487c82897F40952b73CcbAAEEe, 1 ether, 2000000000);
        addHolding(0x0EbC331F4768120bC8B88Bbf6ebAC8cAc4F12Ae8, 1 ether, 2000000000);
        addHolding(0xdE3406e445B4b9af327f22b17BC4EE9244EaEaA2, 1 ether, 2000000000);
        addHolding(0x4bfb841F9b60b549fb410a804bB928980ECbc385, 1 ether, 2000000000);
        addHolding(0xA0F8f3144F8d7834c88390B3f8d5Abc29B0b11C8, 1 ether, 2000000000);
        addHolding(0x6917BaF33475083264392bDbDbc6a3B17583D58f, 1 ether, 2000000000);
        addHolding(0xaB1A05D8034D759c71f96dc87C5EE28763ee1167, 1 ether, 2000000000);
        addHolding(0x78836c52C06bc2132b528716e6aB2BF15a302b19, 1 ether, 2000000000);
        addHolding(0x237Edb49E588C64D39b9aaC116b99Df0A1D384c3, 1 ether, 2000000000);
        addHolding(0xec384833278560CAc351EA4ba91A9F352e67Ce8A, 1 ether, 2000000000);
        addHolding(0xdC8212166418Bba073dF9e2526Ce7b886C345bAa, 1 ether, 2000000000);
        addHolding(0x6680fb3FC138e16bcf0733f543061a62d5027eB3, 1 ether, 2000000000);
        addHolding(0x386fe90DC4D8533Ef63C081d60fb5AA1C7f59e82, 1 ether, 2000000000);
        addHolding(0x825F9C66df8F76Fd2bC167Dd7269077287734ee9, 1 ether, 2000000000);
        addHolding(0x249D3aB5C49F05DDBcd167Fe7C9F8e900B48E36c, 1 ether, 2000000000);
        addHolding(0x932EE9272a3b3b90881b1746D39e80A70EaFF2D1, 1 ether, 2000000000);
        addHolding(0xE1f0b7728aCd6eF078419b4ef411d5758F5FA523, 1 ether, 2000000000);
        addHolding(0x0139b8c77Eff63557EE6aD6264cf85583b8DD5f0, 1 ether, 2000000000);
        addHolding(0x13d68CeDE1AD192F6337A92a55303E1B8290f22C, 1 ether, 2000000000);
        addHolding(0x44De654922005faAdDec455CAf3300e47726e61E, 1 ether, 2000000000);
        addHolding(0x8d0af452d1cc26a0c984AeB42Ebd35D44B10cC16, 1 ether, 2000000000);
        addHolding(0x2E644ef1cC6a9c8858d6af3eF34AE210214ab850, 1 ether, 2000000000);
        addHolding(0x2cd10e8d54B9e4C961D75eaBCCEfC52563340469, 1 ether, 2000000000);
        addHolding(0x44AbAD0BCE9b4f54102eCBecC6B8C3AC52202FE6, 1 ether, 2000000000);
        addHolding(0xa55403af543Ccf5451F175ec80590F7A24400322, 1 ether, 2000000000);
        addHolding(0x3402666e7B3BeB5fe676f23160CF29B7857151D5, 1 ether, 2000000000);
        addHolding(0x70559296399dF409575b8b75db327Be134196aec, 1 ether, 2000000000);
        addHolding(0x2C0c77f06B58B556690BA4ccb3b3f0fCBBdb970E, 1 ether, 2000000000);
        addHolding(0xD13b5e54E29209A8CA299C98bbBB7E13dd645B04, 1 ether, 2000000000);
        addHolding(0xd422F16f6ea6E1f897db148Ce184C792Ecc09eb3, 1 ether, 2000000000);
        addHolding(0xb0Faf2ce1ADB0429601d5bd923033BF3Ae70bC1e, 1 ether, 2000000000);
        addHolding(0x3eEe6999a109E3BB89b2aa6De5Ae6Cbe92828431, 1 ether, 2000000000);
        addHolding(0x17f6D54852b9a91481fD36367Aa8a6eA55445d1f, 1 ether, 2000000000);
        addHolding(0x849CE98304369f96aC6CB0C590E86a1C93807b25, 1 ether, 2000000000);
        addHolding(0x72c3D581FEb6AA97AA9c3cA85687893170eB583A, 1 ether, 2000000000);
        addHolding(0x2F37ab14960DCB537e27A17c90B05cEa87732D17, 1 ether, 2000000000);
        addHolding(0xb4411bD1b35059B1563b3050a942961B6044f411, 1 ether, 2000000000);
        addHolding(0x044bb3C0039467F0DFA23C37ccb8ccb10D20e797, 1 ether, 2000000000);
        addHolding(0x6E048D40dd3F9AEAD5EceA2a62616A56B50adb6E, 1 ether, 2000000000);
        addHolding(0x839Aa90c599a7AE98B16ebBd57555d564844F81f, 1 ether, 2000000000);
        addHolding(0xd4def252df50081E250EB953e2E072cB5F4414F4, 1 ether, 2000000000);
        addHolding(0xdcC06F6c9E223741565a03362EC423e53b99dfB5, 1 ether, 2000000000);
        addHolding(0x65Eba9168CcB9Bd90E7E79d9BB0352956caab3A1, 1 ether, 2000000000);
        addHolding(0x7E3E98419B2312a0ec72Cc2cF69bbCF09d9a38F8, 1 ether, 2000000000);
        addHolding(0x4Da73F66684A9089803b6166FFFF986B29020BDD, 1 ether, 2000000000);
        addHolding(0xbC5567b9fEe001924d285d2F6D1AEb701A60B828, 1 ether, 2000000000);
        addHolding(0x83FB4B46DA7E9229b874B5F8F4673993077B5262, 1 ether, 2000000000);
        addHolding(0x0975d6cE978485bB93D37678C23b8bfe9BDfB3C3, 1 ether, 2000000000);
        addHolding(0x027a5669D63074e60CEab79b85Bd1a13c26393b4, 1 ether, 2000000000);
        addHolding(0x409EA3D4Db28C193E43ca09e9F468e643E95D377, 1 ether, 2000000000);
        addHolding(0x231b6C3851008FDe6ED2b45e91fD4C4917216723, 1 ether, 2000000000);
        addHolding(0xc1A688870ED324A664e51B8195c735285Fbe350f, 1 ether, 2000000000);
        addHolding(0xD534082171D1ec16f1423027b1F1CB86ab39459D, 1 ether, 2000000000);
        addHolding(0xb4Ba333Ff2b8eC8f73e3AEc6842FDf94341212E7, 1 ether, 2000000000);
        addHolding(0xA9fAFc9CC9C0bF2058d4B4B0fF0E5385E5a6041b, 1 ether, 2000000000);
        addHolding(0x558ff24a4BD534383E70C723A11ACE15baCbe06F, 1 ether, 2000000000);
        addHolding(0x5945e6588cea2F6883DEE70484f7d17fD21aBaa1, 1 ether, 2000000000);
        addHolding(0xf679b9a6D1D7735cC697f23485E100f1b52530C8, 1 ether, 2000000000);
        addHolding(0x834E24559FAdE6b940B31Cff775ad21Dbfb24FB5, 1 ether, 2000000000);
    } 
    // solhint-enable function-max-lines

    /// @notice Adds a holding entry
    /// @param holder owner of the holded funds
    /// @param amountToHold the amount that should be holded
    /// @param lockUntil the timestamp of the date until the funds should be locked up
    function addHolding(address holder, uint256 amountToHold, uint256 lockUntil) 
        internal
    {
        Holder storage selectedHolder = holders[address(holder)];

        require(
            selectedHolder.availableAmount == 0 && selectedHolder.lockedUntilBlocktimestamp == 0,
            "Holding for this address was already set."
        );

        initialLockedUpAmount += amountToHold;
        
        selectedHolder.availableAmount = amountToHold;
        selectedHolder.lockedUntilBlocktimestamp = lockUntil;
    }
}
