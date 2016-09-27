var express = require('express'),
    adminController = require('../controllers/adminController.js'),
    authController = require('../controllers/authController.js'),
    doorController = require('../controllers/doorController.js'),
    multer = require('multer');

var router = express.Router();

router.route('/adminlogin').post(adminController.doAdminLogin);

router.use(authController.authAdmin)
router.route('/').get(adminController.getAdmins);
router.route('/register').post([multer({ dest: './uploads/' })], adminController.register);
router.route('/unregister').post(adminController.unRegister);
router.route('/newadmin').post([multer({ dest: './uploads/' })], adminController.createNewAdmin);
router.route('/open').post(doorController.openAdmin);
router.route('/:admin').get(adminController.getAdminInfo);
router.route('/:admin/delete').post(adminController.deleteAdmin);

module.exports = router;