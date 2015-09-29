var express = require('express'),
    doorController = require('../controllers/doorController.js');

var router = express.Router();

router.route('/').get(doorController.searchDoors);
router.route('/:door/active').post(doorController.toggleDoor);
router.route('/open').post(doorController.open);


module.exports = router;