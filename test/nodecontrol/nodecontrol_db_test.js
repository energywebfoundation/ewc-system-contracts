const NodeControlSimple = artifacts.require("NodeControlSimple");
const NodeControlDb = artifacts.require("NodeControlDb");
const NodeControlLookUp = artifacts.require("NodeControlLookUp");

require('chai')
    .use(require('chai-as-promised'))
    .should();

const {
    DEFAULT_ADDRESS
} = require(__dirname + "/../utils.js");

contract('NodeControlDb', (accounts) => {

    let nodeControlDb;
    let nodeControlLookUp;
    let nodeControlSimple;
    let owner;
    let deployer;

    before(async function () {
        owner = accounts[0];
        deployer = accounts[9];

        nodeControlLookUp = await NodeControlLookUp.new(DEFAULT_ADDRESS, owner, { from: deployer })
            .should.be.fulfilled;

        nodeControlDb = await NodeControlDb.new(nodeControlLookUp.address, owner, { from: deployer })
            .should.be.fulfilled;

        nodeControlSimple = await NodeControlSimple.new(nodeControlDb.address, owner, { from: deployer })
            .should.be.fulfilled;

        await nodeControlLookUp.changeAddress(nodeControlSimple.address, { from: owner })
            .should.be.fulfilled;
    });

    describe('#changeLookUpContract', () => {

        it('must set the new lookup contract correctly', async () => {

            await nodeControlDb.changeLookUpContract(accounts[1]);
            postState = await nodeControlDb.nodeControlLookUp();

            assert(postState == accounts[1], "Should be the accounts from the parameter");

            await nodeControlDb.changeLookUpContract(nodeControlLookUp.address);
            postState = await nodeControlDb.nodeControlLookUp();

            assert(postState == nodeControlLookUp.address, "Should be the logic instance address");
        });

        it("must not allow 0x0 as address for new logic contract", async () => {
            isFailed = false;
            try {
                await nodeControlDb.changeLookUpContract(DEFAULT_ADDRESS, { from: accounts[0] });
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("Error: newLookUp is not allowed to be 0x0"), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");
        });

        it("must only allow owner to change logic contract", async () => {
            isFailed = false;
            try {
                await nodeControlDb.changeLookUpContract('0x0000000000000000000000000000000000000001', { from: accounts[1] });
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("Sender is not owner."), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");
        });
    });

    describe('#transferOwnership', () => {

        it('must set the new owner correctly', async () => {

            await nodeControlDb.transferOwnership(accounts[1]);
            postState = await nodeControlDb.owner();

            assert(postState == accounts[1], "Should be the accounts from the parameter");

            await nodeControlDb.transferOwnership(accounts[0], { from: accounts[1] });
            postState = await nodeControlDb.owner();

            assert(postState == accounts[0], "Should be the logic instance address");
        });

        it("must not allow 0x0 as address for new owner", async () => {
            isFailed = false;
            try {
                await nodeControlDb.transferOwnership(DEFAULT_ADDRESS, { from: accounts[0] });
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("New owner address cannot be 0x0"), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");
        });

        it("must only allow owner to change owner", async () => {
            isFailed = false;
            try {
                await nodeControlDb.transferOwnership('0x0000000000000000000000000000000000000001', {
                    from: accounts[1]
                });
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("Sender is not owner."), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");
        });
    });

    describe('#setState', () => {

        it("must only let the logic contract call setState", async () => {
            isFailed = false;
            try {
                await nodeControlDb.setState(accounts[1], '0x02', "dockerName123", '0x02', "chainSpecUrl123", true, {
                    from: accounts[1]
                });
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("Error: onlyLogic Db"), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");
        });
    });

    describe('#setUpdateConfirmed', () => {

        it("must only let the logic contract call setUpdateConfirmed", async () => {
            isFailed = false;
            try {
                await nodeControlDb.setUpdateConfirmed(accounts[1], { from: accounts[1] });
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("Error: onlyLogic Db"), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");
        })
    });

    describe('Get functions', () => {

        it("must only let the logic contract call getState", async () => {
            isFailed = false;
            try {
                await nodeControlDb.getState(accounts[1], { from: accounts[1] });
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("Error: onlyLogic Db"), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");
        });

        it("must only let the logic contract call getDockerSha", async () => {
            isFailed = false;
            try {
                await nodeControlDb.getDockerSha(accounts[1], { from: accounts[1] });
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("Error: onlyLogic Db"), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");
        });

        it("must only let the logic contract call getDockerName", async () => {
            isFailed = false;
            try {
                await nodeControlDb.getDockerName(accounts[1], { from: accounts[1] });
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("Error: onlyLogic Db"), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");
        });

        it("must only let the logic contract call getChainSpecSha", async () => {
            isFailed = false;
            try {
                await nodeControlDb.getChainSpecSha(accounts[1], { from: accounts[1] });
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("Error: onlyLogic Db"), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");
        });

        it("must only let the logic contract call getChainSpecUrl", async () => {
            isFailed = false;
            try {
                await nodeControlDb.getChainSpecUrl(accounts[1], { from: accounts[1] });
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("Error: onlyLogic Db"), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");
        });

        it("must only let the logic contract call getIsSigning", async () => {
            isFailed = false;
            try {
                await nodeControlDb.getIsSigning(accounts[1], { from: accounts[1] });
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("Error: onlyLogic Db"), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");
        });
    });
});
