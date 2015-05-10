var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var tokenSchema = new Schema({
    id: { type: String, default: "", unique: true, dropDups: true },
    doors: { type: String, default: "" },
    uses: { type: Number, default: 0 },
    user: { type: String, default: "" }
});

var userSchema = new Schema({
    alias: { type: String, default: "", unique: true, dropDups: true },
    name: {type: String, default: ""},
    tokens: [tokenSchema],
    privileges: [String]
});

module.exports = mongoose.model('UserModel', userSchema);