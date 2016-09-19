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
        validity: req.body.validity
    });
    newToken.save().then(() => {
        return res.status(200).send(newToken._id);
    }, (err) => {
        return next(err);
    });
};

exports.getTokenPattern = function (req, res, next) {
    var token;
    tokenModel.findById(req.params.token).exec().then((storedToken) => {
        var token = storedToken;
        if (!token) return next(new CodedError("Token not found", 404));
        return userModel.find({ 'tokens._id': token._id }).exec();
    }).then((users) => {
        token.users = users;
        return res.status(200).jsonp(token);
    }, (err) => {
        return next(err);
    });
};


exports.deleteTokenPattern = function (req, res, next) {
    tokenModel.findByIdAndRemove(req.params.token).exec().then((token) => {
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
        return userModel.update({ _id: { $in: req.body.users } }, { $pull: { tokens: pattern } }, { multi: true }).exec();
    }).then(() => {
        return res.status(200).send("Success");
    }, (err) => {
        return next(err);
    });
}