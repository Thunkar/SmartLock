var config = require('../door.js').config,
    authController = require('./authController.js'),
    GPIO = require('onoff').Gpio,
    socket = require('socket.io-client')(config.serverAddress + '/doorcomms', { path: config.mountPoint + '/socket.io' }),
    moment = require('moment'),
    winston = require('winston');

var systemLogger = winston.loggers.get('system');

var openPin = new GPIO(4, 'out');
var checkPin = new GPIO(14, 'in', 'both');
var open = checkPin.readSync() == 0;

function openDoor() {
    if (open) {
        systemLogger.warn('Door already opened');
        return;
    }
    systemLogger.warn('Opening door');
    openPin.writeSync(1);
    setTimeout(() => { openPin.writeSync(0) }, 1000);
};

socket.on('connect', () => {
    var signDate = moment().format("DD/MM/YYYY_hh:mm:ss");
    var signature = authController.generateSignature(signDate, config.providerSecret);
    socket.emit('handshake', {
        name: config.name,
        section: config.section,
        open: false,
        signature: signature,
        signDate: signDate
    }, (data) => {
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


checkPin.watch((err, value) => {
    if (err) return systemLogger.error(err.message);
    if (!config.id) return;
    if (open && value == 0 || !open && value == 1) return;
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