var services = require("../utils/services.js"),
    config = services.config,
    CodedError = require("../utils/CodedError.js"),
    mongoose = require('mongoose'),
    userModel = mongoose.model('UserModel'),
    tokenModel = mongoose.model('TokenModel'),
    stats = require('./statisticsController.js'),
    request = require('request'),
    moment = require('moment'),
    Promise = require('bluebird'),
    winston = require('winston');

var systemLogger = winston.loggers.get('system');

var storagePath = './uploads/';


exports.createTokenPattern = function (req, res, next) {
    var newToken = new tokenModel({
        name: req.body.name,
        doors: req.body.doors,
        validity: req.body.validity,
        default: req.body.default
    });
    newToken.save().then(() => {
        stats.generateEvent(stats.eventType.newTokenPattern, null, null, newToken._id, req.body.doors);
        return res.status(200).send(newToken._id);
    }, (err) => {
        return next(err);
    });
};

exports.getTokenPattern = function (req, res, next) {
    var token;
    tokenModel.findById(req.params.token).lean().exec().then((storedToken) => {
        token = storedToken;
        if (!token) return next(new CodedError("Token not found", 404));
        return userModel.find({ 'tokens._id': token._id }).lean().exec();
    }).then((users) => {
        token.users = users.map((user) => {
            return {
                _id: user._id,
                alias: user.alias,
                name: user.name,
                profilePic: config.serverAddress + config.mountPoint + "/files/" + user.profilePic,
                active: user.active,
                email: user.email
            };
        });
        return res.status(200).jsonp(token);
    }, (err) => {
        return next(err);
    });
};


exports.deleteTokenPattern = function (req, res, next) {
    tokenModel.findByIdAndRemove(req.params.token).exec().then(() => {
        stats.generateEvent(stats.eventType.tokenPatternRevoked, null, null, req.params.token, null);
        return res.status(200).send("Success");
    }, (err) => {
        return next(err);
    });
};

exports.getTokenPatterns = function (req, res, next) {
    tokenModel.find({}).exec().then((tokens) => {
        return res.status(200).jsonp(tokens);
    }, (err) => {
        return next(err);
    });
};

exports.bulkInsertTokenPattern = function (req, res, next) {
    var pattern;
    tokenModel.findById(req.params.token).exec().then((token) => {
        pattern = token;
        return userModel.update({ _id: { $in: req.body.users } }, { $push: { tokens: pattern } }, { multi: true }).exec();
    }).then(() => {
        return res.status(200).send("Success");
    }, (err) => {
        return next(err);
    });
}

exports.bulkDeleteTokenPattern = function (req, res, next) {
    var pattern;
    tokenModel.findById(req.params.token).exec().then((token) => {
        pattern = token;
        return userModel.update({ _id: { $in: req.body.users } }, { $pull: { tokens: { _id: pattern._id } } }, { multi: true }).exec();
    }).then(() => {
        return res.status(200).send("Success");
    }, (err) => {
        return next(err);
    });
}