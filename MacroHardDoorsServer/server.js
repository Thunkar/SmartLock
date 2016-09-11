﻿process.env.BLUEBIRD_W_FORGOTTEN_RETURN = 0;

var services = require('./utils/services.js'),
    express = require('express'),
    app = express(),
    io = require('socket.io')(),
    server = require('http').Server(app),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    mongoose = require('mongoose'),
    winston = require('winston');

var eventsChannel = io.of('/events');
var doorsChannel = io.of('/doorcomms');
exports.doorsChannel = doorsChannel;
exports.eventsChannel = eventsChannel;

services.init().then(() => {
    var config = services.config,
        systemLogger = winston.loggers.get('system'),
        doorCommController = require('./controllers/doorCommController.js'),
        userController = require('./controllers/userController.js'),
        stats = require('./controllers/statisticsController.js'),
        resultController = require('./controllers/resultController.js'),
        doorModel = mongoose.model('DoorModel');

    systemLogger.info("Connected to DB");
    systemLogger.info("Cleaning up...");
    doorModel.remove({}).then(() => {
        stats.generateEvent(stats.eventType.systemStarted, null, null, null, null);
        userController.register();
        systemLogger.info("Ready to receive handshakes");
    }, (err) => {
        systemLogger.error(err.message);
        process.exit(1);
    });

    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
    app.use(services.session.store);
    app.enable('trust proxy');

    var doors = require('./routes/doors.js'),
        users = require('./routes/users.js'),
        admins = require('./routes/admins.js'),
        mobile = require('./routes/mobile.js'),
        statistics = require('./routes/statistics.js');

    app.use(config.mountPoint + "/api/doors", doors);
    app.use(config.mountPoint + "/api/users", users);
    app.use(config.mountPoint + "/api/admins", admins);
    app.use(config.mountPoint + "/api/mobile", mobile);
    app.use(config.mountPoint + "/api/statistics", statistics);
    app.use(express.static(__dirname + "/frontend"));

    app.get(config.mountPoint + '/', (req, res) => {
        res.sendFile(__dirname + '/frontend/index.html');
    });

    app.get(config.mountPoint + '/files/:file', (req, res) => {
        res.sendFile(__dirname + '/uploads/' + req.params.file);
    });

    app.use(resultController.genericErrorHandler);

    io.attach(server);

    server.listen(config.port, () => {
        systemLogger.info('Main server listening on port: ' + config.port);
    });
})
