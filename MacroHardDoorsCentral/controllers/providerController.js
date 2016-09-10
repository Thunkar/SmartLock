var config = require("../server.js").config,
    fileUtils = require('../utils/fileUtils.js'),
    mongoose = require('mongoose'),
    providerModel = mongoose.model('ProviderModel'),
    scheduler = require('node-schedule'),
    winston = require('winston');

var systemLogger = winston.loggers.get('system');

var storagePath = './uploads/';

exports.addProvider = function (req, res, next) {
    providerModel.update({ name: req.body.name }, { $set: { name: req.body.name, url: req.body.url, profilePic: req.files.profilePic.name } }, { upsert: true }).exec().then((provider) => {
        return res.status(200).send(provider._id);
    }, (err) => {
        return next(err);
    });
};

exports.removeProviders = function () {
    systemLogger.info("Cleaning up...");
    providerModel.remove({}).exec().then(() => {
        return fileUtils.rmdirAsync(storagePath);
    }).then(() => {
        return fileUtils.ensureExists(storagePath);
    }).then(() => {
        return systemLogger.info("Ready");
    }, (err) => {
        return systemLogger.error(err.message);
    });
};

var cleaningRule = new scheduler.RecurrenceRule();

cleaningRule.hour = 5;
cleaningRule.minute = 0;
cleaningRule.second = 30;

scheduler.scheduleJob(cleaningRule, exports.removeProviders);

exports.getProviders = function (req, res, next) {
    providerModel.find({}).exec().then((providers) => {
        if (err) {
            systemLogger.error(err.message);
            return res.status(500).send(err.message);
        }
        providers.forEach((provider) => {
            provider.profilePic = config.serverAddress + "files/" + provider.profilePic;
        });
        return res.status(200).jsonp(providers);
    }, (err) => {
        return next(err);
    });
};
