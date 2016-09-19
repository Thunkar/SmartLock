var express = require('express'),
    tokenController = require('../controllers/tokenController.js'),
    authController = require('../controllers/authController.js');

var router = express.Router();

router.use(authController.authAdmin);
router.route('/').get(tokenController.getTokenPatterns).post(tokenController.createTokenPattern);
router.route('/:token').get(tokenController.getTokenPattern);
router.route('/:token/bulkinsert').post(tokenController.bulkInsertTokenPattern);
router.route('/:token/bulkdelete').post(tokenController.bulkDeleteTokenPattern);
router.route('/:token/delete').post(tokenController.deleteTokenPattern);

module.exports = router;