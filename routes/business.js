var businessController = require('../controller/business');
var express = require('express');
var router = express.Router();

//오늘의 출장(trip)
router.get('/trip', businessController.indexTrip);

//관광 명소(tourLocation)
router.get('/tourLocation', businessController.indexTourLocation);
  
module.exports = router;