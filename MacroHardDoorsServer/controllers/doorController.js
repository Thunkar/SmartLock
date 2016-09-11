var services = require('../utils/services.js'),
    CodedError = require('../utils/CodedError.js'),
    config = services.config,
    mongoose = require('mongoose'),
    userModel = mongoose.model('UserModel'),
    doorModel = mongoose.model('DoorModel'),
    authController = require('./authController.js'),
    doorCommController = require('./doorCommController.js'),
    stats = require('./statisticsController.js'),
    moment = require('moment'),
    winston = require('winston');

var systemLogger = winston.loggers.get('system');

function ensureValidToken(userId, doorName, tokenId) {
    return new Promise((resolve, reject) => {
        return userModel.findById(userId).exec();
    }).then((user) => {
        if (!user) return reject(new Error("User does not exist"));
        var token = null;
        user.tokens.forEach((candidate) => {
            if (candidate._id == tokenId) token = candidate;
        })
        if (!token) return reject(new Error("User does not own that token"));
        if (token.doors.indexOf(doorName) == -1) return reject(new Error("Token cannot open that door"));
        if (token.validity.uses == 0) return reject(new Error("Token is used up"));
        if (token.validity.repeat.length == 0 && moment(token.validity.from).isAfter(moment())) return reject(new Error("The token is not active yet"));
        if (token.validity.repeat.length == 0 && moment(token.validity.to).isBefore(moment())) return reject(new Error("The token has expired"));
        if (token.validity.repeat.length != 0) {
            if (token.validity.repeat.indexOf(moment().day()) == -1) return reject(new Error("The token cannot be used today"));
            if (moment(token.validity.from).isAfter(moment(), 'second')) return reject(new Error("The token is not active yet"));
            if (moment(token.validity.to).isBefore(moment(), 'second')) return reject(new Error("The token has expired"));
        }
        if (token.validity.uses != -1) token.validity.uses--;
        return user.save();
    }).then(() => {
        return resolve();
    }, (err) => {
        return reject(err);
    });
};

exports.open = function (req, res, next) {
    ensureValidToken(req.body.user, req.body.door, req.body.token).then(() => {
        return doorCommController.openDoor(req.body.door);
    }).then(() => {
        stats.generateEvent(stats.eventType.userEntry, req.body.user, null, req.body.token, req.body.door);
        return res.status(200).send("Opening door");
    }, (err) => {
        stats.generateEvent(stats.eventType.userRejected, req.body.user, null, req.body.token, req.body.door);
        return next(new CodedError(err.message, 400));
    });
};

exports.toggleDoor = function (req, res, next) {
    doorModel.update({ name: req.params.door }, { $set: { active: req.body.active } }).exec().then(() => {
        if (req.body.active)
            stats.generateEvent(stats.eventType.nodeActivated, null, null, null, req.params.door);
        else
            stats.generateEvent(stats.eventType.nodeDeactivated, null, null, null, req.params.door);
        return res.status(200).send("Success");
    }, (err) => {
        return next(err);
    });
}

exports.searchDoors = function (req, res, next) {
    var query;
    if (req.query.door) {
        var regex = "^" + req.query.door + ".*";
        query = doorModel.find({ name: { $regex: regex, $options: "-i" } });
    } else {
        query = doorModel.find({});
    }
    query.exec().then((doors) => {
        return res.status(200).jsonp({ doors: doors });
    }, (err) => {
        return next(err);
    });
};