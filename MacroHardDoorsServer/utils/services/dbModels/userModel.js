var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var userSchema = new Schema({
    alias: { type: String, default: "", unique: true, dropDups: true },
    pwd: {
        hash: { type: String, default: "" },
        salt: { type: String, default: "" },  
        iterations: { type: Number, default: 10000 }
    },
    name: { type: String, default: "" },
    tokens: [mongoose.model('TokenModel')],
    profilePic: { type: String, default: "" },
    active: {type: Boolean, default: false},
    email: {type: String, default: ""}
});

module.exports = mongoose.model('UserModel', userSchema);