var app = require("../server.js"),
    mongoose = require('mongoose'),
    userModel = mongoose.model('UserModel'),
    adminModel = mongoose.model('AdminModel'),
    tokenModel = mongoose.model('TokenModel'),
    authController = require('./authController.js')
    console = process.console;


exports.doAdminLogin = function (req, res) {
    adminModel.findOne({ alias: req.body.alias }, function (err, admin) {
        if (err) {
            res.status(500).send(err.message);
            return console.time().file().error(err.message);
        }
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
        return res.status(200).send("Success");
    });
};

exports.createNewUser = function (req, res) {
    var newUser = new userModel({
        alias: req.body.alias,
        password: req.body.password,
        token: authController.generateToken(),
        name: req.body.name,
        tokens: []
    });
    newUser.save(function (err) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        return res.status(200).send("Success");
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
        return res.status(200).jsonp("Removed");
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
    userModel.find({}, function (err, users) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        return res.status(200).jsonp(users);
    });
};