var services = require("../utils/services.js"),
    config = services.config,
    CodedError = require('../utils/CodedError.js'),
    doorsChannel = require('../server.js').doorsChannel,
    mongoose = require('mongoose'),
    doorModel = mongoose.model('DoorModel'),
    stats = require('./statisticsController.js'),
    Promise = require('bluebird'),
    winston = require('winston');

var systemLogger = winston.loggers.get('system');

var doors = {};

doorsChannel.on('connection', (socket) => {

    systemLogger.info('New door connected');

    var registeredDoor;

    socket.on('handshake', (data, callback) => {
        var newDoor;
        doorModel.findOne({ name: data.name }).exec().then((door) => {
            if (door && doors[door.id]) {
                systemLogger.warn("Duplicated door name trying to register in the system: " + door.name);
                return socket.disconnect();
            }
            newDoor = {
                name: data.name,
                section: data.section,
                lastHeartbeat: new Date(),
                active: config.activeDoorsDefault,
                online: true,
                open: data.open
            }
            return doorModel.update({ name: newDoor.name }, newDoor, { upsert: true }).exec();
        }).then((door) => {
            stats.generateEvent(stats.eventType.nodeHandshake, null, null, null, newDoor.name);
            if (door.upserted) {
                door.id = door.upserted[0]._id;
                systemLogger.info("Door " + newDoor.name + " registered with id: " + door.id);
                registeredDoor = door;
                registeredDoor.socket = socket;
                doors[registeredDoor.id] = registeredDoor;
                callback({ id: door.upserted[0]._id });
                throw new CodedError("Door upserted", 301);
            } else
                return doorModel.findOne({ name: newDoor.name }).exec();
        }).then((door) => {
            systemLogger.info("Door " + door.name + " re-registered with id: " + door.id);
            registeredDoor = door;
            registeredDoor.socket = socket;
            doors[registeredDoor.id] = registeredDoor;
            return callback({ id: door.id });
        }, (err) => {
            if(err.code == 301) return;
            systemLogger.error(err.message);
            return socket.disconnect();
        });
    });

    socket.on('disconnect', () => {
        if (!registeredDoor) {
            return systemLogger.warn("Unauthenticated node lost connection");
        }
        systemLogger.error("Node " + registeredDoor.name + " with id " + registeredDoor.id + " is dead!");
        delete doors[registeredDoor.id];
        doorModel.findByIdAndUpdate(registeredDoor.id, { $set: { online: false, active: false } }).exec().then(() => { }, (err) => { if (err) systemLogger.error(err.message); });
        stats.generateEvent(stats.eventType.nodeOffline, null, null, null, registeredDoor.name);
    });

    socket.on('status', (data) => {
        if (registeredDoor.id != data.id) {
            systemLogger.error("Inconsistent id for door: " + registeredDoor.name);
            return socket.disconnect();
        }
        doorModel.findById(registeredDoor.id).exec().then((door) => {
            if (!door) {
                systemLogger.error("No door found");
                return socket.disconnect();
            }
            door.open = data.open;
            if (door.open) stats.generateEvent(stats.eventType.doorOpened, null, null, null, door.name);
            else stats.generateEvent(stats.eventType.doorClosed, null, null, null, door.name);
            return door.save();
        }).then(() => {
            return systemLogger.info("Door status updated");
        }, (err) => {
            return systemLogger.error(err.message);
        });
    });
});

exports.openDoor = function (doorName) {
    return new Promise((resolve, reject) => {
        return doorModel.findOne({ name: doorName }).exec();
    }).then((door) => {
        if (!door) return reject(new Error("Door does not exist"));
        if (!door.active) return reject(new Error("Door is not active"));
        else {
            systemLogger.info("Sent OPEN to door: " + door.name + " with id: " + door.id);
            doors[door.id].socket.emit('open')
            return resolve();
        }
    }, (err) => {
        return systemLogger.error(err.message);
    });
};