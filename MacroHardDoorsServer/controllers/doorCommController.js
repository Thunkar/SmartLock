var app = require("../server.js"),
    mongoose = require('mongoose'),
    userModel = mongoose.model('UserModel'),
    tokenModel = mongoose.model('TokenModel'),
    doorModel = mongoose.model('DoorModel'),
    authController = require('./authController.js'),
    moment = require('moment'),
    console = process.console;

var heartbeats = {};
var deadCounter = {};

exports.check = function () {
    doorModel.find({}, function (err, doors) {
        if (err) return console.file().time().error(err.message);
        for (var i = 0; i < doors.length; i++) {
            if (!heartbeats[doors[i].id]) {
                deadCounter[doors[i].id] = isNaN(deadCounter[doors[i].id]) ? 0 : deadCounter[doors[i].id] += 1;
                if (deadCounter[doors[i].id] > 2) {
                    console.file().time().error("Node " + doors[i].id + " is dead!");
                } else {
                    console.file().time().warning("Node " + doors[i].id + " might be dead");
                }
            } else {
                delete deadCounter[doors[i].id];
            }

        }
        setTimeout(exports.check, app.env.checkInterval);
    });
};


exports.handshake = function (req, res) {
    doorModel.findOne({ name: req.body.name }, function (err, door) {
        if (err) {
            console.file().time().error(err.message);
            return res.status(500).send(err.message);
        }
        if (door && heartbeats[door.id]) {
            console.file().time().warning("Duplicated door name trying to register in the system from ip: " + req.ip);
            return res.status(400).send("Duplicated name");
        }
        var newDoor = {
            name: req.body.name,
            section: req.body.section,
            ip: req.ip,
            lastHeartbeat: new Date()
        }
        doorModel.update({ name: req.body.name }, newDoor, { upsert: true }, function (err, door) {
            if (err) {
                console.file().time().error(err.message);
                return res.status(500).send(err.message);
            }
            return res.status(200).send(door.upserted[0]._id);
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
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        if (!door) return res.status(404).send("Door does not exist");
        var timeoutId = setTimeout(function () {
            answerHeartbeat(door)
        }, app.env.pingInterval);
        heartbeats[door.id] = { res: res, timeoutId: timeoutId };
        door.lastHeartbeat = new Date();
        door.save(function (err) {
            if (err) {
                console.file().time().err(err.message);
            }
        });
    });
};

exports.openDoor = function (doorName, retries, callback) {
    if (retries > 2) return callback(new Error("Door not available"));
    doorModel.findOne({ name: doorName }, function (err, door) {
        if (err) return callback(err);
        if (!door) return callback(new Error("Door does not exist"));
        if (!heartbeats[door.id]) {
            setTimeout(function () {
                exports.openDoor(door, ++retries, callback);
            }, app.env.openRetryTimeout);
        }
        else {
            clearTimeout(heartbeats[door.id].timeoutId);
            heartbeats[door.id].res.status(200).send("OPEN");
            delete heartbeats[door.id];
            console.file().time().system("Sent OPEN to door: " + door.name + " with id: " + door.id);
            result = { door: door };
            callback(err, result);
        }
    });
};


exports.setDoorStatus = function (req, res) {
    doorModel.findById(req.body.id, function (err, door) {
        if (err) {
            console.file().time().error(err.message);
            return res.status(500).send(err.message);
        }
        if (!door) return res.status(404).send("Door not found");
        door.open = req.body.open;
        door.save(function (err) {
            if (err) {
                console.file().time().error(err.message);
                return res.status(500).send(err.message);
            }
            return res.status(200).send("Updated");
        });
    });
};

exports.hearbeats = heartbeats;