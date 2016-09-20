var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var winston = require('winston'),
    fs = require('fs'),
    config = require('../services.js').config;

var servicesLogger = winston.loggers.get('services');

servicesLogger.info("Loading DB models");

fs.readdirSync("./utils/services/dbModels").filter(function (file) {
    return (file.indexOf(".") !== 0);
}).forEach(function (file) {
    require("./dbModels/" + file);
});

var options = {
    user: config.dbUser,
    pass: config.dbPass,
    replset: function () {
        if (config.rsName)
            return { rs_name: config.rsName }
        else return undefined;
    } (),
    server: function () {
        if (config.rsName)
            return { poolSize: config.dbConnectionPoolSize }
        else return undefined;
    } ()
}

if (config.rsName)
    options.server.socketOptions = options.replset.socketOptions = { keepAlive: 1 };

mongoose.connect(config.dbAddress, options, function (err) {
    if (err) {
        servicesLogger.error("Could not connect to DB: " + err);
        process.exit(-1);
    }
    else {
        servicesLogger.info("Connected to DB");
    }
});