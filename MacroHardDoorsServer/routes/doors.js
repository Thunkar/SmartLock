var express = require('express'),
    doorController = require('../controllers/doorController.js');

var router = express.Router();

router.route('/').get(doorController.getDoorsInfo);
router.route('/open').post(doorController.open);


module.exports = router;