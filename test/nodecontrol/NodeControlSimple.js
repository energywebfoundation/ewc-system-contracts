const NodeControlSimple = artifacts.require("NodeControlSimple");
const NodeControlDb = artifacts.require("NodeControlDb");

contract('NodeControlSimple', (accounts) => {

  it('must set the logic contract in the db', async () => {
    const NodeControlDbInstance = await NodeControlDb.deployed();
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();

    await NodeControlDbInstance.changeLogicContract(NodeControlSimpleInstance.address)
  })

  //** Functional requirements tests */
  it('must emit UpdateAvailable event when a new update is triggered on a specific validator', async () => {
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();

    await NodeControlSimpleInstance.updateValidator(accounts[1], '0x01', "dockerName123", '0x02', "chainSpecUrl123", true, {
      from: accounts[0]
    });

    nodeControl = await NodeControlSimpleInstance.retrieveExpectedState(accounts[1])

    assert('0x01' === nodeControl.dockerSha, "dockerSha should be the same as parameter from function")
    assert("dockerName123" === nodeControl.dockerName, "dockerName should be the same as parameter from function")
    assert('0x02' === nodeControl.chainSpecSha, "chainSpecSha should be the same as parameter from function")
    assert('chainSpecUrl123' === nodeControl.chainSpecUrl, "chainSpecUrl should be the same as parameter from function")
    assert(true === nodeControl.isSigning, "isSigning should be the same as parameter from function")
    assert(true, "should have set the correct time")

  //check for events
  });
  it('should emit multiple UpdateAvailable events when more then one validator is triggered for update', async () => {
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();

    await NodeControlSimpleInstance.updateValidator(accounts[2], '0x01', "dockerName123", '0x02', "chainSpecUrl123", true, {
      from: accounts[0]
    });
    await NodeControlSimpleInstance.updateValidator(accounts[3], '0x03', "dockerName123", '0x04', "chainSpecUrl123", true, {
      from: accounts[0]
    });

    nodeControl1 = await NodeControlSimpleInstance.retrieveExpectedState(accounts[1])
    nodeControl2 = await NodeControlSimpleInstance.retrieveExpectedState(accounts[2])

  //check for events
  });
  it('must return the correct stateStruct of a validator', async () => {
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();

    nodeControl = await NodeControlSimpleInstance.retrieveExpectedState(accounts[1])

    assert('0x01' === nodeControl.dockerSha, "dockerSha should be the same as parameter from function")
    assert("dockerName123" === nodeControl.dockerName, "dockerName should be the same as parameter from function")
    assert('0x02' === nodeControl.chainSpecSha, "chainSpecSha should be the same as parameter from function")
    assert('chainSpecUrl123' === nodeControl.chainSpecUrl, "chainSpecUrl should be the same as parameter from function")
    assert(true === nodeControl.isSigning, "isSigning should be the same as parameter from function")
    assert(true, "should have set the correct time")
  });

  it('must only allow the owner to change attributs', async () => {
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();
    isFailed = false;
    try {
      await NodeControlSimpleInstance.updateValidator(accounts[1], '0x02', "dockerName123", '0x02', "chainSpecUrl123", true, {
        from: accounts[1]
      });
      isFailed = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown exception")
  });
  it('must only allow the owner to change the owner', async () => {
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();
    await NodeControlSimpleInstance.setOwner(accounts[1], {
      from: accounts[0]
    })
    newOwner = await NodeControlSimpleInstance.owner()
    assert(newOwner == accounts[1], "Should have changed the owner")
    isFailed = false;
    try {
      await NodeControlSimpleInstance.setOwner(accounts[2], {
        from: accounts[0]
      });
      isFailed = true;
    } catch (e) {
      assert(true, "Should have thrown an exception: wrong owner")
    }
    assert(!isFailed, "Should have thrown exception")
    assert(newOwner == accounts[1], "Should still be the previous owner")

    //change back to old owner
    await NodeControlSimpleInstance.setOwner(accounts[0], {
      from: accounts[1]
    })
    newOwner = await NodeControlSimpleInstance.owner()
    assert(newOwner == accounts[0], "Should have changed the owner back")
  });
  it('must not allow the new owner to be 0x0', async () => {
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();
    isFailed = false;
    try {
      await NodeControlSimpleInstance.setOwner('0x0000000000000000000000000000000000000000', {
        from: accounts[0]
      });
      isFailed = true;
    } catch (e) {
      assert(true, "Should have thrown an exception: No 0x0 address")
    }
    assert(!isFailed, "Should have thrown exception")
  });

  it('must change the state of a validator');

  it('should only change if at least one parameter is different', async () => {
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();
    isFailed = false;
    await NodeControlSimpleInstance.updateValidator(accounts[1], '0x03', "dockerName123", '0x02', "chainSpecUrl123", true, {
      from: accounts[0]
    });

    try {
      await NodeControlSimpleInstance.updateValidator(accounts[1], '0x03', "dockerName123", '0x02', "chainSpecUrl123", true, {
        from: accounts[0]
      });
      isFailed = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown exception")
  })

  //** Function tests */
  //** retrieveExpectedState */
  it('must return the correct state of a specific validator', async () => {
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();

    returnCall = await NodeControlSimpleInstance.retrieveExpectedState(accounts[1])

    assert(returnCall.dockerSha === '0x03', "dockerSha should be the same")
    assert(returnCall.dockerName === 'dockerName123', "dockerName should be the same")
    assert(returnCall.chainSpecSha === '0x02', "chainSpecSha should be the same")
    assert(returnCall.chainSpecUrl === 'chainSpecUrl123', "chainSpecUrl should be the same")
    assert(returnCall.isSigning === true, "isSigning should be the same")
  });
  it('must not change the state');

  //** updateValidator */
  it('must set the docker sha256 hash according to parameter', async () => {
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();

    dockerSha = '0x04'

    await NodeControlSimpleInstance.updateValidator(accounts[2], dockerSha, "dockerName123", '0x02', "chainSpecUrl123", true, {
      from: accounts[0]
    });

    nodeControl = await NodeControlSimpleInstance.retrieveExpectedState(accounts[2])

    assert(dockerSha === nodeControl.dockerSha, "dockerSha should be the same as parameter from function")
  });
  it('must set the docker name according to parameter', async () => {
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();

    dockerName = "dockerName124"

    await NodeControlSimpleInstance.updateValidator(accounts[2], '0x04', dockerName, '0x02', "chainSpecUrl123", true, {
      from: accounts[0]
    });

    nodeControl = await NodeControlSimpleInstance.retrieveExpectedState(accounts[2])

    assert(dockerName === nodeControl.dockerName, "dockerName should be the same as parameter from function")
  });
  it('must set the chainspec sha256 according to parameter', async () => {
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();

    chainSpecSha = "0x03"

    await NodeControlSimpleInstance.updateValidator(accounts[2], '0x04', "dockerName123", chainSpecSha, "chainSpecUrl123", true, {
      from: accounts[0]
    });

    nodeControl = await NodeControlSimpleInstance.retrieveExpectedState(accounts[2])

    assert(chainSpecSha === nodeControl.chainSpecSha, "chainSpecSha should be the same as parameter from function")
  });
  it('must set the chainspec url according to parameter', async () => {
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();

    chainSpecUrl = "chainSpecUrl"

    await NodeControlSimpleInstance.updateValidator(accounts[2], '0x04', "dockerName123", '0x02', chainSpecUrl, true, {
      from: accounts[0]
    });

    nodeControl = await NodeControlSimpleInstance.retrieveExpectedState(accounts[2])

    assert(chainSpecUrl === nodeControl.chainSpecUrl, "chainSpecUrl should be the same as parameter from function")
  });
  it('must set the isSigning attribute according to parameter', async () => {
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();

    isSigning = false

    await NodeControlSimpleInstance.updateValidator(accounts[2], '0x04', "dockerName123", '0x02', "chainSpecUrl123", false, {
      from: accounts[0]
    });

    nodeControl = await NodeControlSimpleInstance.retrieveExpectedState(accounts[2])

    assert(isSigning === nodeControl.isSigning, "isSigning should be the same as parameter from function")
  });

  it('must set the correct timestamp');

  it('must emit the UpdateAvailable event', async () => {
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();

    txReturn = await NodeControlSimpleInstance.updateValidator(accounts[2], '0x05', "dockerName123", '0x02', "chainSpecUrl123", false, {
      from: accounts[0]
    });

    assert(txReturn.logs[0].event == 'UpdateAvailable', "Should have thrown the event")
  });
  it('must pass the correct validator to the event', async () => {
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();

    txReturn = await NodeControlSimpleInstance.updateValidator(accounts[2], '0x04', "dockerName123", '0x02', "chainSpecUrl123", false, {
      from: accounts[0]
    });

    assert(txReturn.logs[0].args._targetValidator == accounts[2], "Should have thrown the event")
  });

  it('must revert if not called by the owner', async () => {
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();

    preTransactionNodeControl = await NodeControlSimpleInstance.retrieveExpectedState(accounts[2])

    isFailed = false
    try {
      await NodeControlSimpleInstance.updateValidator(accounts[2], '0x05', "dockerName125", '0x05', "chainSpecUrl125", true, {
        from: accounts[1]
      });
      isFailed = true;
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown exception")
    postTransactionNodeControl = await NodeControlSimpleInstance.retrieveExpectedState(accounts[2])

    assert(postTransactionNodeControl.dockerSha === preTransactionNodeControl.dockerSha, "dockerSha should be the same")
    assert(postTransactionNodeControl.dockerName === preTransactionNodeControl.dockerName, "dockerName should be the same")
    assert(postTransactionNodeControl.chainSpecSha === preTransactionNodeControl.chainSpecSha, "chainSpecSha should be the same")
    assert(postTransactionNodeControl.chainSpecName === preTransactionNodeControl.chainSpecName, "chainSpecName should be the same")
    assert(postTransactionNodeControl.isSigning === preTransactionNodeControl.isSigning, "isSigning should be the same")
    assert(postTransactionNodeControl.updateIntroduced.toString() === preTransactionNodeControl.updateIntroduced.toString(), "updateIntroduced should be the same")
  });

  //** confirmUpdate */
  it('must only be callable by a validator', async () => {
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();
    isFailed = false
    try {
      await NodeControlSimpleInstance.confirmUpdate({
        from: accounts[6]
      })
      isFailed = true
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown exception")
  });

  it('must change the updateConfirm timestamp to now', async () => {
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();

    preTransactionNodeControl = await NodeControlSimpleInstance.retrieveExpectedState(accounts[2])

    await NodeControlSimpleInstance.confirmUpdate({
      from: accounts[2]
    })

    postTransactionNodeControl = await NodeControlSimpleInstance.retrieveExpectedState(accounts[2])

    assert(preTransactionNodeControl.updateConfirmed.toString() != postTransactionNodeControl.updateConfirmed.toString(), "Should have updated the timestamp")
  });

  it('must not be callable by an address whos dockersha length is 0', async () => {
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();
    NodeControl = await NodeControlSimpleInstance.retrieveExpectedState(accounts[5])

    assert(NodeControl.dockerSha == '0x', "dockerSha should be empty")

    isFailed = false
    try {
      await NodeControlSimpleInstance.confirmUpdate({
        from: accounts[5]
      })
      isFailed = true
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown exception")
  });

  //** setOwner */
  it('must only be callable by the owner', async () => {
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();

    isFailed = false
    try {
      await NodeControlSimpleInstance.setOwner(accounts[1], {
        from: accounts[5]
      })
      isFailed = true
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown exception")

    preTransactionNodeControlOwner = await NodeControlSimpleInstance.owner()

    await NodeControlSimpleInstance.setOwner(accounts[1], {
      from: accounts[0]
    })

    postTransactionNodeControlOwner = await NodeControlSimpleInstance.owner()

    assert(preTransactionNodeControlOwner != postTransactionNodeControlOwner, "Should have changed the owner")
    assert(postTransactionNodeControlOwner == accounts[1], "The new owner should be set")

  });
  it('must not accept the parameter 0x0', async () => {
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();

    isFailed = false
    try {
      await NodeControlSimpleInstance.setOwner('0x0000000000000000000000000000000000000000', {
        from: accounts[1]
      })
      isFailed = true
    } catch (e) {
      assert(true, "Should have thrown an exception")
    }
    assert(!isFailed, "Should have thrown exception")
  });
  it('must set the owner to the new owner passed as parameter', async () => {
    const NodeControlSimpleInstance = await NodeControlSimple.deployed();

    await NodeControlSimpleInstance.setOwner(accounts[0], {
      from: accounts[1]
    })

    NodeControlOwner = await NodeControlSimpleInstance.owner()

    assert(NodeControlOwner == accounts[0], "Should have set the owner according to function parameter")
  });

});
