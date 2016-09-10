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
    pwd: {
        hash: { type: String, default: "" },
        salt: { type: String, default: "" },  
        iterations: { type: Number, default: 10000 }
    },
    name: { type: String, default: "" },
    tokens: [tokenSchema],
    profilePic: { type: String, default: "" },
    active: {type: Boolean, default: false},
    email: {type: String, default: ""}
});

module.exports = mongoose.model('UserModel', userSchema);