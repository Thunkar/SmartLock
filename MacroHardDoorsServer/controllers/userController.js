var app = require("../server.js"),
    mongoose = require('mongoose'),
    userModel = mongoose.model('UserModel'),
    adminModel = mongoose.model('AdminModel'),
    tokenModel = mongoose.model('TokenModel'),
    authController = require('./authController.js'),
    stats = require('./statisticsController.js'),
    fs = require('fs'),
    console = process.console;

var storagePath = './uploads/';


exports.doAdminLogin = function (req, res) {
    adminModel.findOne({ alias: req.body.alias }, function (err, admin) {
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
        return res.status(200).send("Success");
    });
};

exports.createNewUser = function (req, res) {
    var newUser = new userModel({
        alias: req.body.alias,
        password: req.body.password,
        token: authController.generateToken(),
        name: req.body.name,
        profilePic: req.files.profilePic.name,
        tokens: []
    });
    newUser.save(function (err) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        stats.generateEvent(stats.eventType.newUser, newUser.alias, null, null, null);
        return res.status(200).send("Success");
    });
};

exports.editUser = function (req, res) {
    userModel.findOne({ alias: req.params.user }, function (err, user) {
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
    userModel.remove(req.params.user, function (err) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        tokenModel.remove({ user: req.params.user }, function (err) {
            if (err) {
                console.file().time().err(err.message);
                return res.status(500).send(err.message);
            }
            return res.status(200).send("Success");
        });
    });
};


exports.addNewToken = function (req, res) {
    var newToken = new tokenModel({
        name: req.body.name,
        doors: req.body.doors,
        validity: req.body.validity,
        user: req.body.user
    });
    newToken.save(function (err, token) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        userModel.update({ alias: req.body.user }, { $push: { tokens: token.id } }, function (err) {
            if (err) {
                console.file().time().err(err.message);
                return res.status(500).send(err.message);
            }
            stats.generateEvent(stats.eventType.newToken, req.body.user, null, token.id, req.body.doors);
            return res.status(200).send("Success");
        });
    });
};

exports.revokeToken = function (req, res) {
    tokenModel.findByIdAndRemove(req.params.token, function (err) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        userModel.update({ alias: req.params.user }, { $pull: { tokens: req.params.token } }, function (err) {
            if (err) {
                console.file().time().err(err.message);
                return res.status(500).send(err.message);
            }
            stats.generateEvent(stats.eventType.tokenRevoked, req.params.user, null, req.params.token, null);
            return res.status(200).jsonp("Removed");
        });
    });
};

exports.getUserInfo = function (req, res) {
    userModel.findOne({ alias: req.params.user }, function (err, user) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        if (!user) return res.status(404).send("User not found");
        tokenModel.find({ id: { $in: user.tokens } }, function (err, tokens) {
            var userToSend = {
                alias: user.alias, 
                name: user.name,
                profilePic: app.env.serverAddress + "/files/" + user.profilePic,
                tokens: tokens
            };
            if (err) {
                console.file().time().err(err.message);
                return res.status(500).send(err.message);
            }
            return res.status(200).jsonp(userToSend);
        });
    });
};

exports.getUserTokens = function (req, res) {
    tokenModel.find({ user: req.params.user }, function (err, tokens) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        return res.status(200).jsonp(tokens);
    });
};

exports.getUsers = function (req, res) {
    var query = userModel.find({});
    query.select('alias name profilePic')
    query.exec(function (err, users) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        var result = [];
        for (var i = 0; i < users.length; i++) {
            var userToSend = {
                alias: users[i].alias, 
                name: users[i].name,
                profilePic: app.env.serverAddress + "/files/" + users[i].profilePic,
            };
            result.push(userToSend);
        }
        return res.status(200).jsonp(result);
    });
};