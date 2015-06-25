var app = require("../server.js"),
    mongoose = require('mongoose'),
    providerModel = mongoose.model('ProviderModel'),
    fs = require('fs'),
    console = process.console;

var storagePath = './uploads/';

exports.addProvider = function (req, res) {
    var provider = new providerModel({
        name: req.body.name,
        url: req.body.url,
        profilePic: req.files.profilePic.name
    });
    provider.save(function (err) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        return res.status(200).send(provider._id);
    });
};

exports.removeProvider = function (req, res) {
    providerModel.findByIdAndRemove(req.params.provider, function (err, provider) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        if (!provider) return res.status(404).send("Not found");
        fs.unlink(storagePath + provider.profilePic, function(err) {if(err) console.file().time().error(err.message)})
        return res.status(200).send("Success");
    });
};

exports.getProviders = function (req, res) {
    providerModel.find({}, function (err, providers) {
        if (err) {
            console.file().time().err(err.message);
            return res.status(500).send(err.message);
        }
        var result = [];
        for (var i = 0; i < providers.length; i++) {
            var provider = providers[i];
            provider.profilePic = app.env.serverAddress + "files/" + provider.profilePic;
        }
        return res.status(200).jsonp(providers);
    });
};
