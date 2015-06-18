var express = require('express'),
    doorController = require('../controllers/doorController.js');

var router = express.Router();

router.route('/handshake').post(doorController.handshake);
router.route('/heartbeat').post(doorController.heartbeat);

module.exports = router;