var services = require('../utils/services.js'),
    CodedError = require('../utils/CodedError.js'),
    config = services.config,
    mongoose = require('mongoose'),
    userModel = mongoose.model('UserModel'),
    statsModel = mongoose.model('StatisticsModel'),
    authController = require('./authController.js'),
    stats = require('./statisticsController.js'),
    Promise = require('bluebird'),
    moment = require('moment'),
    winston = require('winston');

var systemLogger = winston.loggers.get('system');

var storagePath = './uploads/';

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

exports.createNewUser = function (req, res, next) {
    authController.generateSaltedPassword(req.body.password, config.pwdIterations).then((saltedPassword) => {
        var newUser = new userModel({
            alias: req.body.alias,
            pwd: req.body.password,
            name: req.body.name,
            email: req.body.email,
            profilePic: req.files.profilePic.name,
            tokens: [],
            active: false
        });
        return newUser.save();
    }).then(() => {
        stats.generateEvent(stats.eventType.newUser, newUser._id, null, null, null);
        var userToSend = {
            _id: newUser._id.toString(),
            alias: newUser.alias,
            accessToken: newUser.accessToken,
            active: newUser.active
        };
        return res.status(200).jsonp(userToSend);
    }, (err) => {
        return next(err);
    });
};

exports.editUser = function (req, res, next) {
    var user, updatedUser;
    userModel.findById(req.params.user).exec().then((storedUser) => {
        user = storedUser;
        if (!user) return next(new CodedError("User not found", 404));
        updatedUser = {
            name: req.body.name || user.name,
            profilePic: user.profilePic,
            email: req.body.email || user.email
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

exports.deleteUser = function (req, res, next) {
    userModel.findByIdAndRemove(req.body.user).exec().then((user) => {
        services.fileUtils.deleteFile(storagePath + user.profilePic).catch((err) => { systemLogger.error(err.message) });
        return res.status(200).send("Success");
    }, (err) => {
        return next(err);
    });
};


exports.revokeToken = function (req, res, next) {
    userModel.findByIdAndUpdate(req.body.user, { $pull: { tokens: { _id: mongoose.Types.ObjectId(req.body.token) } } }).then(() => {
        stats.generateEvent(stats.eventType.tokenRevoked, req.params.user, null, req.params.token, null);
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
            profilePic: config.serverAddress + config.mountPoint + "files/" + user.profilePic,
            tokens: user.tokens,
            email: user.email,
            active: user.active
        };
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
