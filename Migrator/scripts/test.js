var mongoose = require('mongoose'),
	userModel = mongoose.model('UserModel'),
	winston = require('winston');

var systemLogger = winston.loggers.get("system");

systemLogger.info("Starting test script");


userModel.find().count().exec().then((userCount) => {
	systemLogger.info("Test successful: " + userCount);
	return mongoose.disconnect();
}, (err) => {
	return systemLogger.error(err.message);
});

