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
    userModel = require('./models/userModel.js')(app, mongoose),
    adminModel = require('./models/adminModel.js')(app, mongoose),
    tokenModel = require('./models/tokenModel.js')(app, mongoose);

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(methodOverride());
app.use(cookieParser('macroharddoors'));
app.use(session());
app.use(scribe.express.logger());
app.enable('trust proxy');

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

console.file().time().system("Reading config file")
var env = JSON.parse(fs.readFileSync('./config.cnf', 'utf8').toString());
exports.env = env;

mongoose.connect(env.dbAddress, function (err) {
    if (err) {
        console.error("could not connect to DB: " + err);
    }
    else
        console.time().file().system("Connected to DB");
});


var doors = require('./routes/doors.js'),
    users = require('./routes/users.js');

app.use("/api/doors", doors);
app.use("/api/users", users);
app.use(express.static(__dirname + "/frontend"));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/frontend/index.html');
});

app.listen(env.port, function () {
    console.time().file().system('Main server listening');
});