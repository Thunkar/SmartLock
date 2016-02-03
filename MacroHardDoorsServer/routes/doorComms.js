var express = require('express'),
    doorCommController = require('../controllers/doorCommController.js');

var router = express.Router();

router.route('/handshake').post(doorCommController.handshake);
router.route('/heartbeat').post(doorCommController.heartbeat);
router.route('/status').post(doorCommController.setDoorStatus);

module.exports = router;