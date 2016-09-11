var express = require('express'),
    authController = require('../controllers/authController.js'),
    doorController = require('../controllers/doorController.js');

var router = express.Router();

router.route('/open').post(authController.authUser, doorController.open);

router.use(authController.authAdmin);
router.route('/').get(doorController.searchDoors);
router.route('/:door/active').post(doorController.toggleDoor);



module.exports = router;