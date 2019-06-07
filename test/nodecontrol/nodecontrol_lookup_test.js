const NodeControlSimple = artifacts.require("NodeControlSimple");
const NodeControlDb = artifacts.require("NodeControlDb");
const NodeControlLookUp = artifacts.require("NodeControlLookUp");

require('chai')
    .use(require('chai-as-promised'))
    .should();

const {
    DEFAULT_ADDRESS
} = require(__dirname + "/../utils.js");

contract('NodeControlLookUp', function (accounts) {

    let nodeControlDb;
    let nodeControlLookUp;
    let nodeControlSimple;
    let owner;
    let deployer;

    beforeEach(async function () {
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

    describe('#constructor', function () {

        it('should set owner correctly', async function () {
            (await nodeControlLookUp.owner.call()).should.be.equal(owner);
        });

        it('should set node-control address correctly', async function () {
            (await nodeControlLookUp.nodeControlContract.call()).should.be.equal(nodeControlSimple.address);
        });

        it('constructor should emit event correctly', async function () {
            const pastEvents = await nodeControlLookUp.getPastEvents('NewNodeControlAddress');
            pastEvents[0].returnValues._newNodeControlAddress.should.be.equal(nodeControlSimple.address);
        });
    });

    describe('#changeAddress', function () {

        it('must set the address correctly', async function () {
            await nodeControlLookUp.changeAddress(owner, { from: owner }).should.be.fulfilled;
            (await nodeControlLookUp.nodeControlContract()).should.be.equal(owner);
        });

        it('must only be callable by the owner', async function () {
            await nodeControlLookUp.changeAddress(accounts[6], { from: accounts[1] }).should.be.rejectedWith("Sender is not owner");
            await nodeControlLookUp.changeAddress(accounts[6], { from: owner }).should.be.fulfilled;
        });

        it('must emit event NewNodeControlAddress correctly', async function () {
            const tx = await nodeControlLookUp.changeAddress(accounts[7], { from: owner }).should.be.fulfilled;
            tx.logs[0].args._newNodeControlAddress.should.be.equal(accounts[7]);
        });
    });
});
