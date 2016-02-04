var fs = require('fs');

var config = JSON.parse(fs.readFileSync('./config.cnf', 'utf8').toString());
exports.config = config;

require('./utils/logger.js');

var winston = require('winston');

var systemLogger = winston.loggers.get('system');

if(config.dummy) {
    var controller = require('./controllers/doorControllerDummy.js');
    systemLogger.info("Using dummy controller");
}
else {
    var controller = require('./controllers/doorController.js');
    systemLogger.info("Using real controller");
}

controller.init();