var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var doorSchema = new Schema({
    name: { type: String, default: "" },
    section: { type: String, default: "" },
    ip: { type: String, default: "" },
    lastHeartbeat: {type: Date, default: Date.now}
});


module.exports = mongoose.model('DoorModel', doorSchema);