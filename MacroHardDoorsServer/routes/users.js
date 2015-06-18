var express = require('express'),
    userController = require('../controllers/userController.js');

var router = express.Router();

router.route('/adminlogin').post(userController.doAdminLogin);
router.route('/newuser').post(userController.createNewUser);
router.route('/newadmin').post(userController.createNewAdmin);
router.route('/users').get(userController.getUsers);
router.route('/users/:user/tokens').get(userController.getUserTokens).post(userController.addNewToken);
router.route('/users/:user/tokens/:token/revoke').post(userController.revokeToken)

module.exports = router;