const generateReferenceNumber = function () {
    // Generates a random number between 100,000,000 and 999,999,999
    return Math.floor(100000000 + Math.random() * 900000000).toString();
}

module.exports = generateReferenceNumber