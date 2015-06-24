var app = require("../server.js"),
    mongoose = require('mongoose'),
    userModel = mongoose.model('UserModel'),
    adminModel = mongoose.model('AdminModel'),
    statisticsModel = mongoose.model('StatisticsModel'),
    authController = require('./authController.js'),
    console = process.console;

exports.eventType = {
    userEntry: "userEntry",
    userRejected: "userRejected",
    nodeHandshake: "nodeHandshake",
    nodeOffline: "nodeOffline",
    newUser: "newUser",
    newAdmin: "newAdmin",
    tokenRevoked: "tokenRevoked",
    newToken: "tokenAdded",
    systemStarted: "systemStarted"
};

exports.generateEvent = function (eventType, user, admin, token, door) {
    var newEvent = new statisticsModel( {
        event: eventType,
        user: user,
        token: token,
        admin: admin,
        door: door,
        date: new Date()
    });
    newEvent.save(function (err) {
        if(err) console.file().time().error(err.message);
    });
};


exports.getLatest = function (req, res) {
    var query = statisticsModel.find({});
    query.sort('-date');
    query.limit(20);
    query.exec(function (err, stats){
        if (err) {
            console.file().time().error(err.message);
            return res.status(500).send(err.message);
        }
        return res.status(200).jsonp(stats);
    })
};

