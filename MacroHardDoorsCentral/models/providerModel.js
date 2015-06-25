var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var providerSchema = new Schema({
    name: { type: String, default: "" },
    profilePic: { type: String, default: "" },
    url: {type: String, default:""}
});

module.exports = mongoose.model('ProviderModel', providerSchema);