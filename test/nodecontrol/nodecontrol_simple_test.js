const NodeControlSimple = artifacts.require("NodeControlSimple");
const NodeControlDb = artifacts.require("NodeControlDb");
const NodeControlLookUp = artifacts.require("NodeControlLookUp");

require('chai')
    .use(require('chai-as-promised'))
    .should();

const { DEFAULT_ADDRESS } = require(__dirname + "/../utils.js");

contract('NodeControlSimple', (accounts) => {

    let nodeControlDb;
    let nodeControlLookUp;
    let nodeControlSimple;
    let owner;
    let deployer;

    before(async function () {
        owner = accounts[0];
        deployer = accounts[9];

        nodeControlLookUp = await NodeControlLookUp.new(DEFAULT_ADDRESS, owner, {
            from: deployer
        }).should.be.fulfilled;

        nodeControlDb = await NodeControlDb.new(nodeControlLookUp.address, owner, {
            from: deployer
        }).should.be.fulfilled;

        nodeControlSimple = await NodeControlSimple.new(nodeControlDb.address, owner, {
            from: deployer
        }).should.be.fulfilled;

        await nodeControlLookUp.changeAddress(nodeControlSimple.address, {
            from: owner
        }).should.be.fulfilled;
    });

    describe('#changeAddress', () => {

        it('must set the logic contract in the db', async () => {
            await nodeControlLookUp.changeAddress(nodeControlSimple.address);
        });
    });

    //** Functional requirements tests */
    describe('Functional requirement tests', () => {

        it('must emit UpdateAvailable event when a new update is triggered on a specific validator', async () => {
            let { logs } = await nodeControlSimple.updateValidator(accounts[1], '0x01', "dockerName123", '0x02', "chainSpecUrl123", true, {
                from: accounts[0]
            });

            nodeControl = await nodeControlSimple.retrieveExpectedState(accounts[1]);

            assert('0x01' === nodeControl.dockerSha, "dockerSha should be the same as parameter from function");
            assert("dockerName123" === nodeControl.dockerName, "dockerName should be the same as parameter from function");
            assert('0x02' === nodeControl.chainSpecSha, "chainSpecSha should be the same as parameter from function");
            assert('chainSpecUrl123' === nodeControl.chainSpecUrl, "chainSpecUrl should be the same as parameter from function");
            assert(true === nodeControl.isSigning, "isSigning should be the same as parameter from function");
            assert(true, "should have set the correct time");

            logs[0].event.should.be.equal('UpdateAvailable');
            logs[0].args._targetValidator.should.be.deep.equal(accounts[1]);
        });

        it('should emit multiple UpdateAvailable events when more then one validator is triggered for update', async () => {
            var { logs } = await nodeControlSimple.updateValidator(accounts[2], '0x01', "dockerName123", '0x02', "chainSpecUrl123", true, {
                from: accounts[0]
            });

            logs[0].event.should.be.equal('UpdateAvailable');
            logs[0].args._targetValidator.should.be.deep.equal(accounts[2]);

            var { logs } = await nodeControlSimple.updateValidator(accounts[3], '0x03', "dockerName123", '0x04', "chainSpecUrl123", true, {
                from: accounts[0]
            });

            logs[0].event.should.be.equal('UpdateAvailable');
            logs[0].args._targetValidator.should.be.deep.equal(accounts[3]);
        });

        it('must return the correct stateStruct of a validator', async () => {
            nodeControl = await nodeControlSimple.retrieveExpectedState(accounts[1]);

            assert('0x01' === nodeControl.dockerSha, "dockerSha should be the same as parameter from function");
            assert("dockerName123" === nodeControl.dockerName, "dockerName should be the same as parameter from function");
            assert('0x02' === nodeControl.chainSpecSha, "chainSpecSha should be the same as parameter from function");
            assert('chainSpecUrl123' === nodeControl.chainSpecUrl, "chainSpecUrl should be the same as parameter from function");
            assert(true === nodeControl.isSigning, "isSigning should be the same as parameter from function");
            assert(true, "should have set the correct time");
        });

        it('must only allow the owner to change attributs', async () => {
            isFailed = false;
            try {
                await nodeControlSimple.updateValidator(accounts[1], '0x02', "dockerName123", '0x02', "chainSpecUrl123", true, {
                    from: accounts[1]
                });
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("Sender is not owner."), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");
        });

        it('must only allow the owner to change the owner', async () => {
            var { logs } = await nodeControlSimple.transferOwnership(accounts[1], {
                from: accounts[0]
            })

            logs[0].event.should.be.equal('OwnershipTransferred');
            logs[0].args.previousOwner.should.be.deep.equal(accounts[0]);
            logs[0].args.newOwner.should.be.deep.equal(accounts[1]);

            newOwner = await nodeControlSimple.owner();
            assert(newOwner == accounts[1], "Should have changed the owner");
            isFailed = false;
            try {
                await nodeControlSimple.transferOwnership(accounts[2], { from: accounts[0] });
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("Sender is not owner."), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");
            assert(newOwner == accounts[1], "Should still be the previous owner");

            //change back to old owner
            var { logs } = await nodeControlSimple.transferOwnership(accounts[0], { from: accounts[1] });

            logs[0].event.should.be.equal('OwnershipTransferred');
            logs[0].args.previousOwner.should.be.deep.equal(accounts[1]);
            logs[0].args.newOwner.should.be.deep.equal(accounts[0]);

            newOwner = await nodeControlSimple.owner();
            assert(newOwner == accounts[0], "Should have changed the owner back");
        });

        it('must not allow the new owner to be 0x0', async () => {
            isFailed = false;
            try {
                await nodeControlSimple.transferOwnership('0x0000000000000000000000000000000000000000', {
                    from: accounts[0]
                });
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("New owner address cannot be 0x0"), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");
        });

        it('should only change if at least one parameter is different', async () => {
            isFailed = false;
            await nodeControlSimple.updateValidator(accounts[1], '0x03', "dockerName123", '0x02', "chainSpecUrl123", true, {
                from: accounts[0]
            });

            try {
                await nodeControlSimple.updateValidator(accounts[1], '0x03', "dockerName123", '0x02', "chainSpecUrl123", true, {
                    from: accounts[0]
                });
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("Error: No changes in the passed State"), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");
        });

        it('should not change if any value is 0', async () => {
            try {
                await nodeControlSimple.updateValidator(accounts[1], "0x", "dockerName123", '0x02', "chainSpecUrl123", true, {
                    from: accounts[0]
                });
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("DockerSha should not be empty"), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");

            try {
                await nodeControlSimple.updateValidator(accounts[1], "0x123", "", '0x02', "chainSpecUrl123", true, {
                    from: accounts[0]
                });
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("DockerName should not be empty"), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");

            try {
                await nodeControlSimple.updateValidator(accounts[1], "0x123", "dockerName123", '0x', "chainSpecUrl123", true, {
                    from: accounts[0]
                });
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("ChainSpecSha should not be empty"), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");

            try {
                await nodeControlSimple.updateValidator(accounts[1], "0x123", "dockerName123", '0x02', "", true, {
                    from: accounts[0]
                });
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("ChainSpecUrl should not be empty"), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");
        });
    });

    //** Function tests */
    describe('#retrieveExpectedState', () => {

        it('must return the correct state of a specific validator', async () => {
            returnCall = await nodeControlSimple.retrieveExpectedState(accounts[1]);

            assert(returnCall.dockerSha === '0x03', "dockerSha should be the same");
            assert(returnCall.dockerName === 'dockerName123', "dockerName should be the same");
            assert(returnCall.chainSpecSha === '0x02', "chainSpecSha should be the same");
            assert(returnCall.chainSpecUrl === 'chainSpecUrl123', "chainSpecUrl should be the same");
            assert(returnCall.isSigning === true, "isSigning should be the same");
        });
    });

    describe('#updateValidator', () => {

        it('must set the docker sha256 hash according to parameter', async () => {
            dockerSha = '0x04';

            await nodeControlSimple.updateValidator(accounts[2], dockerSha, "dockerName123", '0x02', "chainSpecUrl123", true, {
                from: accounts[0]
            });
            nodeControl = await nodeControlSimple.retrieveExpectedState(accounts[2]);

            assert(dockerSha === nodeControl.dockerSha, "dockerSha should be the same as parameter from function");
        });

        it('must set the docker name according to parameter', async () => {
            dockerName = "dockerName124";

            await nodeControlSimple.updateValidator(accounts[2], '0x04', dockerName, '0x02', "chainSpecUrl123", true, {
                from: accounts[0]
            });
            nodeControl = await nodeControlSimple.retrieveExpectedState(accounts[2]);

            assert(dockerName === nodeControl.dockerName, "dockerName should be the same as parameter from function");
        });

        it('must set the chainspec sha256 according to parameter', async () => {
            chainSpecSha = "0x03";

            await nodeControlSimple.updateValidator(accounts[2], '0x04', "dockerName123", chainSpecSha, "chainSpecUrl123", true, {
                from: accounts[0]
            });
            nodeControl = await nodeControlSimple.retrieveExpectedState(accounts[2]);

            assert(chainSpecSha === nodeControl.chainSpecSha, "chainSpecSha should be the same as parameter from function");
        });

        it('must set the chainspec url according to parameter', async () => {
            chainSpecUrl = "chainSpecUrl";

            await nodeControlSimple.updateValidator(accounts[2], '0x04', "dockerName123", '0x02', chainSpecUrl, true, {
                from: accounts[0]
            });
            nodeControl = await nodeControlSimple.retrieveExpectedState(accounts[2]);

            assert(chainSpecUrl === nodeControl.chainSpecUrl, "chainSpecUrl should be the same as parameter from function");
        });

        it('must set the isSigning attribute according to parameter', async () => {
            isSigning = false;

            await nodeControlSimple.updateValidator(accounts[2], '0x04', "dockerName123", '0x02', "chainSpecUrl123", false, {
                from: accounts[0]
            });
            nodeControl = await nodeControlSimple.retrieveExpectedState(accounts[2]);

            assert(isSigning === nodeControl.isSigning, "isSigning should be the same as parameter from function");
        });

        it('must emit the UpdateAvailable event', async () => {
            txReturn = await nodeControlSimple.updateValidator(accounts[2], '0x05', "dockerName123", '0x02', "chainSpecUrl123", false, {
                from: accounts[0]
            });
            assert(txReturn.logs[0].event == 'UpdateAvailable', "Should have thrown the event");
        });

        it('must pass the correct validator to the event', async () => {
            txReturn = await nodeControlSimple.updateValidator(accounts[2], '0x04', "dockerName123", '0x02', "chainSpecUrl123", false, {
                from: accounts[0]
            });
            assert(txReturn.logs[0].args._targetValidator == accounts[2], "Should have thrown the event");
        });

        it('must revert if not called by the owner', async () => {
            preTransactionNodeControl = await nodeControlSimple.retrieveExpectedState(accounts[2]);

            isFailed = false;
            try {
                await nodeControlSimple.updateValidator(accounts[2], '0x05', "dockerName125", '0x05', "chainSpecUrl125", true, {
                    from: accounts[1]
                });
                isFailed = true;
            } catch (e) {

                assert(e.toString().includes("Sender is not owner."), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");
            postTransactionNodeControl = await nodeControlSimple.retrieveExpectedState(accounts[2]);

            assert(postTransactionNodeControl.dockerSha === preTransactionNodeControl.dockerSha, "dockerSha should be the same");
            assert(postTransactionNodeControl.dockerName === preTransactionNodeControl.dockerName, "dockerName should be the same");
            assert(postTransactionNodeControl.chainSpecSha === preTransactionNodeControl.chainSpecSha, "chainSpecSha should be the same");
            assert(postTransactionNodeControl.chainSpecName === preTransactionNodeControl.chainSpecName, "chainSpecName should be the same");
            assert(postTransactionNodeControl.isSigning === preTransactionNodeControl.isSigning, "isSigning should be the same");
            assert(postTransactionNodeControl.updateIntroduced.toString() === preTransactionNodeControl.updateIntroduced.toString(), "updateIntroduced should be the same");
        });
    });

    describe('#confirmUpdate', () => {

        it('must only be callable by a validator', async () => {
            isFailed = false;
            try {
                await nodeControlSimple.confirmUpdate({ from: accounts[6] });
                isFailed = true;
            } catch (e) {

                assert(e.toString().includes("Error: You are not a validator!"), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");
        });

        it('must return false for isUpdateConfirmed', async () => {
            boolReturn = await nodeControlSimple.isUpdateConfirmed(accounts[2]);
            assert(boolReturn == false, "Should have returned false");
        });

        it('must change the updateConfirm blocknumber to current', async () => {
            preTransactionNodeControl = await nodeControlSimple.retrieveExpectedState(accounts[2]);

            var txReturn = await nodeControlSimple.confirmUpdate({ from: accounts[2] });

            postTransactionNodeControl = await nodeControlSimple.retrieveExpectedState(accounts[2]);

            assert(preTransactionNodeControl.updateConfirmed.toString() != postTransactionNodeControl.updateConfirmed.toString(), "Should have updated the blocknumber");
            assert(txReturn.receipt.blockNumber.toString() === postTransactionNodeControl.updateConfirmed.toString(), "Should have set the correct blocknumber");
        });

        it('must return true for isUpdateConfirmed', async () => {
            boolReturn = await nodeControlSimple.isUpdateConfirmed(accounts[2]);
            assert(boolReturn == true, "Should have returned true");
        });

        it('must revert if already confirmed', async () => {
            isFailed = false;
            try {
                await nodeControlSimple.confirmUpdate({ from: accounts[2] });
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("Error: Already Confirmed"), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");
        });

        it('must not be callable by an address whos dockersha length is 0', async () => {
            NodeControl = await nodeControlSimple.retrieveExpectedState(accounts[5]);

            assert(NodeControl.dockerSha == '0x', "dockerSha should be empty");

            isFailed = false;
            try {
                await nodeControlSimple.confirmUpdate({ from: accounts[5] });
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("Error: You are not a validator!"), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");
        });
    });

    describe('#transferOwnership', () => {

        it('must only be callable by the owner', async () => {
            isFailed = false;
            try {
                await nodeControlSimple.transferOwnership(accounts[1], { from: accounts[5] });
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("Sender is not owner."), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");

            preTransactionNodeControlOwner = await nodeControlSimple.owner();

            await nodeControlSimple.transferOwnership(accounts[1], { from: accounts[0] });

            postTransactionNodeControlOwner = await nodeControlSimple.owner();

            assert(preTransactionNodeControlOwner != postTransactionNodeControlOwner, "Should have changed the owner");
            assert(postTransactionNodeControlOwner == accounts[1], "The new owner should be set");
        });

        it('must not accept the parameter 0x0', async () => {
            isFailed = false;
            try {
                await nodeControlSimple.transferOwnership('0x0000000000000000000000000000000000000000', {
                    from: accounts[1]
                })
                isFailed = true;
            } catch (e) {
                assert(e.toString().includes("New owner address cannot be 0x0"), "Should have thrown the right exception");
            }
            assert(!isFailed, "Should have thrown exception");
        });

        it('must set the owner to the new owner passed as parameter', async () => {
            await nodeControlSimple.transferOwnership(accounts[0], { from: accounts[1] });
            NodeControlOwner = await nodeControlSimple.owner();
            assert(NodeControlOwner == accounts[0], "Should have set the owner according to function parameter");
        });
    });
});
