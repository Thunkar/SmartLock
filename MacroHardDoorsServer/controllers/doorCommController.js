var config = require("../server.js").config,
    doorsChannel = require('../server.js').doorsChannel,
    mongoose = require('mongoose'),
    doorModel = mongoose.model('DoorModel'),
    stats = require('./statisticsController.js'),
    winston = require('winston');

var systemLogger = winston.loggers.get('system');

var doors = {};

doorsChannel.on('connection', function (socket) {

    systemLogger.info('New door connected');
    
    var registeredDoor;
    
    socket.on('handshake', function (data, callback) {
        doorModel.findOne({ name: data.name }, function (err, door) {
            if (err) {
                systemLogger.error(err.message);
                return res.status(500).send(err.message);
            }
            if (door && doors[door.id]) {
                systemLogger.warn("Duplicated door name trying to register in the system: " + door.name);
                return socket.disconnect();
            }
            var newDoor = {
                name: data.name,
                section: data.section,
                lastHeartbeat: new Date(),
                active: config.activeDoorsDefault,
                online: true,
                open: data.open
            }
            doorModel.update({ name: newDoor.name }, newDoor, { upsert: true }, function (err, door) {
                if (err) {
                    systemLogger.error(err.message);
                    return socket.disconnect();
                }
                stats.generateEvent(stats.eventType.nodeHandshake, null, null, null, newDoor.name);
                if (door.upserted) {
                    door.id = door.upserted[0]._id;
                    systemLogger.info("Door " + newDoor.name + " registered with id: " + door.id);
                    registeredDoor = door;
                    registeredDoor.socket = socket;
                    doors[registeredDoor.id] = registeredDoor;
                    return callback({ id: door.upserted[0]._id });
                }
                doorModel.findOne({ name: newDoor.name }, function (err, door) {
                    systemLogger.info("Door " + door.name + " re-registered with id: " + door.id);
                    registeredDoor = door;
                    registeredDoor.socket = socket;
                    doors[registeredDoor.id] = registeredDoor;
                    return callback({ id: door.id });
                });
            });
        });
    });
    
    socket.on('disconnect', function () {
        if (!registeredDoor) {
            return systemLogger.warn("Unauthenticated node lost connection");
        }
        systemLogger.error("Node " + registeredDoor.name + " with id " + registeredDoor.id + " is dead!");
        delete doors[registeredDoor.id];
        doorModel.findByIdAndUpdate(registeredDoor.id, { $set: { online: false, active : false } }, function (err) { if (err) systemLogger.error(err.message); });
        stats.generateEvent(stats.eventType.nodeOffline, null, null, null, registeredDoor.name);
    });

    socket.on('status', function (data) {
        if (registeredDoor.id != data.id) {
            systemLogger.error("Inconsistent id for door: " + registeredDoor.name);
            return socket.disconnect();
        }
        doorModel.findById(registeredDoor.id, function (err, door) {
            if (err) {
                systemLogger.error(err.message);
                return res.status(500).send(err.message);
            }
            if (!door) {
                systemLogger.error("No door found");
                return socket.disconnect();
            }
            door.open = data.open;
            if (door.open) stats.generateEvent(stats.eventType.doorOpened, null, null, null, door.name);
            else stats.generateEvent(stats.eventType.doorClosed, null, null, null, door.name);
            door.save(function (err) {
                if (err) {
                    systemLogger.error(err.message);
                    return res.status(500).send(err.message);
                }
                return res.status(200).send("Updated");
            });
        });
    })
});

exports.openDoor = function (doorName, callback) {
    doorModel.findOne({ name: doorName }, function (err, door) {
        if (err) return callback(err);
        if (!door) return callback(new Error("Door does not exist"));
        if (!door.active) return callback(new Error("Door is not active"));
        else {
            systemLogger.info("Sent OPEN to door: " + door.name + " with id: " + door.id);
            doors[door.id].socket.emit('open')
            callback(err);
        }
    });
};