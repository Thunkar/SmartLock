var config = require('../door.js').config,
    request = require('request'),
    GPIO = require('onoff').Gpio,
    winston = require('winston');

var systemLogger = winston.loggers.get('system');

var failedHeartbeats = 0;
var openPin = new GPIO(4, 'out');
var checkPin = new GPIO(14, 'in', 'both');
var open = checkPin.readSync() == 0;

exports.init = function () {
    request.post(config.serverAddress + "/api/doorcomms/handshake", {
        json: {
            name: config.name,
            section: config.section,
            open: open
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
    openPin.writeSync(1);
    setTimeout(function () { openPin.writeSync(0) }, 1000);
};

function doHeartbeat() {
    console.time().file().log("Pinging the server...")
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
                console.file().time().log("Server responded: " + body);
                if (body === "OPEN" && !open) openDoor();
            }
            doHeartbeat();
        });
};

checkPin.watch(function (err, value) {
    if (err) return systemLogger.error(err.message);
    if(open && value == 0 || !open && value == 1) return;
    open = value == 0;
    if (open) {
        console.file().time().log("Door opened");
    } else {
        console.file().time().log("Door closed");
    }
    request.post(config.serverAddress + "/api/doorcomms/status", {
        json: {
            id: config.id,
            open: open
        }
    }, function (err, response, body) {
            if (err) return systemLogger.error(err.message);
            else if (response.statusCode != 200) {
                systemLogger.error("Server, responded with an error D:");
            }
            else {
                console.file().time().log("Server responded: " + body);
            }
        });
});