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

registerRule.hour = 5;
registerRule.minute = 1;

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
    adminModel.findOne({ alias: req.body.alias }).exec().then((storedAdmin) => {
        admin = storedAdmin;
        if (!admin) return next(new CodedError("Not found", 404));
        return authController.validateSaltedPassword(req.body.password, admin.pwd.salt, admin.pwd.hash, admin.pwd.iterations);
    }).then((valid) => {
        if (valid) {
            var adminToSend = {
                _id: admin._id.toString(),
                alias: admin.alias,
                name: admin.name
            }
            req.session.admin = adminToSend;
            return res.status(200).send(adminToSend);
        } else return next(new CodedError("Not authorized", 401));
    }, (err) => {
        return next(err);
    });
};

exports.createNewAdmin = function (req, res, next) {
    var newAdmin;
    authController.generateSaltedPassword(req.body.password, config.pwdIterations).then((saltedPassword) => {
        newAdmin = new adminModel({
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

exports.getAdminInfo = function (req, res, next) {
    adminModel.findById(req.params.admin).exec().then((admin) => {
        if (!admin) return next(new CodedError("Admin not found", 404));
        var adminToSend = {
            _id: admin._id,
            alias: admin.alias,
            name: admin.name
        };
        return res.status(200).jsonp(adminToSend);
    }, (err) => {
        return next(err);
    });
};
