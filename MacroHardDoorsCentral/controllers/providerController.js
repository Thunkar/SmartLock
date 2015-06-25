var app = require("../server.js"),
    mongoose = require('mongoose'),
    providerModel = mongoose.model('ProviderModel'),
    fs = require('fs'),
    console = process.console;

var storagePath = './uploads/';

exports.addProvider = function (req, res) {
    var provider = new providerModel({
        alias: req.body.alias,
        password: req.body.password,
        token: authController.generateToken(),
        name: req.body.name,
        profilePic: req.files.profilePic.name,
        tokens: [],
        active: true,
        email: req.body.email
    });
    newUser.save(function (err) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        stats.generateEvent(stats.eventType.newUser, newUser._id, null, null, null);
        return res.status(200).send(newUser._id);
    });
};