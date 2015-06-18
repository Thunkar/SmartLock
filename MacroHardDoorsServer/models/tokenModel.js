var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var tokenSchema = new Schema({
    doors: [String],
    user: {type: String, default: ""},
    uses: { type: Number, default: 0 },
    name: {type: String, default: ""},
    validity: {
        oneTime: { type: Boolean, default: false },
        from: { type: Date, default: Date.now },
        to: { type: Date, default: Date.now },
        repeat: [String]
    }
});

module.exports = mongoose.model('TokenModel', tokenSchema);