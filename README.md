# EWC system contracts
Infrastructure contracts for EnergyWebChain and Volta live launch.

## Maintainers
**Primary**: Adam Nagy (@ngyam)

Heiko Burkhardt (@hai-ko), Jonas Bentke (@jbentke)

## Pre-requisites
- node 8
- npm
- Optional: python 3.6 environment for Slither

## Quickstart
```
npm install -D
```
and code away. Dependencies are installed locally.

## Contracts

**Important**: all contracts go to the chainspec, deployed at the same time with their addresses known beforehans, so no deployment/migration scripts are written. The contracts are compiled and put into the chainspec by our Genesis/Chainspec generator: https://github.com/energywebfoundation/ewf-genesis-generator

Compiler version: 0.5.7 ([reason](https://blog.ethereum.org/2019/03/26/solidity-optimizer-and-abiencoderv2-bug/))

### Validator set

#### # Relay
Implements the [Parity's reporting validator set interface](https://wiki.parity.io/Validator-Set#reporting-contract). Relays all function calls to a worker "Relayed" contract. This pattern is chosen for upgradeability.

- **Deployment**:

  ```
  constructor(address _owner, address _relayedSet)
  ```

  It expects the Relayed address and contract owner address in the constructor.

#### # Relayed
Implements the actual validator set logic and storage.

- **Deployment**:

  ```
  constructor(address _owner, address _relaySet, address[] memory _initial)
  ```

  It expects the Relay address, contract owner and the initial validator addresses in the constructor.

### Reward contract

Contains the reward logic. Rewards are issued upon new blocks. The contract implements [Parity's BlockReward interface](https://wiki.parity.io/Block-Reward-Contract).

Rewarded entities:
 1. Block authors: rewarded for a total of 10 years with ~10 mil tokens based on a discrete S curve distribution. The S curve calculator can be found [here](https://github.com/energywebfoundation/discrete-scurve-calculator).
 2. Community fund: A multisig wallet controlled by the community. Rewarded for a total of 10 years with ~10 mil tokens. A constant amount is paid out with each new block.

 - **Deployment**:

   ```
   constructor(address _communityFundAddress, uint256 _communityFundAmount)
   ```

   Expects the address of the community fund (ideally a mutltisig wallet) and the constant amount that is paid to the fund with each new block in wei.

### Holding contract
Holds investor funds, which are available to withdraw after a certain time period has passed.


 - **Deployment**:

   ```
   constructor()
   ```

   No params needed. The initial holding records are hardcoded into the constructor.

### Node control
EWF's node control system contracts. Consists of 3 contracts for upgradeability.

#### # NodeControlLookUp
Serves as a lookup contract for the node control logic.

- **Deployment**:

  ```
  constructor(NodeControlDb _nodeControlDb, address _owner)
  ```

  Constructor expects the address of the db and the owner.

#### # NodeControlDb
Stores validator node state information.

- **Deployment**:
  ```
  constructor(NodeControlLookUp _lookUpContract, address _owner)
  ```

  Constructor expects the address of the lookup contract and the owner.

#### # NodeControSimple
On-chain node control logic. Can issue update commands to nodes.

- **Deployment**:
  ```
  constructor(NodeControlDb _nodeControlDb, address _owner)
  ```

  Constructor expects the address of the db and the owner.

### Parity's Name Registry (SimpleRegistry)
This contract is [Parity's Registry contract](https://github.com/parity-contracts/name-registry/blob/master/contracts/SimpleRegistry.sol). The minor modification is that the SimpleRegistry
was made Ownable and the following functions are only allowed to be called by the owner:
```
reserve()
confirmReverseAs()
setFee()
drain()
```
Functionally, this contract is just a placeholer, giving possibilities for future use.

- **Deployment**:
  ```
  constructor(address _owner)
  ```

  Constructor expects the address of the owner only.

### Other third party contracts used

 - [OpenZeppelin's SafeMath](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/math/SafeMath.sol)
 - [OpenZeppelin's Ownable](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/ownership/Ownable.sol)

## Compiling the contracts

With the locally installed truffle:
```
npx truffle compile
```

Expected warnings:
 - ValidatorSetRelayed.sol:128:9: `Warning: Unused function parameter`. This function is according to Parity spec. but we are not using tthe `_proof` param for anything right now.
 - NodeControl contracts -> `Warning: Experimental features are turned on.` Expected because of `ABIEncoderV2`.

## Running the tests

```
npm test
```

The test script starts a ganache instance and stops it afterwards.

## Linting

2 linters are set up:
- Solhint:
  ```
  npm run lint:solhint
  ```
- Solium
  ```
  npm run lint:solium
  ```

## Coverage report
Solidity coverage

```
npm run coverage
```

## Security analysis

- [Slither by Trail of bits]((https://github.com/trailofbits/slither#how-to-install)):
  
  1. Make sure a python 3.6 env is active.

  2. Install

     ```
     pip install slither-analyzer
     ```

     or sometimes

     ```
     pip3 install slither-analyzer
     ```

   1. Then run
     ```
     npm run security
     ```

- [MythX security checker](https://mythx.io/) (truffle security plugin by ConsenSys):
  
  Already installed with the other local deps.
   
  ```
  npm run verify
  ```

## Contributing

Please read our [CONTRIBUTING guide](./CONTRIBUTING.md) for our code of conduct and for the process of submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. 

## License

This project is licensed under the GPLv3 License - see the [LICENSE](./LICENSE) file for details.

## FAQ
