var app = require("../server.js"),
    mongoose = require('mongoose'),
    userModel = mongoose.model('UserModel'),
    adminModel = mongoose.model('AdminModel'),
    tokenModel = mongoose.model('TokenModel'),
    doorModel = mongoose.model('DoorModel'),
    authController = require('./authController.js'),
    console = process.console;

var heartbeats = {};

exports.handshake = function (req, res) {
    var newDoor = doorModel({
        name: req.body.name,
        section: req.body.section,
        ip: req.ip,
        lastHeartbeat: new Date()
    });
    newDoor.save(function (err, door) {
        if (err) {
            console.file().time().error(err.message);
            return res.status(500).send(err.message);
        }
        return res.status(200).send(door.id);
    });
};

function answerHeartbeat(door) {
    if (heartbeats[door.id]) {
        heartbeats[door.id].res.status(200).send("ACK");
        delete heartbeats[door.id];
        console.file().time().log("Sent ACK to door: " + door.name + " with id: " + door.id);
    }
};

exports.heartbeat = function (req, res) {
    doorModel.findById(req.body.door, function (err, door) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        if (!door) req.status(404).send("Door does not exist");
        var timeoutId = setTimeout(function () {
            answerHeartbeat(door)
        }, 5000);
        heartbeats[door.id] = { res: res, timeoutId: timeoutId };
        door.lastHeartbeat = new Date();
        door.save(function (err) {
            if (err) {
                console.file().time().err(err.message);
            }
            console.file().time().log("Door: " + door.name + " with id: " + door.id + " is alive at: " + door.lastHeartbeat);
        });
    });
};

function openDoor(door, retries) {
    if (retries > 4) return;
    doorModel.findById(door.id, function (err, door) {
        if (!heartbeats[door.id]) {
            setTimeout(function () {
                openDoor(door, retries++);
            }, 1000);
        }
        else {
            clearTimeout(heartbeats[door.id].timeoutId);
            heartbeats[door.id].res.status(200).send("OPEN");
            delete heartbeats[door.id];
            console.file().time().system("Sent OPEN to door: " + door.name + " with id: " + door.id);
        }
    });
};