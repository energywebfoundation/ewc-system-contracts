const steps = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

function calculateBlockReward(_blockNumber) {
    const rem = _blockNumber % 100;
    
    for (i = 0; i < steps.length; i++) {
        if (rem <= steps[i]) {
            return 110 - steps[i];
        }
    }
    return 0;
}

module.exports = {
    calculateBlockReward
};
