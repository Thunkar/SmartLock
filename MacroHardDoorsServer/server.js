var scribe = require('scribe-js')(),
    express = require('express'),
    app = express(),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    methodOverride = require("method-override"),
    session = require('express-session'),
    cookieParser = require('cookie-parser'),
    mongoose = require('mongoose'),
    doorModel = require('./models/doorModel.js')(app, mongoose),
    doorModel = mongoose.model('DoorModel'),
    userModel = require('./models/userModel.js')(app, mongoose),
    adminModel = require('./models/adminModel.js')(app, mongoose),
    tokenModel = require('./models/tokenModel.js')(app, mongoose),
    statisticsModel = require('./models/statisticsModel.js')(app, mongoose),
    doorCommController = require('./controllers/doorCommController.js'),
    stats = require('./controllers/statisticsController.js');

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(methodOverride());
app.use(cookieParser('macroharddoors'));
app.use(session());
app.use(scribe.express.logger());
app.enable('trust proxy');

var console = process.console;

console.addLogger('system', null, {
    alwaysTime: true,
    alwaysLocation: true,
    alwaysTags: true,
    timeColors : 'grey',
    tagsColors: 'lightblue',
    fileColors: 'red',
    defaultTags: ['System']
});

console.file().time().system("Reading config file");
var env = JSON.parse(fs.readFileSync('./config.cnf', 'utf8').toString());
exports.env = env;
console.file().time().system("Configuration loaded");

mongoose.connect(env.dbAddress, function (err) {
    if (err) {
        console.error("could not connect to DB: " + err);
    }
    else {
        console.time().file().system("Connected to DB");
        console.time().file().system("Cleaning up...");
        doorModel.remove({}, function (err) {
            if (err) {
                console.time().file().error(err.message);
                process.exit(1);
            }
            doorCommController.check();
            stats.generateEvent(stats.eventType.systemStarted, null, null, null, null);
            console.time().file().system("Ready to receive handshakes");
        });
    }
});


var doors = require('./routes/doors.js'),
    doorComms = require('./routes/doorComms.js'),
    users = require('./routes/users.js'),
    statistics = require('./routes/statistics.js');

app.use("/api/doors", doors);
app.use("/api/doorcomms", doorComms)
app.use("/api/users", users);
app.use("/api/statistics", statistics),
app.use(express.static(__dirname + "/frontend"));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/frontend/index.html');
});

app.get('/files/:file', function (req, res) {
    res.sendFile(__dirname + '/uploads/' + req.params.file);
});

app.listen(env.port, function () {
    console.time().file().system('Main server listening on port: ' + env.port);
});