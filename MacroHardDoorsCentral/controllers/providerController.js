var config = require("../server.js").config,
    mongoose = require('mongoose'),
    providerModel = mongoose.model('ProviderModel'),
    fs = require('fs'),
    scheduler = require('node-schedule'),
    mkdirp = require('mkdirp'),
    winston = require('winston');

var systemLogger = winston.loggers.get('system');

var storagePath = './uploads/';

rmdirAsync = function (path, callback) {
    fs.readdir(path, function (err, files) {
        if (err) {
            // Pass the error on to callback
            callback(err, []);
            return;
        }
        var wait = files.length,
            count = 0,
            folderDone = function (err) {
                count++;
                // If we cleaned out all the files, continue
                if (count >= wait || err) {
                    fs.rmdir(path, callback);
                }
            };
        // Empty directory to bail early
        if (!wait) {
            folderDone();
            return;
        }
        
        // Remove one or more trailing slash to keep from doubling up
        path = path.replace(/\/+$/, "");
        files.forEach(function (file) {
            var curPath = path + "/" + file;
            fs.lstat(curPath, function (err, stats) {
                if (err) {
                    callback(err, []);
                    return;
                }
                if (stats.isDirectory()) {
                    exports.rmdirAsync(curPath, folderDone);
                } else {
                    fs.unlink(curPath, folderDone);
                }
            });
        });
    });
};

ensureExists = function (path, cb) {
    mkdirp(path, function (err) {
        if (err) {
            if (err.code == 'EEXIST') cb(null);
            else cb(err);
        } else cb(null);
    });
};

exports.addProvider = function (req, res) {
    providerModel.update({ name: req.body.name }, { $set: { name: req.body.name, url: req.body.url, profilePic: req.files.profilePic.name } }, { upsert: true }, function (err, provider) {
        if (err) {
            systemLogger.error(err.message);
            return res.status(500).send(err.message);
        }
        return res.status(200).send(provider._id);
    });
};

exports.removeProviders = function () {
    systemLogger.info("Cleaning up...");
    providerModel.remove({}, function (err) {
        if (err) {
            return systemLogger.error(err.message);
        }
        rmdirAsync(storagePath, function (err) {
            if (err) systemLogger.error(err.message);
            ensureExists(storagePath, function(err){
                if (err) systemLogger.error(err.message);
            })
        });
        return systemLogger.info("Ready");
    });
};

var cleaningRule = new scheduler.RecurrenceRule();

cleaningRule.hour = 5;
cleaningRule.minute = 0;

scheduler.scheduleJob(cleaningRule, exports.removeProviders);

exports.getProviders = function (req, res) {
    providerModel.find({}, function (err, providers) {
        if (err) {
            systemLogger.error(err.message);
            return res.status(500).send(err.message);
        }
        var result = [];
        for (var i = 0; i < providers.length; i++) {
            var provider = providers[i];
            provider.profilePic = config.serverAddress + "files/" + provider.profilePic;
        }
        return res.status(200).jsonp(providers);
    });
};
