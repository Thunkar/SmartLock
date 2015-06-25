var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var statisticsSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'UserModel'},
    door: { type: String },
    token: { type: Schema.Types.ObjectId, ref: 'TokenModel'},
    admin: { type: Schema.Types.ObjectId, ref: 'AdminModel'},
    event: { type: String, default: "" },
    date: {type: Date, default: Date.now}
});

module.exports = mongoose.model('StatisticsModel', statisticsSchema);