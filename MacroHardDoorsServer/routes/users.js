var express = require('express'),
    userController = require('../controllers/userController.js');

var router = express.Router();

router.route('/adminlogin').post(userController.doAdminLogin);
router.route('/newuser').post(userController.createNewUser);

module.exports = router;