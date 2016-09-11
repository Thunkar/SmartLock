var express = require('express'),
    adminController = require('../controllers/adminController.js'),
    multer = require('multer');

var router = express.Router();

router.route('/register').post([multer({ dest: './uploads/' })], adminController.register);
router.route('/unregister').post(adminController.unRegister);
router.route('/adminlogin').post(adminController.doAdminLogin);
router.route('/newadmin').post([multer({ dest: './uploads/' })], adminController.createNewAdmin);
router.route('/:admin').get(adminController.getAdminInfo);

module.exports = router;