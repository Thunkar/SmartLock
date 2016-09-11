var express = require('express'),
    authController = require('../controllers/authController.js'),
    statisticsController = require('../controllers/statisticsController.js');

var router = express.Router();

router.use(authController.authAdmin);
router.route('/').get(statisticsController.getLatest);

module.exports = router;