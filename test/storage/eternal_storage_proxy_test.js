const EternalStorageProxy = artifacts.require('EternalStorageProxy');

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bn')(web3.utils.BN))
    .should();

const {
    assertThrowsAsync,
    REVERT_ERROR_MSG,
    DEFAULT_ADDRESS
} = require(__dirname + "/../utils.js");

contract('EternalStorageProxy [all features]', function (accounts) {

    describe('constructor', async function () {

        it('should revert if implementation address is equal to 0x0', async function () {
            await EternalStorageProxy.new(
                DEFAULT_ADDRESS,
            ).should.be.rejectedWith(REVERT_ERROR_MSG);
        });

        it('should set implementation address', async function () {
            const instance = await EternalStorageProxy.new(
                accounts[2]
            ).should.be.fulfilled;
            (await instance.implementation.call()).should.be.equal(accounts[2]);
        });

        it('should set owner', async function () {
            const instance = await EternalStorageProxy.new(
                accounts[2]
            ).should.be.fulfilled;
            (await instance.owner.call()).should.be.equal(accounts[0]);
        });
    });

    describe('#fallback', async () => {
        
        it('should revert', async () => {
            const amount = web3.utils.toWei("10", "ether");
            const instance = await EternalStorageProxy.new(
                accounts[2]
            ).should.be.fulfilled;
            await assertThrowsAsync(
                () => web3.eth.sendTransaction({
                    from: accounts[1],
                    to: instance.address,
                    value: amount
                }),
                "revert"
            );
        });
    });

    describe('#renounceOwnership', async function () {
        let instance;

        beforeEach(async function () {
            instance = await EternalStorageProxy.new(
                accounts[2]
            ).should.be.fulfilled;
        });

        it('must only be called by an owner', async function () {
            await instance.renounceOwnership({ from: accounts[3] }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await instance.renounceOwnership().should.be.fulfilled;
        });

        it('should set owner to 0x0', async function () {
            const { logs } = await instance.renounceOwnership().should.be.fulfilled;
            (await instance.owner.call()).should.be.equal(
                DEFAULT_ADDRESS
            );
            logs[0].event.should.be.equal("OwnershipTransferred");
            logs[0].args.previousOwner.should.be.equal(accounts[0]);
        });
    });

    describe('#transferOwnership', async function () {
        let instance;

        beforeEach(async function () {
            instance = await EternalStorageProxy.new(
                accounts[2]
            ).should.be.fulfilled;
        });

        it('must only be called by an owner', async function () {
            await instance.transferOwnership(
                accounts[3],
                { from: accounts[4] }
            ).should.be.rejectedWith(REVERT_ERROR_MSG);
            await instance.transferOwnership(accounts[3]).should.be.fulfilled;
        });

        it('should change owner', async function () {
            const { logs } = await instance.transferOwnership(accounts[3]).should.be.fulfilled;
            (await instance.owner.call()).should.be.equal(accounts[3]);
            logs[0].event.should.be.equal("OwnershipTransferred");
            logs[0].args.previousOwner.should.be.equal(accounts[0]);
            logs[0].args.newOwner.should.be.equal(accounts[3]);
        });

        it('should not change owner if its address is 0x0', async function () {
            await instance.transferOwnership(
                DEFAULT_ADDRESS
            ).should.be.rejectedWith(REVERT_ERROR_MSG);
        });
    });

    describe('#upgradeTo', async function () {
        let instance;

        beforeEach(async function () {
            instance = await EternalStorageProxy.new(
                accounts[2]
            ).should.be.fulfilled;
        });

        it('must only be called by Owner', async function () {
            await instance.upgradeTo(accounts[3], { from: accounts[1] }).should.be.rejectedWith(REVERT_ERROR_MSG);
            const { logs } = await instance.upgradeTo(accounts[3], { from: accounts[0] });
            logs[0].event.should.be.equal("Upgraded");
        });

        it('should not change implementation address if it is the same', async function () {
            const result = await instance.upgradeTo(
                accounts[2],
                { from: accounts[0] }
            ).should.be.fulfilled;
            result.logs.length.should.be.equal(0);
        });

        it('should not change implementation address if it is 0x0', async function () {
            const result = await instance.upgradeTo(
                DEFAULT_ADDRESS,
                { from: accounts[0] }
            );
            result.logs.length.should.be.equal(0);
        });

        it('should change implementation address', async function () {
            const { logs } = await instance.upgradeTo(
                accounts[3],
                { from: accounts[0] }
            ).should.be.fulfilled;
            (await instance.implementation.call()).should.be.equal(accounts[3]);
            logs[0].event.should.be.equal("Upgraded");
            logs[0].args.version.should.be.bignumber.equal("1");
            logs[0].args.implementation.should.be.equal(accounts[3]);
        });

        it('should increment version', async function () {
            (await instance.version.call()).should.be.bignumber.equal("0");
            const { logs } = await instance.upgradeTo(
                accounts[3],
                { from: accounts[0] }
            );
            logs[0].event.should.be.equal("Upgraded");
            (await instance.version.call()).should.be.bignumber.equal("1");
        });
    });
});
