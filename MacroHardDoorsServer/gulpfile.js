const gulp = require('gulp'),
    del = require('del'),
    fs = require('fs'),
    mongoose = require('mongoose'),
    Promise = require('bluebird'),
    argv = require('yargs').argv;

mongoose.Promise = Promise;

try {
    var config = JSON.parse(fs.readFileSync('./config.cnf', 'utf8').toString());
} catch (err) {
    console.error("No config");
    process.exit(-1);
}

gulp.task('config:example', (done) => {
    var example = {
        "dbAddress": "mongodb://localhost:27017/doors",
        "dbUser": "user",
        "dbPass": "pass",
        "pwdIterations": 10000,
        "tokenExpiration": 60,
        "serverAddress": "http://localhost",
        "mountPoint": "",
        "port": 3000,
        "sessionSecret": "mehueleelpitoacanela",
        "activeDoorsDefault": true,
        "mainServerAddress": "http://smartlock.cloudapp.net",
        "mainServerSecret": "cosamuysecreta",
        "providerName": "Local",
        "providerImg": "test.jpg",
        "logLevel": "debug"
    }
    fs.writeFile('example_config.cnf', JSON.stringify(example, null, 4), done);
});

gulp.task('config:admin', () => {
    const options = {
        user: config.dbUser,
        pass: config.dbPass,
        replset: function () {
            if (config.rsName)
                return { rs_name: config.rsName }
            else return undefined;
        } (),
        server: function () {
            if (config.rsName)
                return { poolSize: config.dbPoolSize }
            else return undefined;
        } ()
    }

    if (config.rsName)
        options.server.socketOptions = options.replset.socketOptions = { keepAlive: 1 };

    fs.readdirSync("./utils/services/dbModels").filter(function (file) {
        return (file.indexOf(".") !== 0);
    }).forEach(function (file) {
        require("./utils/services/dbModels/" + file);
    });

    var authController = require('./controllers/authController.js');

    return mongoose.connect(config.dbAddress, options).then(() => {
        return authController.SHA256(argv.p.toString());
    }).then((pwdHash) => {
        return authController.generateSaltedPassword(pwdHash, config.pwdIterations);
    }).then((saltedPassword) => {
        var newAdmin = mongoose.model("AdminModel")({
            alias: argv.u.toString(),
            pwd: saltedPassword,
            name: argv.n.toString(),
        });
        return newAdmin.save();
    }).then(() => {
        return mongoose.disconnect();
    });
});