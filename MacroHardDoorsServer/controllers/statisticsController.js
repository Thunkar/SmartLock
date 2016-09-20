var services = require('../utils/services.js'),
    config = services.config,
    eventsChannel = require('../server.js').eventsChannel,
    mongoose = require('mongoose'),
    userModel = mongoose.model('UserModel'),
    adminModel = mongoose.model('AdminModel'),
    statisticsModel = mongoose.model('StatisticsModel'),
    authController = require('./authController.js'),
    moment = require('moment'),
    winston = require('winston');

var systemLogger = winston.loggers.get('system');

exports.eventType = {
    userEntry: "userEntry",
    userRejected: "userRejected",
    nodeHandshake: "nodeHandshake",
    nodeOffline: "nodeOffline",
    newUser: "newUser",
    newAdmin: "newAdmin",
    tokenRevoked: "tokenRevoked",
    newToken: "newToken",
    newTokenPattern: "newTokenPattern",
    tokenPatternRevoked: "tokenPatternRevoked",
    systemStarted: "systemStarted",
    nodeDeactivated: "nodeDeactivated",
    nodeActivated: "nodeActivated",
    failedEntry: "failedEntry",
    doorOpened: "doorOpened",
    doorClosed: "doorClosed"
};

eventsChannel.on('connection', (socket) => {
    if (!socket.handshake.session.admin) {
        systemLogger.warn("Not authenticated client trying to connect to events channel");
        return socket.disconnect();
    }
    systemLogger.info('New client connected to events channel');

    socket.on('disconnect', () => {
        systemLogger.info('Client disconnected from events channel');
    });
});

exports.generateEvent = function (eventType, user, admin, token, door) {
    var newEvent = new statisticsModel({
        event: eventType,
        date: new Date()
    });
    try {
        if (door) newEvent.door = door;
        if (user) newEvent.user = mongoose.Types.ObjectId(user);
        if (token) newEvent.token = mongoose.Types.ObjectId(token);
        if (admin) newEvent.admin = mongoose.Types.ObjectId(admin);
    }
    catch (err) {
        if (err) systemLogger.error(err.message);
    }
    newEvent.save().then(() => {
        eventsChannel.emit("event", { type: eventType });
    }, (err) => {
        return systemLogger.error(err.message);
    });
};


exports.getLatest = function (req, res, next) {
    var timeBounded = req.query.to && req.query.from;
    var query = statisticsModel.find({});
    query.sort('-date');
    if (timeBounded)
        query.limit(10000);
    else
        query.limit(20);
    query.populate('user', '_id alias name profilePic tokens');
    query.populate('admin', '_id alias name profilePic');
    query.exec().then((stats) => {
        var result = [];
        stats.forEach((stat) => {
            if (stat.user)
                stat.user.profilePic = config.serverAddress + config.mountPoint + "/files/" + stat.user.profilePic;
            if (!timeBounded || (moment(stat.date).isAfter(moment(req.query.from)) && moment(stat.date).isBefore(moment(req.query.to)))) result.push(stat);
        });
        return res.status(200).jsonp(result);
    }, (err) => {
        return next(err);
    });
};

