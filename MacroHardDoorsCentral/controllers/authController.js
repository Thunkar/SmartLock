var crypto = require("crypto"),
    config = require('../server.js').config;

function computeSHA256Hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

function generateSignature(date, token) {
    var toSign = date + "_" + token;
    return computeSHA256Hash(toSign);
}

exports.authAndContinue = function (req, res, next) {
    var date = req.get("signDate");
    var sentSignature = req.get("signature");
    var signature = generateSignature(date, config.mainServerSecret);
    if (signature == sentSignature) {
        next();
    }
    else {
        return res.status(403).send("Not authorized");
    }
};