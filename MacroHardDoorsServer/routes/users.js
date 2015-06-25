var express = require('express'),
    userController = require('../controllers/userController.js'),
    multer = require('multer');

var router = express.Router();

router.route('/').get(userController.getUsers);
router.route('/register').post([multer({ dest: './uploads/' })], userController.register);
router.route('/unregister').post(userController.unRegister);
router.route('/adminlogin').post(userController.doAdminLogin);
router.route('/newuser').post([multer({ dest: './uploads/' })], userController.createNewUser);
router.route('/newadmin').post([multer({ dest: './uploads/' })], userController.createNewAdmin);
router.route('/:user').get(userController.getUserInfo).post([multer({ dest: './uploads/' })], userController.editUser);
router.route('/:user/activate').post(userController.activateUser);
router.route('/:user/delete').post(userController.deleteUser);
router.route('/:user/tokens').post(userController.addNewToken);
router.route('/:user/tokens/revoke').post(userController.revokeToken);

module.exports = router;