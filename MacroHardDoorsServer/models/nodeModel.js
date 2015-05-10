var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var nodeSchema = new Schema({
    door: { type: String, default: "" },
    section: { type: String, default: "" },
    id: { type: String, default: "", unique: true, dropDups: true }
});


module.exports = mongoose.model('NodeModel', nodeSchema);