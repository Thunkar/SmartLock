﻿var config = require('../server.js').config,
    winston = require('winston'),
    winstonConfig = require('winston/lib/winston/config'),
    colors = require('colors');

var logLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'cyan',
        debug: 'grey'
    }
};

colors.setTheme({
    SYSTEM: 'red'
});

var formatter = function (category, colorize) {
    return function (options) {
        if (colorize)
            return colors[category]('[' + category + '] ') + winstonConfig.colorize(options.level, '[' + options.level.toUpperCase() + '] ') + colors.grey('[' + new Date(options.timestamp()).toGMTString() + '] ') + (undefined !== options.message ? options.message : '') + (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta, null, 4) : '');
        else
            return '[' + category + '] ' + '[' + options.level.toUpperCase() + '] ' + '[' + new Date(options.timestamp()).toGMTString() + '] ' + (undefined !== options.message ? options.message : '') + (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta, null, 4) : '');
    }
};

winston.loggers.add('system', {
    transports: [
        new winston.transports.Console({
            name: "console",
            handleExceptions: true,
            humanReadableUnhandledException: true,
            levels: logLevels.levels,
            level: config.logLevel,
            colorize: true,
            prettyPrint: true,
            timestamp: function () {
                return Date.now();
            },
            formatter: formatter("SYSTEM", true)
        }),
        new winston.transports.File({
            filename: 'logs/error.log',
            name: "file",
            handleExceptions: true,
            humanReadableUnhandledException: true,
            levels: logLevels.levels,
            level: 'error',
            colorize: true,
            prettyPrint: true,
            json: false,
            timestamp: function () {
                return Date.now();
            },
            formatter: formatter("SYSTEM", false)
        })
    ]
});

winston.addColors(logLevels.colors);