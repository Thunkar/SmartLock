var app = require("../server.js"),
    mongoose = require('mongoose'),
    userModel = mongoose.model('UserModel'),
    adminModel = mongoose.model('AdminModel'),
    authController = require('./authController.js'),
    stats = require('./statisticsController.js'),
    fs = require('fs'),
    console = process.console;

var storagePath = './uploads/';


exports.doAdminLogin = function (req, res) {
    adminModel.findById(req.body.admin, function (err, admin) {
        if (err) {
            res.status(500).send(err.message);
            return console.time().file().error(err.message);
        }
        if (!admin) return res.status(404).send("Not found");
        if (admin.password === req.body.password) {
            req.session.user = { token: admin.token, alias: admin.alias, isAdmin: true };
            res.status(200).send("Success");
        }
        else res.status(401).send("Not authorized");
    });
};

exports.createNewAdmin = function (req, res) {
    var newAdmin = new adminModel({
        alias: req.body.alias,
        password: req.body.password,
        token: authController.generateToken(),
        name: req.body.name,
    });
    newAdmin.save(function (err) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        stats.generateEvent(stats.eventType.newAdmin, null, newAdmin.name, null, null);
        return res.status(200).send(newAdmin._id);
    });
};

exports.createNewUser = function (req, res) {
    var newUser = new userModel({
        alias: req.body.alias,
        password: req.body.password,
        token: authController.generateToken(),
        name: req.body.name,
        profilePic: req.files.profilePic.name,
        tokens: [],
        active: true
    });
    newUser.save(function (err) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        stats.generateEvent(stats.eventType.newUser, newUser.alias, null, null, null);
        return res.status(200).send(newUser._id);
    });
};

exports.editUser = function (req, res) {
    userModel.findById(req.params.user, function (err, user) {
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
    userModel.findByIdAndRemove(req.params.user, function (err, user) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        fs.unlink(storagePath + user.profilePic, function (err) { if (err) console.file().time().error(err.message) });
        return res.status(200).send("Success");
    });
};


exports.addNewToken = function (req, res) {
    var newToken = {
        _id: mongoose.Types.ObjectId(),
        name: req.body.name,
        doors: req.body.doors,
        validity: req.body.validity,
    };
    userModel.findByIdAndUpdate(req.params.user, { $push: { tokens: newToken } }, function (err, user) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        console.file().time().log(newToken._id);
        stats.generateEvent(stats.eventType.newToken, req.body.user, null, newToken._id, req.body.doors);
        return res.status(200).send(newToken._id);
    });
};

exports.revokeToken = function (req, res) {
    userModel.findByIdAndUpdate(req.params.user, { $pull: { tokens: { _id: mongoose.Types.ObjectId(req.body.token) } } }, function (err) {
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
            alias: user.alias,
            name: user.name,
            profilePic: app.env.serverAddress + "/files/" + user.profilePic,
            tokens: user.tokens,
            active: user.active
        };
        return res.status(200).jsonp(userToSend);
    });
};


exports.getUsers = function (req, res) {
    userModel.find({}, function (err, users) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        var result = [];
        for (var i = 0; i < users.length; i++) {
            var userToSend = {
                _id: users[i]._id,
                alias: users[i].alias,
                name: users[i].name,
                profilePic: app.env.serverAddress + "/files/" + users[i].profilePic,
                active: users[i].active
            };
            result.push(userToSend);
        }
        return res.status(200).jsonp(result);
    });
};

exports.activateUser = function (req, res) {
    userModel.findByIdAndUpdate(req.params.user, { $set: { active: true } }, function (err, user) {
        if(err) {
            console.file().time().error(err.message);
            return res.status(500).send(err.message);
        }
        return res.status(200).send("Activated");
    });
};