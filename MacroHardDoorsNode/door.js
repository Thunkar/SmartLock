var scribe = require('scribe-js')(),
    fs = require('fs');

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

if(env.dummy) {
    var controller = require('./controllers/doorControllerDummy.js');
    console.file().time().system("Using dummy controller");
}
else {
    var controller = require('./controllers/doorController.js');
    console.file().time().system("Using real controller");
}

controller.init();