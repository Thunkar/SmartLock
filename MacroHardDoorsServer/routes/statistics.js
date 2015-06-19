var express = require('express'),
    statisticsController = require('../controllers/statisticsController.js');

var router = express.Router();

router.route('/').get(statisticsController.getLatest);

module.exports = router;