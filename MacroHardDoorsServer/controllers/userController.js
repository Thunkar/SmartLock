var services = require("../utils/services.js"),
    config = services.config,
    CodedError = require("../utils/CodedError.js"),
    mongoose = require('mongoose'),
    userModel = mongoose.model('UserModel'),
    adminModel = mongoose.model('AdminModel'),
    authController = require('./authController.js'),
    stats = require('./statisticsController.js'),
    scheduler = require('node-schedule'),
    fs = require('fs'),
    request = require('request'),
    moment = require('moment'),
    winston = require('winston');

var systemLogger = winston.loggers.get('system');

var storagePath = './uploads/';


exports.register = function () {
    var formData = {
        name: config.providerName,
        url: config.serverAddress,
        profilePic: fs.createReadStream(config.providerImg)
    };
    var date = moment().format("DD/MM/YYYY_hh:mm:ss");
    var signature = authController.generateSignature(date, config.mainServerSecret);
    request.post({ url: config.mainServerAddress + "/api/providers", formData: formData, headers: { 'signDate': date, 'signature': signature } }, function (err, httpResponse, body) {
        if (err) {
            return systemLogger.error(err.message);
        }
        if (httpResponse.statusCode != 200) systemLogger.error("Server responded: " + httpResponse.statusCode)
        config.providerId = body.replace(/"/g, '');
        return systemLogger.info("Registered with central server");
    });
};

var registerRule = new scheduler.RecurrenceRule();

registerRule.second = 0;

scheduler.scheduleJob(registerRule, exports.register);

exports.unRegister = function (req, res, next) {
    if (!config.providerId) return next(new CodedError("No id", 400));
    var date = moment().format("DD/MM/YYYY_hh:mm:ss");
    var signature = authController.generateSignature(date, config.mainServerSecret);
    request.post({ url: config.mainServerAddress + "/api/providers/" + config.providerId + "/delete", headers: { 'signDate': date, 'signature': signature } }, (err, httpResponse, body) => {
        if (err) return next(err);
        if (httpResponse.statusCode != 200) return res.status(httpResponse.statusCode).send(body);
        return res.status(200).send("Success");
    });
};

exports.doAdminLogin = function (req, res, next) {
    var admin;
    adminModel.find({ alias: req.body.alias }).exec().then((storedAdmin) => {
        admin = storedAdmin;
        if (!admin) return next(new CodedError("Not found", 404));
        return authController.validateSaltedPassword(req.body.password, admin.pwd.salt, admin.pwd.hash, admin.pwd.iterations);
    }).then((valid) => {
        if (valid) {
            var userToSend = {
                _id: admin._id.toString(),
                alias: admin.alias,
                isAdmin: true
            }
            req.session.user = userToSend;
            return res.status(200).send("Success");
        } else return next(new CodedError("Not authorized", 401));
    }, (err) => {
        return next(err);
    });
};

exports.createNewAdmin = function (req, res, next) {
    authController.generateSaltedPassword(req.body.password, config.pwdIterations).then((saltedPassword) => {
        var newAdmin = new adminModel({
            alias: req.body.alias,
            pwd: saltedPassword,
            name: req.body.name,
        });
        return newAdmin.save();
    }).then(() => {
        stats.generateEvent(stats.eventType.newAdmin, null, newAdmin.name, null, null);
        return res.status(200).send(newAdmin._id);
    }, (err) => {
        return next(err);
    });
};

exports.createNewUser = function (req, res, next) {
    authController.generateSaltedPassword(req.body.password, config.pwdIterations).then((saltedPassword) => {
        var newUser = new userModel({
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
    userModel.findById(req.params.user).exec().then((user) => {
        if (!user) return next(new CodedError("User not found", 404));
        var updatedUser = {
            name: req.body.name || user.name,
            profilePic: user.profilePic,
            password: req.body.password || user.password,
            email: req.body.email || user.email,
            active: req.body.active || user.active
        };
        if (req.files.profilePic) {
            updatedUser.profilePic = req.files.profilePic.name;
            services.fileUtils.deleteFile(storagePath + user.profilePic).then(() => systemLogger.debug("Deleted file"), (err) => { systemLogger.error(err.message) });
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
        services.fileUtils.deleteFile(storagePath + user.profilePic).then(() => systemLogger.debug("Deleted file"), (err) => { systemLogger.error(err.message) });
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
            alias: user.alias,
            name: user.name,
            profilePic: config.serverAddress + "/files/" + user.profilePic,
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
                profilePic: config.serverAddress + "/files/" + user.profilePic,
                active: user.active,
                email: user.email
            };
        });
        return res.status(200).jsonp(result);
    }, (err) => {
        return next(err);
    });
};
