var config = require('../door.js').config,
    socket = require('socket.io-client')(config.serverAddress + '/doorcomms'),
    winston = require('winston');

var systemLogger = winston.loggers.get('system');

var open = false;

function openDoor() {
    systemLogger.warn('Opening door');
};

socket.on('connect', () => {
    socket.emit('handshake', {
        name: config.name,
        section: config.section,
        open: false
    }, function (data) {
        if (data) {
            config.id = data.id;
            systemLogger.info("Handshake completed, id: " + data.id);
        }
        else {
            systemLogger.error("Handshake failed!: " + body);
            systemLogger.error("No id, killing myself...");
            process.exit(1);
        }
    });
});

socket.on('open', openDoor);

socket.on('error', (err) => {
    systemLogger.error("Socket error: " + err.message);
    process.exit(-1);
});

socket.on('disconnect', () => {
    systemLogger.error("Socket disconnected");
    process.exit(-1);
});