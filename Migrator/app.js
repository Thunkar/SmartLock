var winston = require('winston'),
    services = require('./utils/services.js');

services.init();
var systemLogger = winston.loggers.get("system");
require('./scripts/' + services.config.script + '.js');
