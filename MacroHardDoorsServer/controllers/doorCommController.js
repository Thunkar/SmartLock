var config = require("../server.js").config,
    mongoose = require('mongoose'),
    userModel = mongoose.model('UserModel'),
    doorModel = mongoose.model('DoorModel'),
    authController = require('./authController.js'),
    stats = require('./statisticsController.js'),
    moment = require('moment'),
    winston = require('winston');

var systemLogger = winston.loggers.get('system');

var heartbeats = {};
var deadCounter = {};

exports.check = function () {
    doorModel.find({}, function (err, doors) {
        if (err) return systemLogger.error(err.message);
        for (var i = 0; i < doors.length; i++) {
            if (!heartbeats[doors[i].id] && doors[i].online) {
                deadCounter[doors[i].id] = isNaN(deadCounter[doors[i].id]) ? 0 : deadCounter[doors[i].id] += 1;
                if (deadCounter[doors[i].id] == 3) {
                    systemLogger.error("Node " + doors[i].name + " with id " + doors[i].id + " is dead!");
                    delete deadCounter[doors[i].id];
                    doorModel.findByIdAndUpdate(doors[i].id, { $set: { online: false, active : false }}, function (err) { if (err) systemLogger.error(err.message); });
                    stats.generateEvent(stats.eventType.nodeOffline, null, null, null, doors[i].name);
                } else {
                    systemLogger.warn("Node " + doors[i].name + " with id " + doors[i].id + " might be dead");
                }
            } else if (heartbeats[doors[i].id]) {
                delete deadCounter[doors[i].id];
                doorModel.findByIdAndUpdate(doors[i].id, { $set: { online: true } }, function (err) { if (err) systemLogger.error(err.message); });
            }
        }
        setTimeout(exports.check, config.checkInterval);
    });
};


exports.handshake = function (req, res) {
    doorModel.findOne({ name: req.body.name }, function (err, door) {
        if (err) {
            systemLogger.error(err.message);
            return res.status(500).send(err.message);
        }
        if (door && heartbeats[door.id]) {
            systemLogger.warn("Duplicated door name trying to register in the system from ip: " + req.ip);
            return res.status(400).send("Duplicated name");
        }
        var newDoor = {
            name: req.body.name,
            section: req.body.section,
            ip: req.ip,
            lastHeartbeat: new Date(),
            active: config.activeDoorsDefault,
            online: true,
            open: req.body.open
        }
        doorModel.update({ name: newDoor.name }, newDoor, { upsert: true }, function (err, door) {
            if (err) {
                systemLogger.error(err.message);
                return res.status(500).send(err.message);
            }
            stats.generateEvent(stats.eventType.nodeHandshake, null, null, null, newDoor.name);
            if (door.upserted) {
                systemLogger.info("Door " + newDoor.name + " registered with id: " + door.upserted[0]._id + " and ip: " + req.ip);
                return res.status(200).send(door.upserted[0]._id);
            }
            doorModel.findOne({ name: newDoor.name }, function (err, door) {
                systemLogger.info("Door " + door.name + " re-registered with id: " + door.id + " and ip: " + req.ip);
                return res.status(200).send(door.id);
            });
        });
    });
};

function answerHeartbeat(door) {
    if (heartbeats[door.id]) {
        heartbeats[door.id].res.status(200).send("ACK");
        delete heartbeats[door.id];
    }
};

exports.heartbeat = function (req, res) {
    doorModel.findById(req.body.id, function (err, door) {
        if (err) {
            systemLogger.error(err.message);
            return res.status(500).send(err.message);
        }
        if (!door) return res.status(404).send("Door does not exist");
        var timeoutId = setTimeout(function () {
            answerHeartbeat(door);
        }, config.pingInterval);
        heartbeats[door.id] = { res: res, timeoutId: timeoutId, name: door.name };
        door.lastHeartbeat = new Date();
        door.save(function (err) {
            if (err) {
                systemLogger.error(err.message);
            }
        });
    });
};

exports.openDoor = function (doorName, retries, callback) {
    if (retries > 2) return callback(new Error("Door not available"));
    doorModel.findOne({ name: doorName }, function (err, door) {
        if (err) return callback(err);
        if (!door) return callback(new Error("Door does not exist"));
        if (!door.active) return callback(new Error("Door is not active"));
        if (!heartbeats[door.id]) {
            setTimeout(function () {
                exports.openDoor(door, ++retries, callback);
            }, config.openRetryTimeout);
        }
        else {
            clearTimeout(heartbeats[door.id].timeoutId);
            heartbeats[door.id].res.status(200).send("OPEN");
            delete heartbeats[door.id];
            systemLogger.info("Sent OPEN to door: " + door.name + " with id: " + door.id);
            result = { door: door };
            callback(err, result);
        }
    });
};


exports.setDoorStatus = function (req, res) {
    doorModel.findById(req.body.id, function (err, door) {
        if (err) {
            systemLogger.error(err.message);
            return res.status(500).send(err.message);
        }
        if (!door) return res.status(404).send("Door not found");
        door.open = req.body.open;
        if(door.open) stats.generateEvent(stats.eventType.doorOpened, null, null, null, door.name);
        else stats.generateEvent(stats.eventType.doorClosed, null, null, null, door.name);
        door.save(function (err) {
            if (err) {
                systemLogger.error(err.message);
                return res.status(500).send(err.message);
            }
            return res.status(200).send("Updated");
        });
    });
};

exports.hearbeats = heartbeats;