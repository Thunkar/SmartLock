var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var tokenSchema = new Schema({
    doors: [String],
    user: {type: String, default: ""},
    name: {type: String, default: ""},
    validity: {
        from: { type: Date, default: Date.now },
        to: { type: Date, default: Date.now },
        repeat: [String],
        uses: { type: Number, default: 0 }
    }
});

module.exports = mongoose.model('TokenModel', tokenSchema);