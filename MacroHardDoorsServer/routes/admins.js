var express = require('express'),
    userController = require('../controllers/userController.js'),
    multer = require('multer');

var router = express.Router();

router.route('/register').post([multer({ dest: './uploads/' })], userController.register);
router.route('/unregister').post(userController.unRegister);
router.route('/adminlogin').post(userController.doAdminLogin);
router.route('/newadmin').post([multer({ dest: './uploads/' })], userController.createNewAdmin);
router.route('/:admin').get(userController.getAdminInfo);

module.exports = router;