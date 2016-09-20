var config = require("../server.js").config,
    fileUtils = require('../utils/fileUtils.js'),
    mongoose = require('mongoose'),
    providerModel = mongoose.model('ProviderModel'),
    scheduler = require('node-schedule'),
    winston = require('winston');

Date.prototype.addDays = function (days) {
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
}

var systemLogger = winston.loggers.get('system');

var storagePath = './uploads/';

exports.addProvider = function (req, res, next) {
    providerModel.update({ name: req.body.name }, { $set: { name: req.body.name, url: req.body.url, profilePic: req.files.profilePic.name, lastRegistered: new Date() } }, { upsert: true }).exec().then((provider) => {
        return res.status(200).send(provider._id);
    }, (err) => {
        return next(err);
    });
};

exports.removeProviders = function () {
    systemLogger.info("Cleaning up...");
    providerModel.remove({ $lte: { lastRegistered: new Date().addDays(-3) } }).exec().then(() => {
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

cleaningRule.minute = 0;

scheduler.scheduleJob(cleaningRule, exports.removeProviders);

exports.getProviders = function (req, res, next) {
    providerModel.find({}).exec().then((providers) => {
        providers.forEach((provider) => {
            provider.profilePic = config.serverAddress + "files/" + provider.profilePic;
        });
        return res.status(200).jsonp(providers);
    }, (err) => {
        return next(err);
    });
};
