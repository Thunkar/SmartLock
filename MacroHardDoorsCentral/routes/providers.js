var express = require('express'),
    providerController = require('../controllers/providerController.js'),
    multer = require('multer'),
    authController = require('../controllers/authController.js');

var router = express.Router();

router.route('/').get(providerController.getProviders).post(authController.authAndContinue, [multer({ dest: './uploads/' })], providerController.addProvider);
router.route('/:provider/delete').post(authController.authAndContinue, providerController.removeProvider);

module.exports = router;