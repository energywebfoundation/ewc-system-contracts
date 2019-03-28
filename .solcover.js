module.exports = {
    skipFiles: ['interfaces','libs', 'misc/Ownable.sol'],
    compileCommand: 'npx truffle compile',
    testCommand: 'npx truffle test --network coverage'
}
