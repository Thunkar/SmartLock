var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var adminSchema = new Schema({
    alias: { type: String, default: "", unique: true, dropDups: true },
    pwd: {
        hash: { type: String, default: "" },
        salt: { type: String, default: "" },
        iterations: { type: Number, default: 10000 }
    },
    name: { type: String, default: "" },
    profilePic: { type: String, default: "" },
    provider: { type: Schema.Types.ObjectId }
});

module.exports = mongoose.model('AdminModel', adminSchema);