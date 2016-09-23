const crypto = require("crypto"),
    config = require('../door.js').config;

function computeSHA256Hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

function generateSignature(date, token) {
    var toSign = date + "_" + token;
    return computeSHA256Hash(toSign);
}

exports.generateSignature = generateSignature;