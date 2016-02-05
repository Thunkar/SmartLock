﻿var fs = require('fs');

var config = JSON.parse(fs.readFileSync('./config.cnf', 'utf8').toString());
exports.config = config;

require('./utils/logger.js');

var express = require('express'),
    app = express(),
    io = require('socket.io')(),
    server = require('http').Server(app),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    fileStore = require('session-file-store')(session),
    mongoose = require('mongoose'),
    doorModel = require('./models/doorModel.js')(app, mongoose),
    doorModel = mongoose.model('DoorModel'),
    userModel = require('./models/userModel.js')(app, mongoose),
    adminModel = require('./models/adminModel.js')(app, mongoose),
    statisticsModel = require('./models/statisticsModel.js')(app, mongoose),
    winston = require('winston');

var eventsChannel = io.of('/events');
var doorsChannel = io.of('/doorcomms');
exports.doorsChannel = doorsChannel;
exports.eventsChannel = eventsChannel;

var doorCommController = require('./controllers/doorCommController.js'),
    userController = require('./controllers/userController.js'),
    stats = require('./controllers/statisticsController.js');


mongoose.connect(config.dbAddress, function (err) {
    if (err) {
        systemLogger.error("could not connect to DB: " + err);
        process.exit(-1);
    }
    else {
        systemLogger.info("Connected to DB");
        systemLogger.info("Cleaning up...");
        doorModel.remove({}, function (err) {
            if (err) {
                systemLogger.error(err.message);
                process.exit(1);
            }
            stats.generateEvent(stats.eventType.systemStarted, null, null, null, null);
            userController.register();
            systemLogger.info("Ready to receive handshakes");
        });
    }
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
var sessionStore = new fileStore({ retries: 10, maxTimeout: 300 });
app.use(session({ store: sessionStore, secret: config.secret, resave: false, saveUninitialized: false, proxy: true, name: "macroharddoors", cookie: { secure: false, maxAge: null } }));
app.enable('trust proxy');

var systemLogger = winston.loggers.get('system');

var doors = require('./routes/doors.js'),
    users = require('./routes/users.js'),
    mobile = require('./routes/mobile.js'),
    statistics = require('./routes/statistics.js');

app.use("/api/doors", doors);
app.use("/api/users", users);
app.use("/api/mobile", mobile);
app.use("/api/statistics", statistics),
app.use(express.static(__dirname + "/frontend"));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/frontend/index.html');
});

app.get('/files/:file', function (req, res) {
    res.sendFile(__dirname + '/uploads/' + req.params.file);
});

io.attach(server);

server.listen(config.port, function () {
    systemLogger.info('Main server listening on port: ' + config.port);
});