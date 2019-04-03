module.exports = {
    norpc: false,
    testrpcOptions: '-e 1000000000 --port 7545',
    skipFiles: ['interfaces','libs', 'misc/Ownable.sol'],
    compileCommand: 'npx truffle compile',
    testCommand: 'npx truffle test --network coverage'
}
