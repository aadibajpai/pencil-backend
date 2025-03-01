const express = require('express');
const locationController = require('../controllers/location.controller.js');

const router = express.Router();

router.route('/create').post(locationController.addLocation); // add location to database
router.route('/locations').get(locationController.getAllLocations); // get all locations from database

module.exports = router;
