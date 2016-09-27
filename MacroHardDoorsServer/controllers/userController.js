var services = require("../utils/services.js"),
    config = services.config,
    CodedError = require("../utils/CodedError.js"),
    mongoose = require('mongoose'),
    userModel = mongoose.model('UserModel'),
    adminModel = mongoose.model('AdminModel'),
    tokenModel = mongoose.model('TokenModel'),
    authController = require('./authController.js'),
    stats = require('./statisticsController.js'),
    fs = require('fs'),
    request = require('request'),
    moment = require('moment'),
    winston = require('winston');

var systemLogger = winston.loggers.get('system');

var storagePath = './uploads/';

exports.createNewUser = function (req, res, next) {
    var newUser, saltedPassword;
    authController.generateSaltedPassword(req.body.password, config.pwdIterations).then((generatedPassword) => {
        saltedPassword = generatedPassword;
        return tokenModel.find({ default: true }).exec();
    }).then((defaultTokens) => {
        var profilePicName = req.files.profilePic ? req.files.profilePic.name : undefined;
        newUser = new userModel({
            alias: req.body.alias,
            pwd: saltedPassword,
            name: req.body.name,
            email: req.body.email,
            profilePic: profilePicName,
            tokens: defaultTokens,
            active: false
        });
        return newUser.save();
    }).then(() => {
        stats.generateEvent(stats.eventType.newUser, newUser._id, null, null, null);
        var userToSend = {
            _id: newUser._id.toString(),
            alias: newUser.alias,
            active: newUser.active
        };
        return res.status(200).jsonp(userToSend);
    }, (err) => {
        return next(err);
    });
};

exports.login = function (req, res, next) {
    var user;
    userModel.findOne({ alias: req.body.alias }).exec().then((storedUser) => {
        user = storedUser;
        if (!user) return next(new CodedError("Not found", 404));
        return authController.validateSaltedPassword(req.body.password, user.pwd.salt, user.pwd.hash, config.pwdIterations);
    }).then((valid) => {
        if (valid) {
            var userToSend = {
                _id: user._id.toString(),
                alias: user.alias,
                active: user.active
            };
            req.session.user = userToSend;
            return res.status(200).jsonp(userToSend);
        } else {
            return next(new CodedError("Not authorized", 401));
        }
    }, (err) => {
        return next(err);
    });
};

exports.editUser = function (req, res, next) {
    var updatedUser, user;
    if (!req.session.admin && req.session.user && (req.session.user._id != req.params.user)) return next(new CodedError("Not authorized", 403));
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
            profilePic: function () {
                if (user.profilePic)
                    return config.serverAddress + config.mountPoint + "/files/" + user.profilePic;
                else
                    return config.serverAddress + config.mountPoint + "/files/profile.png";

            } (),
            tokens: user.tokens,
            active: user.active,
            email: user.email
        };
        if (req.session.user && (req.params.user == req.session.user._id)) {
            req.session._garbage = new Date();
            req.session.touch();
        }
        return res.status(200).jsonp(userToSend);
    }, (err) => {
        return next(err);
    });
};

exports.getUserStats = function (req, res, next) {
    var query = statsModel.find({ user: req.params.user });
    query.sort('-date');
    query.limit(20);
    query.exec().then((stats) => {
        return res.status(200).jsonp(stats);
    }, (err) => {
        return next(err);
    });
}

exports.getUsers = function (req, res, next) {
    userModel.find({}).exec().then((users) => {
        var result = users.map((user) => {
            return {
                _id: user._id,
                alias: user.alias,
                name: user.name,
                profilePic: function () {
                    if (user.profilePic)
                        return config.serverAddress + config.mountPoint + "/files/" + user.profilePic;
                    else
                        return config.serverAddress + config.mountPoint + "/files/profile.png";

                } (),
                active: user.active,
                email: user.email
            };
        });
        return res.status(200).jsonp(result);
    }, (err) => {
        return next(err);
    });
};
