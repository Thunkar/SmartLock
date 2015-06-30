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

if(env.dummy == true)
    var controller = require('./controllers/doorControllerDummy.js');
else
    var controller = require('./controllers/doorController.js');

controller.init();