let RewardContract = artifacts.require('./mockcontracts/MockReward.sol');
let MockSystem = artifacts.require('./mockcontracts/MockSystem.sol');

const {
    assertThrowsAsync,
    REVERT_ERROR_MSG,
    DEFAULT_ADDRESS,
    SYSTEM_ADDRESS,
    EMPTY_BYTES32
} = require(__dirname + "/../utils.js");

const { calculateBlockReward } = require(__dirname + "/blockreward_function.js");

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bn')(web3.utils.BN))
    .should();

let rewardContract;
let validators;
let validatorPayoutAddresses;
let communityFund;
let communityFundPayoutAddress;
let system;

let communityFundAmount;
let testBlockRewardAmount;

contract('BlockReward [all features]', function (accounts) {

    async function basicSetup() {
        deployer = accounts[0];
        communityFund = accounts[9];
        communityFundPayoutAddress = accounts[8];
        system = accounts[7];

        communityFundAmount = web3.utils.toWei("1", "ether");
        testBlockRewardAmount = 5;

        validators = [accounts[1], accounts[2], accounts[3], accounts[4]];
        validatorPayoutAddresses = [accounts[5], accounts[6], DEFAULT_ADDRESS, DEFAULT_ADDRESS];

        rewardContract = await RewardContract.new(communityFund, communityFundAmount, { from: deployer })
            .should.be.fulfilled;

        await rewardContract.setSystemAddress(system, { from: deployer })
            .should.be.fulfilled;
    }

    describe("constructor", async function () {

        beforeEach(async function () {
            await basicSetup();
        });

        it("should set community fund address correctly", async function () {
            (await rewardContract.communityFund.call()).should.be.equal(communityFund);
            rewardContract = await RewardContract.new(accounts[3], 0, { from: deployer })
                .should.be.fulfilled;
            (await rewardContract.communityFund.call()).should.be.equal(accounts[3]);
        });

        it("should allow to set community fund address to 0x0 (burn)", async function () {
            rewardContract = await RewardContract.new(DEFAULT_ADDRESS, 0, { from: deployer })
                .should.be.fulfilled;
            (await rewardContract.communityFund.call()).should.be.equal(DEFAULT_ADDRESS);
        });

        it("should set community fund amount correctly", async function () {
            let expected = communityFundAmount;
            (await rewardContract.communityFundAmount.call()).toString(10).should.be.equal(expected);

            expected = "87572";
            rewardContract = await RewardContract.new(DEFAULT_ADDRESS, expected, { from: deployer })
                .should.be.fulfilled;
            (await rewardContract.communityFundAmount.call()).toString(10).should.be.equal(expected);

            expected = 0;
            rewardContract = await RewardContract.new(communityFund, 0, { from: deployer })
                .should.be.fulfilled;
            (await rewardContract.communityFundAmount.call()).toNumber(10).should.be.equal(expected);
        });
    });

    describe("#setCommunityFund", async function () {

        beforeEach(async function () {
            await basicSetup();
        });

        it("should set community fund address correctly", async function () {
            await rewardContract.setCommunityFund(accounts[4], { from: communityFund })
                .should.be.fulfilled;
            (await rewardContract.communityFund.call()).should.be.equal(accounts[4]);
        });

        it("should allow only the community fund to set its own address", async function () {
            await rewardContract.setCommunityFund(accounts[2], { from: accounts[3] })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
            await rewardContract.setCommunityFund(system, { from: system })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
            await rewardContract.setCommunityFund(accounts[5], { from: accounts[6] })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
            (await rewardContract.communityFund.call()).should.be.equal(communityFund);
            await rewardContract.setCommunityFund(accounts[0], { from: communityFund })
                .should.be.fulfilled;
            (await rewardContract.communityFund.call()).should.be.equal(accounts[0]);
            await rewardContract.setCommunityFund(accounts[0], { from: communityFund })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
            await rewardContract.setCommunityFund(communityFund, { from: accounts[0] })
                .should.be.fulfilled;
            (await rewardContract.communityFund.call()).should.be.equal(communityFund);

        });

        it("should allow the community fund to set the address to 0x0 (burn)", async function () {
            await rewardContract.setCommunityFund(DEFAULT_ADDRESS, { from: communityFund })
                .should.be.fulfilled;
            (await rewardContract.communityFund.call()).should.be.equal(DEFAULT_ADDRESS);
        });
    });

    describe("#setPayoutAddress", async function () {

        beforeEach(async function () {
            await basicSetup();
        });

        it("should set the payout addresses correctly", async function () {
            for (let i = 0; i < validators.length; i++) {
                if (validatorPayoutAddresses[i] !== DEFAULT_ADDRESS) {
                    await rewardContract.setPayoutAddress(validatorPayoutAddresses[i], { from: validators[i] })
                        .should.be.fulfilled;
                }
            }

            for (let i = 0; i < validators.length; i++) {
                (await rewardContract.payoutAddresses.call(validators[i]))
                    .should.be.equal(validatorPayoutAddresses[i]);
            }
        });

        it("should allow to set payout address to 0x0", async function () {
            for (let i = 2; i < validators.length; i++) {
                await rewardContract.setPayoutAddress(validatorPayoutAddresses[i], { from: validators[i] })
                    .should.be.fulfilled;
            }

            for (let i = 2; i < validators.length; i++) {
                (await rewardContract.payoutAddresses.call(validators[i]))
                    .should.be.equal(validatorPayoutAddresses[i]);
            }
        });

        it("should leave the payout address at 0x0 by default", async function () {
            for (let i = 0; i < accounts.length; i++) {
                (await rewardContract.payoutAddresses.call(accounts[i]))
                    .should.be.equal(DEFAULT_ADDRESS);
            }
        });
    });

    describe("#resetPayoutAddress", async function () {

        beforeEach(async function () {
            await basicSetup();
        });

        it("should reset the payout address to 0x0", async function () {
            for (let i = 0; i < accounts.length; i++) {
                await rewardContract.setPayoutAddress(accounts[accounts.length - 1 - i], { from: accounts[i] })
                    .should.be.fulfilled;
            }

            for (let i = 0; i < accounts.length; i++) {
                (await rewardContract.payoutAddresses.call(accounts[i]))
                    .should.be.equal(accounts[accounts.length - 1 - i]);
            }

            for (let i = 0; i < accounts.length; i++) {
                await rewardContract.resetPayoutAddress({ from: accounts[i] })
                    .should.be.fulfilled;
            }

            for (let i = 0; i < accounts.length; i++) {
                (await rewardContract.payoutAddresses.call(accounts[i]))
                    .should.be.equal(DEFAULT_ADDRESS);
            }
        });
    });

    describe("#reward", async function () {

        beforeEach(async function () {
            await basicSetup();
            systemContract = await MockSystem.new(rewardContract.address, { from: deployer }).should.be.fulfilled;
        });

        it("should only be called by SYSTEM", async function () {
            await rewardContract.reward([accounts[1]], [0], { from: accounts[3] })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
            await rewardContract.reward([communityFund], [0], { from: communityFund })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
            await rewardContract.reward([deployer], [0], { from: deployer })
                .should.be.rejectedWith(REVERT_ERROR_MSG);

            await rewardContract.reward([accounts[1]], [0], { from: system })
                .should.be.fulfilled;
        });

        // needs verification by POA and Parity
        it("should only be called with block author as beneficiary", async function () {
            for (let i = 1; i < 151; i++) {
                await rewardContract.reward([accounts[i % accounts.length]], [i], { from: system })
                    .should.be.rejectedWith(REVERT_ERROR_MSG);
            }

            await rewardContract.reward([accounts[1]], [0], { from: system })
                .should.be.fulfilled;
        });

        // needs verification by POA and Parity
        it("should only be called if beneficiary and kind arrays match in length", async function () {
            for (let i = 1; i < 151; i++) {
                await rewardContract.reward([accounts[i % accounts.length]], [i], { from: system })
                    .should.be.rejectedWith(REVERT_ERROR_MSG);
            }

            await rewardContract.reward([accounts[1]], [0], { from: system })
                .should.be.fulfilled;
        });

        // needs verification by POA and Parity
        it("should only be called if beneficiary array length is one, thus the block author", async function () {
            for (let i = 2; i < 10; i++) {
                await rewardContract.reward(
                    (new Array(i)).map((x, j) => accounts[i]),
                    [0],
                    { from: system }
                ).should.be.rejectedWith(REVERT_ERROR_MSG);
            }

            for (let i = 2; i < 10; i++) {
                await rewardContract.reward(
                    (new Array(i)).map((x, j) => accounts[j]),
                    [0],
                    { from: system }
                ).should.be.rejectedWith(REVERT_ERROR_MSG);
            }

            for (let i = 2; i < 10; i++) {
                await rewardContract.reward(
                    [accounts[i]],
                    (new Array(i)).fill(0),
                    { from: system }
                ).should.be.rejectedWith(REVERT_ERROR_MSG);
            }

            await rewardContract.reward([accounts[1]], [0], { from: system })
                .should.be.fulfilled;
        });

        // needs verification by POA and Parity
        it("should return empty arrays only if the beneficiary address is 0x0", async function () {
            await rewardContract.setSystemAddress(systemContract.address).should.be.fulfilled;

            const cases = [accounts[1], DEFAULT_ADDRESS, accounts[2], accounts[3], DEFAULT_ADDRESS];

            let expected = [[], []];
            const { logs } = await systemContract.rewardWithEvent(
                [DEFAULT_ADDRESS],
                [0],
                { from: deployer }
            ).should.be.fulfilled;
            await checkRewarded(logs, expected);

            for (let i = 0; i < cases.length; i++) {
                expected = (cases[i] == DEFAULT_ADDRESS) ? [[], []] : [
                    [cases[i], communityFund],
                    [calculateBlockReward((await web3.eth.getBlockNumber()) + 1), communityFundAmount]
                ];
                const { logs } = await systemContract.rewardWithEvent(
                    [cases[i]],
                    [0],
                    { from: deployer }
                ).should.be.fulfilled;
                await checkRewarded(logs, expected);
            }
        });

        it("should return arrays with length 2 on a successful call", async function () {
            await rewardContract.setSystemAddress(systemContract.address).should.be.fulfilled;

            const { logs } = await systemContract.rewardWithEvent(
                [accounts[1]],
                [0],
                { from: deployer }
            ).should.be.fulfilled;
            logs[0].args.rewards.length.should.be.equal(2);
            logs[0].args.receivers.length.should.be.equal(logs[0].args.rewards.length);
        });

        it("should mint tokens for the beneficiary if payout address is not specified", async function () {
            await rewardContract.setSystemAddress(systemContract.address).should.be.fulfilled;

            for (let i = 0; i < accounts.length; i++) {
                expected = [
                    [accounts[i], communityFund],
                    [calculateBlockReward((await web3.eth.getBlockNumber()) + 1), communityFundAmount]
                ];

                (await rewardContract.payoutAddresses.call(accounts[i]))
                    .should.be.equal(DEFAULT_ADDRESS);

                const { logs } = await systemContract.rewardWithEvent(
                    [accounts[i]],
                    [0],
                    { from: deployer }
                ).should.be.fulfilled;
                await checkRewarded(logs, expected);
            }
        });

        it("should mint tokens for the beneficiary's payout address if it is specified", async function () {
            await rewardContract.setSystemAddress(systemContract.address).should.be.fulfilled;

            for (let i = 0; i < validators.length; i++) {
                await rewardContract.setPayoutAddress(validatorPayoutAddresses[i], { from: validators[i] })
                    .should.be.fulfilled;
            }

            for (let i = 0; i < validators.length; i++) {
                (await rewardContract.payoutAddresses.call(validators[i]))
                    .should.be.equal(validatorPayoutAddresses[i]);
            }

            for (let i = 0; i < validators.length; i++) {
                expected = [
                    [validatorPayoutAddresses[i], communityFund].map((x) => x === DEFAULT_ADDRESS ? validators[i] : x),
                    [calculateBlockReward((await web3.eth.getBlockNumber()) + 1), communityFundAmount]
                ];
                const { logs } = await systemContract.rewardWithEvent(
                    [validators[i]],
                    [0],
                    { from: deployer }
                ).should.be.fulfilled;
                await checkRewarded(logs, expected);
            }
        });

        it("should always mint tokens for the community fund if its payout address is not specified", async function () {
            await rewardContract.setSystemAddress(systemContract.address).should.be.fulfilled;

            for (let i = 0; i < accounts.length; i++) {
                expected = [
                    [accounts[i], communityFund],
                    [calculateBlockReward((await web3.eth.getBlockNumber()) + 1), communityFundAmount]
                ];

                (await rewardContract.payoutAddresses.call(communityFund))
                    .should.be.equal(DEFAULT_ADDRESS);

                const { logs } = await systemContract.rewardWithEvent(
                    [accounts[i]],
                    [0],
                    { from: deployer }
                ).should.be.fulfilled;
                await checkRewarded(logs, expected);
            }
        });

        it("should always mint tokens for the community fund's payout address if it is specified", async function () {
            await rewardContract.setSystemAddress(systemContract.address).should.be.fulfilled;

            for (let i = 0; i < accounts.length; i++) {

                await rewardContract.setPayoutAddress(accounts[i], { from: communityFund })
                    .should.be.fulfilled;

                communityFundPayoutAddress = accounts[i];

                (await rewardContract.payoutAddresses.call(communityFund))
                    .should.be.equal(communityFundPayoutAddress);

                expected = [
                    [accounts[i], communityFundPayoutAddress],
                    [calculateBlockReward((await web3.eth.getBlockNumber()) + 1), communityFundAmount]
                ];

                const { logs } = await systemContract.rewardWithEvent(
                    [accounts[i]],
                    [0],
                    { from: deployer }
                ).should.be.fulfilled;
                await checkRewarded(logs, expected);
            }
        });

        it("should return the correct amount for the community fund", async function () {
            for (let j = 0; j < 100000000; j += 10000000) {
                communityFundAmount = j;
                rewardContract = await RewardContract.new(communityFund, communityFundAmount, { from: deployer })
                    .should.be.fulfilled;
                await rewardContract.setSystemAddress(systemContract.address, { from: deployer })
                    .should.be.fulfilled;
                await systemContract.setRewardContract(rewardContract.address, { from: deployer })
                    .should.be.fulfilled;

                for (let i = 0; i < accounts.length / 2; i++) {
                    expected = [
                        [accounts[i], communityFund],
                        [calculateBlockReward((await web3.eth.getBlockNumber()) + 1), communityFundAmount]
                    ];
                    const { logs } = await systemContract.rewardWithEvent(
                        [accounts[i]],
                        [0],
                        { from: deployer }
                    ).should.be.fulfilled;
                    await checkRewarded(logs, expected);
                }
            }
        });

        // TODO waiting for finalized figures
        it("should return empty arrays after reaching the 10 year limit for both the fund and authors", async function () {

        });
    });

    describe("logging reward statistics", async function () {

        let totalBlockRewardCounter;
        let totalCommunityCounter;
        let mintedForAccount;
        let mintedForCommunity;
        let mintedInBlock;
        let blocknumStart;
        let blockNumEnd;

        // I run this once before all tests
        before(async function () {
            await basicSetup();
            await rewardContract.setSystemAddress(systemContract.address).should.be.fulfilled;
            await systemContract.setRewardContract(rewardContract.address, { from: deployer })
                .should.be.fulfilled;

            totalBlockRewardCounter = new web3.utils.BN("0");
            totalCommunityCounter = new web3.utils.BN("0");
            let bnCFundAmount = new web3.utils.BN(communityFundAmount);

            mintedForAccount = {};
            mintedForCommunity = {
                total: new web3.utils.BN("0")
            };
            mintedInBlock = {};

            let acc;
            let currentBlockReward;
            let blockNumber;

            for (let i = 0; i < accounts.length; i++) {
                mintedForAccount[accounts[i]] = {
                    total: new web3.utils.BN("0")
                };
                mintedForCommunity[accounts[i]] = new web3.utils.BN("0");
            }

            blocknumStart = await web3.eth.getBlockNumber() + 1;
            for (let i = 0; i < 100; i++) {
                acc = accounts[i % 10];
                blockNumber = await web3.eth.getBlockNumber();

                expected = [
                    [acc, communityFund],
                    [calculateBlockReward(blockNumber + 1), communityFundAmount]
                ];

                // pre-calculate the block reward
                currentBlockReward = new web3.utils.BN(calculateBlockReward(blockNumber + 1).toString(10));
                
                // increase counter values
                totalBlockRewardCounter.iadd(currentBlockReward);
                totalCommunityCounter.iadd(bnCFundAmount);

                mintedInBlock[blockNumber + 1] = bnCFundAmount.add(currentBlockReward);

                mintedForAccount[acc].total.iadd(currentBlockReward);
                mintedForAccount[acc][blockNumber + 1] = currentBlockReward.clone();
                mintedForAccount[communityFund].total.iadd(bnCFundAmount);

                mintedForCommunity[communityFund].iadd(bnCFundAmount);
                mintedForCommunity.total.iadd(bnCFundAmount);

                if (mintedForAccount[communityFund][blockNumber + 1] == undefined) {
                    mintedForAccount[communityFund][blockNumber + 1] = bnCFundAmount.clone(); 
                } else {
                    mintedForAccount[communityFund][blockNumber + 1].iadd(bnCFundAmount);
                }

                const { logs } = await systemContract.rewardWithEvent(
                    [acc],
                    [0],
                    { from: deployer }
                ).should.be.fulfilled;
                await checkRewarded(logs, expected);
            }
            blockNumEnd = await web3.eth.getBlockNumber();
            console.log(blocknumStart, blockNumEnd);
        });

        it("should set TOTAL_MINTED correctly", async function () {
            let total = await rewardContract.mintedTotally.call();
            total.should.be.bignumber.equal(totalBlockRewardCounter.add(totalCommunityCounter));
        });

        it("should match TOTAL_MINTED to the sum of individual MINTED_FOR_ACCOUNTs", async function () {
            let total = await rewardContract.mintedTotally.call();

            let expected = new web3.utils.BN("0");
            let mForAccounts = new web3.utils.BN("0");
            let mAcc;
            for (let i = 0; i < accounts.length; i++) {
                mAcc = await rewardContract.mintedForAccount.call(accounts[i]);
                mintedForAccount[accounts[i]].total.should.be.bignumber.equal(mAcc);
                expected.iadd(mintedForAccount[accounts[i]].total);
                mForAccounts.iadd(mAcc);
            }
            expected.should.be.bignumber.equal(total);
            expected.should.be.bignumber.equal(mForAccounts);
        });

        it("should match TOTAL_MINTED to the sum of individual MINTED_IN_BLOCKs", async function () {
            let total = await rewardContract.mintedTotally.call();

            let expected = new web3.utils.BN("0");
            let mInBlocks = new web3.utils.BN("0");
            let mBl;

            for (let j = blocknumStart; j <= blockNumEnd; j++) {
                mBl = await rewardContract.mintedInBlock.call(j);
                mintedInBlock[j].should.be.bignumber.equal(mBl);
                expected.iadd(mintedInBlock[j]);
                mInBlocks.iadd(mBl);
            }
            expected.should.be.bignumber.equal(mInBlocks);
            expected.should.be.bignumber.equal(total);
        });

        it("should match MINTED_FOR_ACCOUNTs to sum of corresponding MINTED_FOR_ACCOUNT_IN_BLOCKs", async function () {
            let total = await rewardContract.mintedTotally.call();

            let expected = new web3.utils.BN("0");
            let m4acc;

            for (let i = 0; i < accounts.length; i++) {
                m4acc = await rewardContract.mintedForAccount.call(accounts[i]);
                let m4AccInBs = new web3.utils.BN("0");
                let accInBlock;
                let testTo;
                for (let j = blocknumStart; j <= blockNumEnd; j++) {
                    accInBlock = await rewardContract.mintedForAccountInBlock.call(accounts[i], j);
                    testTo = mintedForAccount[accounts[i]][j];
                    accInBlock.should.be.bignumber.equal(testTo ? testTo : "0");
                    expected.iadd(accInBlock);
                    m4AccInBs.iadd(accInBlock);
                }
                m4acc.should.be.bignumber.equal(m4AccInBs);
            }
            total.should.be.bignumber.equal(expected);
        });

        it("should match MINTED_IN_BLOCKs to the sum of corresponding MINTED_FOR_ACCOUNT_IN_BLOCKs", async function () {
            let total = await rewardContract.mintedTotally.call();

            let expected = new web3.utils.BN("0");
            let mInBlock;

            for (let j = blocknumStart; j <= blockNumEnd; j++) {
                mInBlock = await rewardContract.mintedInBlock.call(j);
                let m4accsInB = new web3.utils.BN("0");
                let m4acc;
                for (let i = 0; i < accounts.length; i++) {    
                    m4acc = await rewardContract.mintedForAccountInBlock.call(accounts[i], j);
                    testTo = mintedForAccount[accounts[i]][j];
                    m4acc.should.be.bignumber.equal(testTo ? testTo : "0");
                    m4accsInB.iadd(m4acc);
                }
                m4accsInB.should.be.bignumber.equal(mInBlock);
                expected.iadd(mInBlock);
            }
            total.should.be.bignumber.equal(expected);
        });

        it("should match MINTED_FOR_COMMUNITY to the sum of individual MINTED_FOR_COMMUNITY_FOR_ACCOUNTs", async function () {
            let totalCommunity = await rewardContract.mintedForCommunity.call();

            let totalM4acc = new web3.utils.BN("0");
            let m4acc;
            for (let i = 0; i < accounts.length; i++) {    
                m4acc = await rewardContract.mintedForCommunityForAccount.call(accounts[i]);
                m4acc.should.be.bignumber.equal(mintedForCommunity[accounts[i]]);
                totalM4acc.iadd(m4acc);
            }
            totalCommunity.should.be.bignumber.equal(totalM4acc);
            totalCommunity.should.be.bignumber.equal(mintedForCommunity.total);
        });
    });
});

async function checkRewarded(logs, _expected) {
    logs[0].event.should.be.equal('Rewarded');
    logs[0].args.receivers.length.should.be.equal(logs[0].args.rewards.length);
    logs[0].args.receivers.should.be.deep.equal(_expected[0]);

    if (_expected[1].length === 0) {
        logs[0].args.rewards.should.be.deep.equal(_expected[1]);
        return;
    }
    _expected[1] = _expected[1].map((x) => x.toString(10));
    logs[0].args.rewards[0].toString(10).should.be.equal(_expected[1][0]);
    logs[0].args.rewards[1].toString(10).should.be.equal(_expected[1][1]);
}
