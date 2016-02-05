var config = require('../door.js').config,
    request = require('request'),
    winston = require('winston');

var systemLogger = winston.loggers.get('system');

var failedHeartbeats = 0;
var open = false;

exports.init = function () {
    request.post(config.serverAddress + "/api/doorcomms/handshake", {
        json: {
            name: config.name,
            section: config.section,
            open: false
        }
    }, function (err, response, body) {
        if (err) {
            systemLogger.error("Handshake failed!: " + err.message);
            systemLogger.error("No id, killing myself...");
            process.exit(1);

        } else {
            systemLogger.info("Handshake returned: " + response.statusCode + ", id is: " + body);
            if (response.statusCode != 200) {
                systemLogger.error("Handshake failed!: " + body);
                systemLogger.error("No id, killing myself...");
                process.exit(1);
            }
            config.id = body;
            doHeartbeat();
        }
    });
};

function openDoor() {
    systemLogger.warn('Opening door');
};

function doHeartbeat() {
    systemLogger.info("Pinging the server...")
    if (!config.id) {
        systemLogger.error("No id, killing myself...");
        process.exit(1);
    }
    request.post(config.serverAddress + "/api/doorcomms/heartbeat", {
        json: {
            id: config.id
        }
    }, function (err, response, body) {
        if (err) {
            systemLogger.error(err.message);
            if (++failedHeartbeats > 10) {
                systemLogger.error("No response from server, killing myself...");
                process.exit(1);
            }
        }
        else if (response.statusCode != 200) {
            if (++failedHeartbeats > 10) {
                systemLogger.error("No response from server, killing myself...");
                process.exit(1);
            }
        }
        else {
            systemLogger.info("Server responded: " + body);
            if (body === "OPEN") openDoor();
        }
        doHeartbeat();
    });
};