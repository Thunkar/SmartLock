var app = require("../server.js"),
    mongoose = require('mongoose'),
    userModel = mongoose.model('UserModel'),
    adminModel = mongoose.model('AdminModel'),
    statisticsModel = mongoose.model('StatisticsModel'),
    authController = require('./authController.js'),
    moment = require('moment'),
    console = process.console;

exports.eventType = {
    userEntry: "userEntry",
    userRejected: "userRejected",
    nodeHandshake: "nodeHandshake",
    nodeOffline: "nodeOffline",
    newUser: "newUser",
    newAdmin: "newAdmin",
    tokenRevoked: "tokenRevoked",
    newToken: "newToken",
    systemStarted: "systemStarted"
};

exports.generateEvent = function (eventType, user, admin, token, door) {
    var newEvent = new statisticsModel({
        event: eventType,
        date: new Date()
    });
    if (door) newEvent.door = door;
    if (user) newEvent.user = mongoose.Types.ObjectId(user);
    if (token) newEvent.token = mongoose.Types.ObjectId(token);
    if (admin) newEvent.admin = mongoose.Types.ObjectId(admin);
    newEvent.save(function (err) {
        if (err) console.file().time().error(err.message);
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
            console.file().time().error(err.message);
            return res.status(500).send(err.message);
        }
        var result = [];
        for (var i = 0; i < stats.length; i++) {
            var stat = stats[i];
            if (stat.user) stat.user.profilePic = app.env.serverAddress + "/files/" + stat.user.profilePic;
            if (!timeBounded || (moment(stat.date).isAfter(moment(req.query.from)) && moment(stat.date).isBefore(moment(req.query.to)))) result.push(stat);
        }
        return res.status(200).jsonp(result);
    });
};

