var config = require('../server.js').config,
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
    systemStarted: "systemStarted",
    nodeDeactivated: "nodeDeactivated",
    nodeActivated: "nodeActivated",
    failedEntry: "failedEntry",
    doorOpened: "doorOpened",
    doorClosed: "doorClosed"
};

eventsChannel.on('connection', function (socket) {
    systemLogger.info('New client connected to events channel');
    
    socket.on('disconnect', function () {
        systemLogger.info('Client disconnected to events channel');
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
    newEvent.save(function (err) {
        if (err) systemLogger.error(err.message);
        eventsChannel.emit(eventType);
    });
};


exports.getLatest = function (req, res) {
    var timeBounded = req.query.to && req.query.from;
    var query = statisticsModel.find({});
    query.sort('-date');
    if (timeBounded)
        query.limit(10000);
    else
        query.limit(20);
    query.populate('user', '_id alias name profilePic tokens');
    query.populate('admin', '_id alias name profilePic');
    query.exec(function (err, stats) {
        if (err) {
            systemLogger.error(err.message);
            return res.status(500).send(err.message);
        }
        var result = [];
        for (var i = 0; i < stats.length; i++) {
            if (stats[i].user) 
                stats[i].user.profilePic = config.serverAddress + "/files/" + stats[i].user.profilePic;
            if (!timeBounded || (moment(stats[i].date).isAfter(moment(req.query.from)) && moment(stats[i].date).isBefore(moment(req.query.to)))) result.push(stats[i]);
        }
        return res.status(200).jsonp(result);
    });
};

