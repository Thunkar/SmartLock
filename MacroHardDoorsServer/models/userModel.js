var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var tokenSchema = new Schema({
    doors: [String],
    name: { type: String, default: "" },
    validity: {
        from: { type: Date, default: Date.now },
        to: { type: Date, default: Date.now },
        repeat: [String],
        uses: { type: Number, default: 0 }
    }
});


var userSchema = new Schema({
    alias: { type: String, default: "", unique: true, dropDups: true },
    password: {type: String, default: ""},
    name: { type: String, default: "" },
    token: {type: String, default: ""},
    tokens: [tokenSchema],
    profilePic: { type: String, default: "" },
    active: {type: Boolean, default: false}
});

module.exports = mongoose.model('UserModel', userSchema);