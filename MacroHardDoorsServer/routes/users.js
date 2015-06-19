var express = require('express'),
    userController = require('../controllers/userController.js'),
    multer = require('multer');

var router = express.Router();

router.route('/').get(userController.getUsers);
router.route('/adminlogin').post(userController.doAdminLogin);
router.route('/newuser').post([multer({ dest: './uploads/' })], userController.createNewUser);
router.route('/newadmin').post([multer({ dest: './uploads/' })], userController.createNewAdmin);
router.route('/:user').get(userController.getUserInfo);
router.route('/:user/delete').post(userController.deleteUser);
router.route('/:user/tokens').get(userController.getUserTokens).post(userController.addNewToken);
router.route('/:user/tokens/:token/revoke').post(userController.revokeToken)

module.exports = router;