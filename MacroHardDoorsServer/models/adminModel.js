var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var adminSchema = new Schema( {
    alias: { type: String, default: "", unique: true, dropDups: true },
    password: { type: String, default: "" },
    name: { type: String, default: "" },
    token: { type: String, default: "" },
    profilePic: {type: String, default: ""}
});

module.exports = mongoose.model('AdminModel', adminSchema);