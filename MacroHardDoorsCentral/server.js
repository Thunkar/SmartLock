var fs = require('fs');

var config = JSON.parse(fs.readFileSync('./config.cnf', 'utf8').toString());
exports.config = config;

require('./utils/logger.js');

var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    providerModel = require('./models/providerModel.js')(app, mongoose),
    providerController = require('./controllers/providerController.js'),
    winston = require('winston');

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.enable('trust proxy');

var systemLogger = winston.loggers.get('system');

mongoose.connect(config.dbAddress, function (err) {
    if (err) {
       systemLogger.error("could not connect to DB: " + err);
    }
    else {
        systemLogger.info("Connected to DB");
        providerController.removeProviders();
    }
});

var providers = require('./routes/providers.js');

app.use("/api/providers", providers);

app.get('/files/:file', function (req, res) {
    res.sendFile(__dirname + '/uploads/' + req.params.file);
});

app.listen(config.port, function () {
    systemLogger.info('Main server listening on port: ' + config.port);
});