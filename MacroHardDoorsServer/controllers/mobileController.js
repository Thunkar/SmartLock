var app = require("../server.js"),
    mongoose = require('mongoose'),
    userModel = mongoose.model('UserModel'),
    statsModel = mongoose.model('StatisticsModel'),
    authController = require('./authController.js'),
    stats = require('./statisticsController.js'),
    fs = require('fs'),
    console = process.console;

var storagePath = './uploads/';


exports.login = function (req, res) {
    userModel.findOne({ alias: req.body.alias }, function (err, user) {
        if (err) {
            res.status(500).send(err.message);
            return console.time().file().error(err.message);
        }
        if (!user) return res.status(404).send("Not found");
        if (user.password === req.body.password) {
            var userToSend = {
                _id: user._id.toString(),
                alias: user.alias,
                token: user.token,
                active: user.active
            };
            return res.status(200).jsonp(userToSend);
        }
        return res.status(401).send("Not authorized");
    });
};


exports.createNewUser = function (req, res) {
    var newUser = new userModel({
        alias: req.body.alias,
        password: req.body.password,
        token: authController.generateToken(),
        name: req.body.name,
        email: req.body.email,
        profilePic: req.files.profilePic.name,
        tokens: [],
        active: false
    });
    newUser.save(function (err) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        stats.generateEvent(stats.eventType.newUser, newUser._id, null, null, null);
        var userToSend = {
            _id: newUser._id.toString(),
            alias: newUser.alias,
            token: newUser.token,
            active: newUser.active
        };
        return res.status(200).jsonp(userToSend);
    });
};

exports.editUser = function (req, res) {
    userModel.findById(req.body.user, function (err, user) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        if (!user) return res.status(404).send("User not found");
        var updatedUser = {
            name: req.body.name || user.name,
            profilePic: user.profilePic,
            password: req.body.password || user.password
        };
        if (req.files.profilePic) {
            updatedUser.profilePic = req.files.profilePic.name;
            fs.unlink(storagePath + user.profilePic, function (err) { if (err) console.file().time().error(err.message) });
        }
        user.name = updatedUser.name;
        user.profilePic = updatedUser.profilePic;
        user.password = updatedUser.password;
        user.save(function (err) {
            if (err) {
                console.file().time().err(err.message);
                return res.status(500).send(err.message);
            }
            return res.status(200).send("Success");
        });
    });
};

exports.deleteUser = function (req, res) {
    userModel.findByIdAndRemove(req.body.user, function (err, user) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        fs.unlink(storagePath + user.profilePic, function (err) { if (err) console.file().time().error(err.message) });
        return res.status(200).send("Success");
    });
};


exports.revokeToken = function (req, res) {
    userModel.findByIdAndUpdate(req.body.user, { $pull: { tokens: { _id: mongoose.Types.ObjectId(req.body.token) } } }, function (err) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        stats.generateEvent(stats.eventType.tokenRevoked, req.params.user, null, req.params.token, null);
        return res.status(200).jsonp("Removed");
    });
};

exports.getUserInfo = function (req, res) {
    userModel.findById(req.params.user, function (err, user) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        if (!user) return res.status(404).send("User not found");
        var userToSend = {
            _id: user._id,
            alias: user.alias,
            name: user.name,
            profilePic: app.env.serverAddress + "/files/" + user.profilePic,
            tokens: user.tokens,
            email: user.email,
            active: user.active
        };
        return res.status(200).jsonp(userToSend);
    });
};

exports.getUserStats = function (req, res) {
    var query = statsModel.find({ user: req.params.user });
    query.sort('-date');
    query.limit(20);
    query.exec(function (err, stats) {
        if (err) {
            console.file().time().error(err.message);
            return res.status(200).send(err.message);
        }
        return res.status(200).jsonp(stats);
    });
}