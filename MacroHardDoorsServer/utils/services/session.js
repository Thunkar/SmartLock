const session = require('express-session'),
    Promise = require('bluebird'),
    MongoStore = require('connect-mongo')(session),
    config = require('../services.js').config,
    services = require("../services.js"),
    slug = require("slug"),
    winston = require('winston');

const servicesLogger = winston.loggers.get('services');
const sessionLogger = winston.loggers.get('session');
servicesLogger.info("Loading session storage");

var sessionStore;

exports.init = function () {
    return new Promise((resolve, reject) => {
        const store = new MongoStore({
            mongooseConnection: services.dbLoader.connection
        });
        sessionStore = session({
            secret: config.providerSecret,
            store: store,
            resave: false,
            saveUninitialized: false,
            proxy: true,
            name: slug(config.providerName),
            cookie: {
                secure: false,
                maxAge: config.tokenExpiration*24*60*60*1000
            }
        });
        exports.store = sessionStore;
        return resolve();
    })
};