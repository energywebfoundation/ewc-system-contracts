let RewardContract = artifacts.require('./mockcontracts/MockReward.sol');
let MockInitialRewardCurveContract = artifacts.require('./mockcontracts/MockInitialRewardCurve.sol');
let MockSystem = artifacts.require('./mockcontracts/MockSystem.sol');

const {
    REVERT_ERROR_MSG,
    DEFAULT_ADDRESS,
    SYSTEM_ADDRESS,
    createSnapshot,
    revertSnapshot,
    send
} = require(__dirname + "/../utils.js");

const CURVE_LEN_ERR = "Reward curve is not the required length";
const NOT_SYS_ERR = "Caller is not the system";
const NOT_CFUND_ERR = "Caller is not the community fund";
const BENEF_SIZE_ERR = "Benefactors list length is not 1";
const BENEF_SIZE_MISMATCH_ERR = "Benefactors/types list length differs";
const BENEF_KIND_ERR = "Benefactor is not the block author";

const testCurveProvider = new (require(__dirname + "/blockreward_function.js"))(web3);

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

contract('BlockReward [all features]', function (accounts) {

    async function basicSetup() {
        deployer = accounts[0];
        communityFund = accounts[9];
        communityFundPayoutAddress = accounts[8];
        system = accounts[7];

        communityFundAmount = web3.utils.toWei("1", "ether");

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

        it("should not allow to deploy with an S curve with length not equal 120", async function () {
            rewardContract = await MockInitialRewardCurveContract.new(accounts[3], 0, { from: deployer })
                .should.be.rejectedWith(CURVE_LEN_ERR);
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
                .should.be.rejectedWith(NOT_CFUND_ERR);
            await rewardContract.setCommunityFund(system, { from: system })
                .should.be.rejectedWith(NOT_CFUND_ERR);
            await rewardContract.setCommunityFund(accounts[5], { from: accounts[6] })
                .should.be.rejectedWith(NOT_CFUND_ERR);
            (await rewardContract.communityFund.call()).should.be.equal(communityFund);

            await rewardContract.setCommunityFund(accounts[0], { from: communityFund })
                .should.be.fulfilled;
            (await rewardContract.communityFund.call()).should.be.equal(accounts[0]);
            await rewardContract.setCommunityFund(accounts[0], { from: communityFund })
                .should.be.rejectedWith(NOT_CFUND_ERR);

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
                .should.be.rejectedWith(NOT_SYS_ERR);
            await rewardContract.reward([communityFund], [0], { from: communityFund })
                .should.be.rejectedWith(NOT_SYS_ERR);
            await rewardContract.reward([deployer], [0], { from: deployer })
                .should.be.rejectedWith(NOT_SYS_ERR);

            await rewardContract.reward([accounts[1]], [0], { from: system })
                .should.be.fulfilled;
        });

        it("should only be called with block author as beneficiary", async function () {
            for (let i = 1; i < 151; i++) {
                await rewardContract.reward([accounts[i % accounts.length]], [i], { from: system })
                    .should.be.rejectedWith(BENEF_KIND_ERR);
            }
            await rewardContract.reward([accounts[1]], [0], { from: system })
                .should.be.fulfilled;
        });

        it("should only be called if beneficiary and kind arrays match in length", async function () {
            for (let i = 2; i < 10; i++) {
                await rewardContract.reward(
                    (new Array(i)).fill().map((x, j) => accounts[i]),
                    [0],
                    { from: system }
                ).should.be.rejectedWith(BENEF_SIZE_MISMATCH_ERR);
            }

            for (let i = 2; i < 10; i++) {
                await rewardContract.reward(
                    (new Array(i)).fill().map((x, j) => accounts[j]),
                    [0],
                    { from: system }
                ).should.be.rejectedWith(BENEF_SIZE_MISMATCH_ERR);
            }

            for (let i = 2; i < 10; i++) {
                await rewardContract.reward(
                    [accounts[i]],
                    (new Array(i)).fill(0),
                    { from: system }
                ).should.be.rejectedWith(BENEF_SIZE_MISMATCH_ERR);
            }

            await rewardContract.reward([accounts[1]], [0], { from: system })
                .should.be.fulfilled;
        });

        it("should only be called if benefactors array length is one", async function () {
            for (let i = 2; i < 10; i++) {
                await rewardContract.reward(
                    (new Array(i)).fill().map((x, j) => accounts[j]),
                    (new Array(i)).fill(0),
                    { from: system }
                ).should.be.rejectedWith(BENEF_SIZE_ERR);
            }
            for (let i = 2; i < 10; i++) {
                await rewardContract.reward(
                    [accounts[i]],
                    [0],
                    { from: system }
                ).should.be.fulfilled;
            }
        });

        it("should only be called if beneficiary is the block author", async function () {
            for (let i = 1; i < 151; i++) {
                await rewardContract.reward([accounts[i % accounts.length]], [i], { from: system })
                    .should.be.rejectedWith(BENEF_KIND_ERR);
            }
            for (let i = 0; i < accounts.length; i++) {
                await rewardContract.reward([accounts[i]], [0], { from: system })
                    .should.be.fulfilled;
            }
        });

        it("should return empty arrays if the beneficiary address is 0x0", async function () {
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
                    [testCurveProvider.calculateBlockReward((await web3.eth.getBlockNumber()) + 1), communityFundAmount]
                ];
                const { logs } = await systemContract.rewardWithEvent(
                    [cases[i]],
                    [0],
                    { from: deployer }
                ).should.be.fulfilled;
                await checkRewarded(logs, expected);
            }
        });

        it("should return empty arrays if the block reward period is over", async function () {
            await rewardContract.setSystemAddress(systemContract.address).should.be.fulfilled;

            let expected = [
                [validators[0], communityFund],
                [testCurveProvider.calculateBlockReward((await web3.eth.getBlockNumber()) + 1), communityFundAmount]
            ];
            const { logs } = await systemContract.rewardWithEvent(
                [validators[0]],
                [0],
                { from: deployer }
            ).should.be.fulfilled;
            await checkRewarded(logs, expected);

            await rewardContract.setRewardPeriodLimit(await web3.eth.getBlockNumber() + 1, { from: deployer });

            for (let i = 0; i < validators.length; i++) {
                expected = [[], []];
                const { logs } = await systemContract.rewardWithEvent(
                    [validators[i]],
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
                    [testCurveProvider.calculateBlockReward((await web3.eth.getBlockNumber()) + 1), communityFundAmount]
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
                    [testCurveProvider.calculateBlockReward((await web3.eth.getBlockNumber()) + 1), communityFundAmount]
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
                    [testCurveProvider.calculateBlockReward((await web3.eth.getBlockNumber()) + 1), communityFundAmount]
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
                    [testCurveProvider.calculateBlockReward((await web3.eth.getBlockNumber()) + 1), communityFundAmount]
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
                        [testCurveProvider.calculateBlockReward((await web3.eth.getBlockNumber()) + 1), communityFundAmount]
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
            // 50 is arbitrarily chosen
            for (let i = 0; i < 50; i++) {
                acc = accounts[i % 10];
                blockNumber = await web3.eth.getBlockNumber();

                expected = [
                    [acc, communityFund],
                    [testCurveProvider.calculateBlockReward(blockNumber + 1), communityFundAmount]
                ];

                // pre-calculate the block reward
                currentBlockReward = new web3.utils.BN(testCurveProvider.calculateBlockReward(blockNumber + 1).toString(10));

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
        });

        it("should set TOTAL_MINTED correctly", async function () {
            let total = await rewardContract.mintedTotally.call();
            total.should.be.bignumber.equal(totalBlockRewardCounter.add(totalCommunityCounter));
        });

        it("should match TOTAL_MINTED to the sum of individual MINTED_FOR_ACCOUNTs", async function () {
            let total = await rewardContract.mintedTotally.call();

            let expectedTotal = new web3.utils.BN("0");
            let mForAccounts = new web3.utils.BN("0");
            let minForAcc;
            for (let i = 0; i < accounts.length; i++) {
                minForAcc = await rewardContract.mintedForAccount.call(accounts[i]);
                mintedForAccount[accounts[i]].total.should.be.bignumber.equal(minForAcc);
                expectedTotal.iadd(mintedForAccount[accounts[i]].total);
                mForAccounts.iadd(minForAcc);
            }
            total.should.be.bignumber.equal(expectedTotal);
            mForAccounts.should.be.bignumber.equal(expectedTotal);
        });

        it("should match TOTAL_MINTED to the sum of individual MINTED_IN_BLOCKs", async function () {
            let total = await rewardContract.mintedTotally.call();

            let expectedTotal = new web3.utils.BN("0");
            let mInBlocks = new web3.utils.BN("0");
            let minBlock;

            for (let j = blocknumStart; j <= blockNumEnd; j++) {
                minBlock = await rewardContract.mintedInBlock.call(j);
                mintedInBlock[j].should.be.bignumber.equal(minBlock);
                expectedTotal.iadd(mintedInBlock[j]);
                mInBlocks.iadd(minBlock);
            }
            mInBlocks.should.be.bignumber.equal(expectedTotal);
            total.should.be.bignumber.equal(expectedTotal);
        });

        it("should match MINTED_FOR_ACCOUNTs to sum of corresponding MINTED_FOR_ACCOUNT_IN_BLOCKs", async function () {
            let total = await rewardContract.mintedTotally.call();

            let expectedTotal = new web3.utils.BN("0");
            let minForAcc;

            for (let i = 0; i < accounts.length; i++) {
                minForAcc = await rewardContract.mintedForAccount.call(accounts[i]);
                let minForAccInBlocks = new web3.utils.BN("0");
                let minForAccInBlock;
                let testTo;
                for (let j = blocknumStart; j <= blockNumEnd; j++) {
                    minForAccInBlock = await rewardContract.mintedForAccountInBlock.call(accounts[i], j);
                    testTo = mintedForAccount[accounts[i]][j];
                    minForAccInBlock.should.be.bignumber.equal(testTo ? testTo : "0");
                    expectedTotal.iadd(minForAccInBlock);
                    minForAccInBlocks.iadd(minForAccInBlock);
                }
                minForAcc.should.be.bignumber.equal(minForAccInBlocks);
            }
            total.should.be.bignumber.equal(expectedTotal);
        });

        it("should match MINTED_IN_BLOCKs to the sum of corresponding MINTED_FOR_ACCOUNT_IN_BLOCKs", async function () {
            let total = await rewardContract.mintedTotally.call();

            let expectedTotal = new web3.utils.BN("0");
            let mInBlock;

            for (let j = blocknumStart; j <= blockNumEnd; j++) {
                mInBlock = await rewardContract.mintedInBlock.call(j);
                let minForAccsInBlock = new web3.utils.BN("0");
                let minForAcc;
                for (let i = 0; i < accounts.length; i++) {
                    minForAcc = await rewardContract.mintedForAccountInBlock.call(accounts[i], j);
                    testTo = mintedForAccount[accounts[i]][j];
                    minForAcc.should.be.bignumber.equal(testTo ? testTo : "0");
                    minForAccsInBlock.iadd(minForAcc);
                }
                minForAccsInBlock.should.be.bignumber.equal(mInBlock);
                expectedTotal.iadd(mInBlock);
            }
            total.should.be.bignumber.equal(expectedTotal);
        });

        it("should match MINTED_FOR_COMMUNITY to the sum of individual MINTED_FOR_COMMUNITY_FOR_ACCOUNTs", async function () {
            let totalCommunity = await rewardContract.mintedForCommunity.call();

            let totalMinForAccs = new web3.utils.BN("0");
            let minForCommForAcc;
            for (let i = 0; i < accounts.length; i++) {
                minForCommForAcc = await rewardContract.mintedForCommunityForAccount.call(accounts[i]);
                minForCommForAcc.should.be.bignumber.equal(mintedForCommunity[accounts[i]]);
                totalMinForAccs.iadd(minForCommForAcc);
            }
            totalCommunity.should.be.bignumber.equal(totalMinForAccs);
            totalCommunity.should.be.bignumber.equal(mintedForCommunity.total);
        });
    });

    describe("#checkRewardPeriodEnded", async function () {

        beforeEach(async function () {
            await basicSetup();
        });

        it("should return false before the reward period", async function () {
            const expected = false;
            (await rewardContract.checkRewardPeriodEnded.call()).should.be.equal(expected);
        });

        it("should return true only at the end + after the reward period", async function () {
            const expected = true;
            (await rewardContract.checkRewardPeriodEnded.call()).should.be.equal(false);
            await rewardContract.setRewardPeriodLimit(await web3.eth.getBlockNumber() + 1, { from: deployer });
            (await rewardContract.checkRewardPeriodEnded.call()).should.be.equal(expected);
        });
    });

    describe("#getBlockReward", async function () {

        let rpcId = 1;
        let snapshotID;

        beforeEach(async function () {
            await basicSetup();
        });

        it("should return 0 on blocknumber 0", async function () {
            const expected = testCurveProvider.calculateBlockReward(0);
            const actual = await rewardContract.calcBlockReward.call(0);
            actual.should.be.bignumber.equal(expected);
        });

        it("should return 0 on blocknumber 63072000", async function () {
            const expected = testCurveProvider.calculateBlockReward(63072000);
            const actual = await rewardContract.calcBlockReward.call(63072000);
            actual.should.be.bignumber.equal(expected);
        });

        it("should return 0 on blocknumbers above 63072000", async function () {
            const expected = new web3.utils.BN("0");
            let actual;
            const max = testCurveProvider.maxBlockNumReward.addn(30);
            for (let i = testCurveProvider.maxBlockNumReward.clone(); i.lt(max); i.iaddn(1)) {
                actual = await rewardContract.calcBlockReward.call(i);
                actual.should.be.bignumber.equal(expected);
            }
        });

        it("should return the correct values on edge cases", async function () {
            let expected;
            let actual;
            const max = testCurveProvider.maxBlockNumReward;
            for (let i = new web3.utils.BN("0"); i.lt(max); i.iadd(testCurveProvider.stepSize)) {
                expected = testCurveProvider.calculateBlockReward(i);
                actual = await rewardContract.calcBlockReward.call(i);
                actual.should.be.bignumber.equal(expected);
            }
        });

        it("should return the correct values on randomly selected block numbers", async function () {
            let expected;
            let actual;
            let rnd;
            for (let i = 0; i < 100; i++) {
                rnd = randomIntInc(0, 64000000);
                expected = testCurveProvider.calculateBlockReward(rnd);
                actual = await rewardContract.calcBlockReward.call(rnd);
                actual.should.be.bignumber.equal(expected);
            }
        });

        // Takes forever to run (obviously), just here for display
        xit("should issue the correct reward amount based on the blocknumber", async function () {
            let expected;
            const max = testCurveProvider.maxBlockNumReward;

            systemContract = await MockSystem.new(rewardContract.address, { from: deployer }).should.be.fulfilled;
            await rewardContract.setSystemAddress(systemContract.address).should.be.fulfilled;

            snapshotID = await createSnapshot();

            for (let i = new web3.utils.BN("0"); i.lt(max); i.iadd(testCurveProvider.stepSize.subn(1))) {
                await mineTill(i.toNumber(10));
                expected = [
                    [accounts[4], communityFund],
                    [testCurveProvider.calculateBlockReward((await web3.eth.getBlockNumber()) + 1), communityFundAmount]
                ];
                const { logs } = await systemContract.rewardWithEvent(
                    [accounts[4]],
                    [0],
                    { from: deployer }
                ).should.be.fulfilled;
                await checkRewarded(logs, expected);
            }
            await revertSnapshot(snapshotID, rpcId++);
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

const mineTill = async (_blockNumber) => {
    const diff = _blockNumber - (await web3.eth.getBlockNumber());
    if (diff <= 0) {
        return;
    }
    for (let i = 0; i < diff; i++) {
        await send('evm_mine');
    }
    (await web3.eth.getBlockNumber()).should.be.equal(_blockNumber);
}

function randomIntInc(low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}
