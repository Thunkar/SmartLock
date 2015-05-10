var scribe = require('scribe-js')(),
    express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    methodOverride = require("method-override"),
    mongoose = require('mongoose'),
    nodeModel = require('./models/nodeModel.js')(app, mongoose),
    userModel = require('./models/userModel.js')(app, mongoose);

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(methodOverride());
app.use(scribe.express.logger());

var console = process.console;
exports.console = console;

console.addLogger('system', null, {
    alwaysTime: true,
    alwaysLocation: true,
    alwaysTags: true,
    timeColors : 'grey',
    tagsColors: 'lightblue',
    fileColors: 'red',
    defaultTags: ['System']
});

mongoose.connect('mongodb://localhost:27017/doors', function (err) {
    if (err) {
        console.error("could not connect to DB: " + err);
    }
    else
        console.time().file().system("Connected to DB");
});


var nodes = require('./routes/nodes.js');

app.use("/api/nodes", nodes);
app.use(express.static(__dirname + "/frontend"));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/frontend/index.html');
});

app.listen(5000, function () {
    console.time().file().system('Main server listening');
});