var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var userSchema = new Schema({
    alias: { type: String, default: "", unique: true, dropDups: true },
    password: {type: String, default: ""},
    name: { type: String, default: "" },
    authToken: {type: String, default: ""},
    tokens: [mongoose.Schema.Types.ObjectId]
});

module.exports = mongoose.model('UserModel', userSchema);