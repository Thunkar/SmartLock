var express = require('express'),
    mobileController = require('../controllers/mobileController.js'),
    doorController = require('../controllers/doorController.js'),
    multer = require('multer');

var router = express.Router();

router.route('/renewtoken').post(mobileController.renewAccessToken);
router.route('/userlogin').post(mobileController.login);
router.route('/newuser').post([multer({ dest: './uploads/' })], mobileController.createNewUser);
router.route('/info/:user').get(mobileController.getUserInfo).post([multer({ dest: './uploads/' })], mobileController.editUser);
router.route('/stats/:user').get(mobileController.getUserStats);
router.route('/revoketoken').post(mobileController.revokeToken);
router.route('/open').post(doorController.open);

module.exports = router;