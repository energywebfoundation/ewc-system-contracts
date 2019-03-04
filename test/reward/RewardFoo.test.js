let FooMock = artifacts.require('./mockcontracts/FooMock');
let Foo = artifacts.require('./RewardFoo');

console.log("Web3 version: " + web3.version);

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bn')(web3.utils.BN))
  .should();


contract('Foo', function (accounts) {
    
    describe('original foo', async function() {

        let foo;

        beforeEach(async function() {
            deployer = accounts[0];
            foo = await Foo.new([5], {from: deployer});
        });
        
        it('should return 5 for x', async function() {
            let x = await foo.x();
            x.should.be.bignumber.equal("5");
        });

        it('should set x to 987', async function() {
            await foo.setX(987, {from: deployer});
            let x = await foo.x();
            x.should.be.bignumber.equal("987");
        });
    });


    describe('mock foo', async function() {

        let fooMock;

        beforeEach(async function() {
            deployer = accounts[0];
            fooMock = await FooMock.new([5], {from: deployer}).should.be.fulfilled;
        });

        it('should return 6 for x', async function() {
            let x = await fooMock.x();
            x.should.be.bignumber.equal("6");
        });
    });
});
