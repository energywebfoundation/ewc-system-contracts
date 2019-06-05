
module.exports = {

  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*",
    },
    test: {
      host: "localhost",
      port: 8545,
      gas: 79000000,
      network_id: "*"
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 7545,
      gas: 0xfffffffffff,
      gasPrice: 0x01
    },
    tobalaba: {
      host: "localhost",
      port: 8545,
      gas: 79999000,
      network_id: "*"
    },

    // Another network with more advanced options...
    // advanced: {
      // port: 8777,             // Custom port
      // network_id: 1342,       // Custom network
      // gas: 8500000,           // Gas sent with each transaction (default: ~6700000)
      // gasPrice: 20000000000,  // 20 gwei (in wei) (default: 100 gwei)
      // from: <address>,        // Account to send txs from (default: accounts[0])
      // websockets: true        // Enable EventEmitter interface for web3 (default: false)
    // },

    // Useful for deploying to a public network.
    // NB: It's important to wrap the provider as a function.
    // ropsten: {
      // provider: () => new HDWalletProvider(mnemonic, `https://ropsten.infura.io/${infuraKey}`),
      // network_id: 3,       // Ropsten's id
      // gas: 5500000,        // Ropsten has a lower block limit than mainnet
      // confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      // timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      // skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    // },

    // Useful for private networks
    // private: {
      // provider: () => new HDWalletProvider(mnemonic, `https://network.io`),
      // network_id: 2111,   // This network is yours, in the cloud.
      // production: true    // Treats this network as if it was a public net. (default: false)
    // }
  },
  
  compilers: {
    solc: {
      version: "0.5.8",    // Fetch exact version from solc-bin (default: truffle's version)
      docker: false,
      settings: {          // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: false,
          runs: 200
        },
        evmVersion: "petersburg"
      }
    }
  },

  mocha: {
    // reporter: 'mochawesome',
    enableTimeouts: false,
    color: true
  },

  plugins: [ "truffle-security" ]
}
