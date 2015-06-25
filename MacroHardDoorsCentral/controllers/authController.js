var SHA256 = require("crypto-js/sha256"),
    app = require('../server.js'),
    console = process.console;


generateSignature = function (date) {
    var toSign = date + "_" + app.env.mainServerSecret;
    return SHA256(toSign);
}


exports.authAndContinue = function (req, res, next) {
    var date = req.get("signDate");
    var sentSignature = req.get("signature");
    var signature = generateSignature(date);
    if (signature == sentSignature) {
        next();
    }
    else {
        return res.status(403).send("Not authorized");
    }
};