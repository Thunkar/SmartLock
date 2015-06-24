﻿var node = require('../node.js'),
    request = require('request'),
    GPIO = require('onoff').Gpio,
    console = process.console;

var failedHeartbeats = 0;
var open = false;
var openPin = new GPIO(4, 'out');

exports.init = function () {
    request.post(node.env.serverAddress + "/api/doorcomms/handshake", {
        json: {
            name: node.env.name,
            section: node.env.section,
            open: false
        }
    }, function (err, response, body) {
        if (err) {
            console.file().time().error("Handshake failed!: " + err.message);
            console.file().time().error("No id, killing myself...");
            process.exit(1);

        } else {
            console.file().time().system("Handshake returned: " + response.statusCode + ", id is: " + body);
            if (response.statusCode != 200) {
                console.file().time().error("Handshake failed!: " + body);
                console.file().time().error("No id, killing myself...");
                process.exit(1);
            }
            node.env.id = body;
            doHeartbeat();
        }
    });
};

function openDoor() {
    console.file().time().warning('Opening door');
    openPin.writeSync(1);
    setTimeout(function () { openPin.writeSync(0) }, 1000);
};

function doHeartbeat() {
    console.time().file().log("Pinging the server...")
    if (!node.env.id) {
        console.file().time().error("No id, killing myself...");
        process.exit(1);
    }
    request.post(node.env.serverAddress + "/api/doorcomms/heartbeat", {
        json: {
            id: node.env.id
        }
    }, function (err, response, body) {
        if (err) {
            console.file().time().error(err.message);
            if (++failedHeartbeats > 10) {
                console.file().time().error("No response from server, killing myself...");
                process.exit(1);
            }
        }
        else if (response.statusCode != 200) {
            if (++failedHeartbeats > 10) {
                console.file().time().error("No response from server, killing myself...");
                process.exit(1);
            }
        }
        else {
            console.file().time().log("Server responded: " + body);
            if (body === "OPEN") openDoor();
        }
        doHeartbeat();
    });
};