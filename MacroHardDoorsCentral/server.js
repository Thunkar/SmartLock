var scribe = require('scribe-js')(),
    express = require('express'),
    app = express(),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    methodOverride = require("method-override"),
    mongoose = require('mongoose'),
    providerModel = require('./models/providerModel.js')(app, mongoose);

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
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

var providers = require('./routes/providers.js');

app.use("/api/providers", providers);


app.listen(env.port, function () {
    console.time().file().system('Main server listening on port: ' + env.port);
});