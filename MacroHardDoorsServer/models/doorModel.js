﻿var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var doorSchema = new Schema({
    name: { type: String, default: "", unique: true, dropDups: true },
    section: { type: String, default: "" },
    ip: { type: String, default: "" },
    lastHeartbeat: { type: Date, default: Date.now },
    open: {type: Boolean, default: false}
});


module.exports = mongoose.model('DoorModel', doorSchema);