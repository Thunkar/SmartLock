var app = require("../app.js"),
    mongoose = require('mongoose'),
    user = mongoose.model('UserModel'),
    admin = mongoose.model('AdminModel'),
    console = process.console;

var createSessionId = function () {
    var pickFrom = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789=-+#%&";
    var id = "";
    for (var i = 0; i < 40; i++) {
        id += pickFrom.charAt(Math.random() * 59);
    }
    return id;
}

exports.loginRequired = function (req, res, next) {
    if (!req.session.user) res.status(403).send("Not authorized");
    else next();
}

exports.doAdminLogin = function (req, res) {
    admin.findOne({ alias: req.body.alias }, function (err, admin) {
        if (err) {
            res.status(500).send(err.message);
            return console.time().file().error(err.message);
        }
        if (admin.password === req.body.password) {
            req.session.user = { id: createSessionId(), alias: admin.alias };
            res.status(200).send("Success");
        }
        else res.status(401).send("Not authorized");
    });
};

exports.createNewUser = function (req, res) {
    user.
}