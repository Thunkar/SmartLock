var app = require("../server.js"),
    mongoose = require('mongoose'),
    userModel = mongoose.model('UserModel'),
    adminModel = mongoose.model('AdminModel'),
    authController = require('./authController.js'),
    stats = require('./statisticsController.js'),
    scheduler = require('node-schedule'),
    fs = require('fs'),
    request = require('request'),
    moment = require('moment'),
    winston = require('winston');


var systemLogger = winston.loggers.get('system');

var storagePath = './uploads/';


exports.register = function () {
    var formData = {
        name: app.env.providerName,
        url: app.env.serverAddress,
        profilePic: fs.createReadStream(app.env.providerImg)
    };
    var date = moment().format("DD/MM/YYYY_hh:mm:ss");
    var signature = authController.generateSignature(date, app.env.mainServerSecret);
    request.post({ url: app.env.mainServerAddress + "/api/providers", formData: formData, headers: { 'signDate': date, 'signature': signature } }, function (err, httpResponse, body) {
        if (err) {
            systemLogger.error(err.message);
        }
        if(httpResponse.statusCode != 200) systemLogger.error("Server responded: " + httpResponse.statusCode)
        app.env.providerId = body.replace(/"/g, '');
        return systemLogger.info("Registered with central server");
    });
};

var registerRule = new scheduler.RecurrenceRule();

registerRule.hour = 5;
registerRule.minute = 3;

scheduler.scheduleJob(registerRule, exports.register);

exports.unRegister = function (req, res) {
    if(!app.env.providerId) return res.status(400).send("No id");
    var date = moment().format("DD/MM/YYYY_hh:mm:ss");
    var signature = authController.generateSignature(date, app.env.mainServerSecret);
    request.post({ url: app.env.mainServerAddress + "/api/providers/" + app.env.providerId + "/delete", headers: { 'signDate': date, 'signature': signature } }, function (err, httpResponse, body) {
        if (err) {
            systemLogger.error(err.message);
            return res.status(500).send(err.message);
        }
        if (httpResponse.statusCode != 200) return res.status(httpResponse.statusCode).send(body);
        return res.status(200).send("Success");
    });
};

exports.doAdminLogin = function (req, res) {
    adminModel.findById(req.body.admin, function (err, admin) {
        if (err) {
            res.status(500).send(err.message);
            return systemLogger.error(err.message);
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
            systemLogger.error(err.message);
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
        active: true,
        email: req.body.email
    });
    newUser.save(function (err) {
        if (err) {
            systemLogger.error(err.message);
            return res.status(500).send(err.message);
        }
        stats.generateEvent(stats.eventType.newUser, newUser._id, null, null, null);
        return res.status(200).send(newUser._id);
    });
};

exports.editUser = function (req, res) {
    userModel.findById(req.params.user, function (err, user) {
        if (err) {
            systemLogger.error(err.message);
            return res.status(500).send(err.message);
        }
        if (!user) return res.status(404).send("User not found");
        var updatedUser = {
            name: req.body.name || user.name,
            profilePic: user.profilePic,
            password: req.body.password || user.password,
            email: req.body.email || user.email,
            active: req.body.active || user.active
        };
        if (req.files.profilePic) {
            updatedUser.profilePic = req.files.profilePic.name;
            fs.unlink(storagePath + user.profilePic, function (err) { if (err) systemLogger.error(err.message) });
        }
        user.name = updatedUser.name;
        user.profilePic = updatedUser.profilePic;
        user.password = updatedUser.password;
        user.email = updatedUser.email;
        user.active = updatedUser.active;
        user.save(function (err) {
            if (err) {
                systemLogger.error(err.message);
                return res.status(500).send(err.message);
            }
            return res.status(200).send("Success");
        });
    });
};

exports.activateUser = function (req, res) {
    userModel.findByIdAndUpdate(req.params.user, { $set: { active: req.body.active } }, function (err, user) {
        if (err) {
            systemLogger.error(err.message);
            return res.status(500).send(err.message);
        }
        return res.status(200).send("Success");
    });
};

exports.deleteUser = function (req, res) {
    userModel.findByIdAndRemove(req.params.user, function (err, user) {
        if (err) {
            systemLogger.error(err.message);
            return res.status(500).send(err.message);
        }
        fs.unlink(storagePath + user.profilePic, function (err) { if (err) systemLogger.error(err.message) });
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
            systemLogger.error(err.message);
            return res.status(500).send(err.message);
        }
        stats.generateEvent(stats.eventType.newToken, req.params.user, null, newToken._id, req.body.doors);
        return res.status(200).send(newToken._id);
    });
};

exports.revokeToken = function (req, res) {
    userModel.findByIdAndUpdate(req.params.user, { $pull: { tokens: { _id: mongoose.Types.ObjectId(req.body.token) } } }, function (err) {
        if (err) {
            systemLogger.error(err.message);
            return res.status(500).send(err.message);
        }
        stats.generateEvent(stats.eventType.tokenRevoked, req.params.user, null, req.body.token, null);
        return res.status(200).jsonp("Removed");
    });
};

exports.getUserInfo = function (req, res) {
    userModel.findById(req.params.user, function (err, user) {
        if (err) {
            systemLogger.error(err.message);
            return res.status(500).send(err.message);
        }
        if (!user) return res.status(404).send("User not found");
        var userToSend = {
            alias: user.alias,
            name: user.name,
            profilePic: app.env.serverAddress + "/files/" + user.profilePic,
            tokens: user.tokens,
            active: user.active,
            email: user.email
        };
        return res.status(200).jsonp(userToSend);
    });
};


exports.getUsers = function (req, res) {
    userModel.find({}, function (err, users) {
        if (err) {
            systemLogger.error(err.message);
            return res.status(500).send(err.message);
        }
        var result = [];
        for (var i = 0; i < users.length; i++) {
            var userToSend = {
                _id: users[i]._id,
                alias: users[i].alias,
                name: users[i].name,
                profilePic: app.env.serverAddress + "/files/" + users[i].profilePic,
                active: users[i].active,
                email: users[i].email
            };
            result.push(userToSend);
        }
        return res.status(200).jsonp(result);
    });
};
