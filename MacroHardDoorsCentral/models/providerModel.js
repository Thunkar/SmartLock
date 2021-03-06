﻿var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var providerSchema = new Schema({
    name: { type: String, default: "", unique: true, dropDups: true },
    profilePic: { type: String, default: "" },
    url: {type: String, default:""},
    lastRegistered: { type: Date, default: Date.now() }
});

module.exports = mongoose.model('ProviderModel', providerSchema);