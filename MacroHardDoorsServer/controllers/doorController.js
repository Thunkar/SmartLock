var app = require("../server.js"),
    mongoose = require('mongoose'),
    userModel = mongoose.model('UserModel'),
    doorModel = mongoose.model('DoorModel'),
    authController = require('./authController.js'),
    doorCommController = require('./doorCommController.js'),
    stats = require('./statisticsController.js'),
    moment = require('moment'),
    winston = require('winston'); 

var systemLogger = winston.loggers.get('system');

function ensureValidToken(userId, doorName, tokenId, callback) {
    userModel.findById(userId, function (err, user) {
        if (err) return callback(err);
        if(!user) return callback(new Error("User does not exist"));
        var token = null;
        for (var i = 0; i < user.tokens.length; i++) {
            if (user.tokens[i]._id == tokenId) token = user.tokens[i];
        }
        if(!token) return callback(new Error("User does not own that token"));
        if (token.doors.indexOf(doorName) == -1) return callback(new Error("Token cannot open that door"));
        if (token.validity.uses == 0) return callback(new Error("Token is used up"));
        if (token.validity.repeat.length == 0 && moment(token.validity.from).isAfter(moment())) return callback(new Error("The token is not active yet"));
        if (token.validity.repeat.length == 0 && moment(token.validity.to).isBefore(moment())) return callback(new Error("The token has expired"));
        if (token.validity.repeat.length != 0) {
            if (token.validity.repeat.indexOf(moment().day()) == -1) return callback(new Error("The token cannot be used today"));
            if (moment(token.validity.from).isAfter(moment(), 'second')) return callback(new Error("The token is not active yet"));
            if (moment(token.validity.to).isBefore(moment(), 'second')) return callback(new Error("The token has expired"));
        }
        if (token.validity.uses != -1) token.validity.uses--;
        user.save(function (err) {
            return callback(err);
        });
    });
};

exports.open = function (req, res) {
    ensureValidToken(req.body.user, req.body.door, req.body.token, function (err) {
        if (err) {
            stats.generateEvent(stats.eventType.userRejected, req.body.user, null, req.body.token, req.body.door);
            systemLogger.error(err.message);
            return res.status(400).send(err.message);
        }
        doorCommController.openDoor(req.body.door, 0, function (err, result) {
            if (err) {
                stats.generateEvent(stats.eventType.failedEntry, req.body.user, null, req.body.token, req.body.door);
                systemLogger.error(err.message);
                return res.status(500).send(err.message);
            }
            stats.generateEvent(stats.eventType.userEntry, req.body.user, null, req.body.token, req.body.door);
            return res.status(200).send("Opening door");
        });
    });
};

exports.toggleDoor = function (req, res) {
    doorModel.update({ name: req.params.door },{ $set: { active: req.body.active }}, function (err) {
        if (err) {
            systemLogger.error(err.message);
            return res.status(500).send(err.message);
        }
        if(req.body.active)
            stats.generateEvent(stats.eventType.nodeActivated, null, null, null, req.params.door);
        else
            stats.generateEvent(stats.eventType.nodeDeactivated, null, null, null, req.params.door);
        return res.status(200).send("Success");
    });
}

exports.searchDoors = function (req, res) {
    var query;
    if (req.query.door) {
        var regex = "^" + req.query.door + ".*";
        query = doorModel.find({ name : { $regex : regex, $options: "-i" } });
    } else {
        query = doorModel.find({});
    }
    query.exec(function (err, doors) {
        if (err) {
            systemLogger.error(err.message);
            return res.status(500).send(err.message);
        }
        return res.status(200).jsonp({ doors: doors });
    });
};