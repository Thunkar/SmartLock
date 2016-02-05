var config = require('../door.js').config,
    GPIO = require('onoff').Gpio,
    socket = require('socket.io-client')(config.serverAddress + '/doorcomms'),
    winston = require('winston');

var systemLogger = winston.loggers.get('system');

var openPin = new GPIO(4, 'out');
var checkPin = new GPIO(14, 'in', 'both');
var open = checkPin.readSync() == 0;

var openDoor = function() {
    systemLogger.warn('Opening door');
    openPin.writeSync(1);
    setTimeout(function () { openPin.writeSync(0) }, 1000);
};

socket.on('connect', function () {
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

socket.on('error', function (err) {
    systemLogger.error("Socket error: " + err.message);
    process.exit(-1);
});

socket.on('disconnect', function () {
    systemLogger.error("Socket disconnected");
    process.exit(-1);
});


checkPin.watch(function (err, value) {
    if (err) return systemLogger.error(err.message);
    if(open && value == 0 || !open && value == 1) return;
    open = value == 0;
    if (open) {
        systemLogger.info("Door opened");
    } else {
        systemLogger.info("Door closed");
    }
    if (socket) {
        socket.emit('status', { id: config.id, open: open });
    }
});