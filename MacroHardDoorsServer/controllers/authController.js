var SHA256 = require("crypto-js/sha256"),
    app = require('../server.js'),
    mongoose = require('mongoose'),
    user = mongoose.model('UserModel'),
    winston = require('winston');

var systemLogger = winston.loggers.get('system');

exports.generateToken = function () {
    var pickFrom = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789=-+#%&";
    var token = "";
    for (var i = 0; i < 40; i++) {
        token += pickFrom.charAt(Math.random() * 59);
    }
    return token;
};

exports.generateSignature = function (date, token) {
    var toSign = date + "_" + token;
    return SHA256(toSign);
}


exports.loginRequired = function (req, res, next) {
    if (!req.session.user) res.status(403).send("Not authorized");
    else next();
}


exports.authMobileUser = function (req, res, next) {
    User.findOne({ alias: req.get("alias") }, function (err, user) {
        if (err) {
            systemLogger.error(err.message);
            return res.status(500).send(err.message);
        }
        if (!user) {
            return res.status(404).send("User does not exist");
        }
        var token = user.token;
        var date = req.get("signDate");
        var sentSignature = req.get("signature");
        var signature = exports.generateSignature(date, token);
        if (signature == sentSignature) {
            next();
        }
        else {
            return res.status(403).send("Not authorized");
        }
    });
};