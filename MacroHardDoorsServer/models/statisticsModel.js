var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var statisticsSchema = new Schema({
    user: { type: String, default: ""},
    door: { type: String, default: "" },
    token: { type: String, default: "" },
    admin: { type: String, default: "" },
    event: { type: String, default: "" },
    date: {type: Date, default: Date.now}
});

module.exports = mongoose.model('StatisticsModel', statisticsSchema);