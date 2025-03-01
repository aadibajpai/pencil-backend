const express = require('express');
const formController = require('../controllers/supplyForm.controller.js');

const router = express.Router();

router.route('/addSupply').post(formController.addSupply); // add Supply to shopping form

router.route('/getShopForm').get(formController.fetchSupplyForm); // fetch Supply Form

router.route('/updateSupply').put(formController.updateSupply); // update Supply in shopping form

module.exports = router;
