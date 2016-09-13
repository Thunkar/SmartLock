var express = require('express'),
    authController = require('../controllers/authController.js'),
    userController = require('../controllers/userController.js'),
    doorController = require('../controllers/doorController.js'),
    multer = require('multer');

var router = express.Router();

router.route('/userlogin').post(userController.login);

router.use(authController.authUser);
router.route('/newuser').post([multer({ dest: './uploads/' })], userController.createNewUser);
router.route('/info/:user').get(userController.getUserInfo).post([multer({ dest: './uploads/' })], userController.editUser);
router.route('/stats/:user').get(userController.getUserStats);
router.route('/revoketoken').post(userController.revokeToken);
router.route('/open').post(doorController.open);

module.exports = router;