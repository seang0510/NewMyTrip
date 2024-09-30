var businessController = require('../controller/business');
var express = require('express');
var router = express.Router();

//########### 오늘의 출장 ########### 
router.get('/trip', businessController.indexTrip);


//########### 관광 명소 ########### 
router.get('/tourLocation', businessController.indexTourLocation);
router.post('/tourLocation/getTourLocationList', businessController.getTourLocationList);

//관광 명소 이미지 get (샘플 : http://192.168.0.13:3030/tour_images/3.1.jpg)
router.get('/tour_images/:imageName', function(req, res){
  var imgName = req.params.imageName;
  console.log('이미지 요청: ' + imgName);
  res.sendFile('/public/tour_images/'+imgName);    
});

module.exports = router;