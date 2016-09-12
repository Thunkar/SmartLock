var services = require("../utils/services.js"),
    config = services.config,
    CodedError = require("../utils/CodedError.js"),
    mongoose = require('mongoose'),
    userModel = mongoose.model('UserModel'),
    adminModel = mongoose.model('AdminModel'),
    authController = require('./authController.js'),
    stats = require('./statisticsController.js'),
    fs = require('fs'),
    request = require('request'),
    moment = require('moment'),
    winston = require('winston');

var systemLogger = winston.loggers.get('system');

var storagePath = './uploads/';

exports.createNewUser = function (req, res, next) {
    var newUser;
    authController.generateSaltedPassword(req.body.password, config.pwdIterations).then((saltedPassword) => {
        newUser = new userModel({
            alias: req.body.alias,
            password: saltedPassword,
            name: req.body.name,
            profilePic: req.files.profilePic.name,
            tokens: [],
            active: true,
            email: req.body.email
        });
        return newUser.save();
    }).then(() => {
        stats.generateEvent(stats.eventType.newUser, newUser._id, null, null, null);
        return res.status(200).send(newUser._id);
    }, (err) => {
        return next(err);
    });
};

exports.editUser = function (req, res, next) {
    var updatedUser, user;
    userModel.findById(req.params.user).exec().then((storedUser) => {
        user = storedUser;
        if (!user) return next(new CodedError("User not found", 404));
        updatedUser = {
            name: req.body.name || user.name,
            profilePic: user.profilePic,
            password: req.body.password || user.password,
            email: req.body.email || user.email,
            active: req.body.active || user.active
        };
        if (req.files.profilePic) {
            updatedUser.profilePic = req.files.profilePic.name;
            services.fileUtils.deleteFile(storagePath + user.profilePic).catch((err) => { systemLogger.error(err.message) });
        }
        var tasks = [];
        if (req.body.password)
            tasks.push(authController.generateSaltedPassword(req.body.password, config.pwdIterations));
        return Promise.all(tasks);
    }).then((results) => {
        if (results[0])
            user.pwd = results[0]
        user.name = updatedUser.name;
        user.profilePic = updatedUser.profilePic;
        user.email = updatedUser.email;
        return user.save();
    }).then(() => {
        return res.status(200).send("Success");
    }, (err) => {
        return next(err);
    });
};

exports.activateUser = function (req, res, next) {
    userModel.findByIdAndUpdate(req.params.user, { $set: { active: req.body.active } }).exec().then((user) => {
        return res.status(200).send("Success");
    }, (err) => {
        return next(err);
    });
};

exports.deleteUser = function (req, res, next) {
    userModel.findByIdAndRemove(req.params.user).exec().then((user) => {
        services.fileUtils.deleteFile(storagePath + user.profilePic).catch((err) => { systemLogger.error(err.message) });
        return res.status(200).send("Success");
    }, (err) => {
        return next(err);
    });
};


exports.addNewToken = function (req, res, next) {
    var newToken = {
        _id: mongoose.Types.ObjectId(),
        name: req.body.name,
        doors: req.body.doors,
        validity: req.body.validity,
    };
    userModel.findByIdAndUpdate(req.params.user, { $push: { tokens: newToken } }).exec().then((user) => {
        stats.generateEvent(stats.eventType.newToken, req.params.user, null, newToken._id, req.body.doors);
        return res.status(200).send(newToken._id);
    }, (err) => {
        return next(err);
    });
};

exports.revokeToken = function (req, res, next) {
    userModel.findByIdAndUpdate(req.params.user, { $pull: { tokens: { _id: mongoose.Types.ObjectId(req.body.token) } } }).exec().then((err) => {
        stats.generateEvent(stats.eventType.tokenRevoked, req.params.user, null, req.body.token, null);
        return res.status(200).jsonp("Removed");
    }, (err) => {
        return next(err);
    });
};

exports.getUserInfo = function (req, res, next) {
    userModel.findById(req.params.user).exec().then((user) => {
        if (!user) return next(new CodedError("User not found", 404));
        var userToSend = {
            _id: user._id,
            alias: user.alias,
            name: user.name,
            profilePic: config.serverAddress + config.mountPoint + "/files/" + user.profilePic,
            tokens: user.tokens,
            active: user.active,
            email: user.email
        };
        return res.status(200).jsonp(userToSend);
    }, (err) => {
        return next(err);
    });
};

exports.getUsers = function (req, res, next) {
    userModel.find({}).exec().then((users) => {
        var result = users.map((user) => {
            return {
                _id: user._id,
                alias: user.alias,
                name: user.name,
                profilePic: config.serverAddress + config.mountPoint + "/files/" + user.profilePic,
                active: user.active,
                email: user.email
            };
        });
        return res.status(200).jsonp(result);
    }, (err) => {
        return next(err);
    });
};
