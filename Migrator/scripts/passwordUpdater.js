var mongoose = require('mongoose'),
	userModel = mongoose.model('UserModel'),
	adminModel = mongoose.model('AdminModel'),
	crypto = require('crypto'),
	winston = require('winston');

var systemLogger = winston.loggers.get("system");

systemLogger.info("Starting password updater script");

const pickFrom = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789=-+#%&";

var iterations = 10000;

var usersUpdated = 0;
var adminsUpdated = 0;

function generateToken() {
    let token = "";
    for (let i = 0; i < 40; i++) {
        token += pickFrom.charAt(Math.random() * 59);
    }
    return token;
};

function generateSaltedPassword(password, iterations) {
    const salt = generateToken();
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(password.toLowerCase(), salt, iterations, 256, 'sha256', (err, key) => {
            if (err) return reject(err);
            const hash = key.toString('hex');
            return resolve({ salt: salt, hash: hash, iterations: iterations });
        });
    });
};

var updateUser = function (user) {
	if (!user.password || user.password == "") {
		return systemLogger.error("User " + user.alias + " has no password");
	}
	generateSaltedPassword(user.password, iterations).then((saltedPassword) => {
		user.pwd = saltedPassword;
		return user.save();
	}).then(() => {
		systemLogger.info("Updated " + ++usersUpdated + " users");
	}, (err) => {
		return systemLogger.error(err.message);
	});
};

var updateAdmin = function (admin) {
	if (!admin.password || admin.password == "") {
		return systemLogger.error("Admin " + admin.alias + " has no password");
	}
	generateSaltedPassword(admin.password, iterations).then((saltedPassword) => {
		admin.pwd = saltedPassword;
		return admin.save();
	}).then(() => {
		systemLogger.info("Updated " + ++adminsUpdated + " admins");
	}, (err) => {
		return systemLogger.error(err.message);
	});
};


userModel.find().exec().then((users) => {
	users.forEach(updateUser);
}, (err) => {
	return systemLogger.error(err.message);
});

adminModel.find().exec().then((admins) => {
	admins.forEach(updateAdmin);
}, (err) => {
	return systemLogger.error(err.message);
});