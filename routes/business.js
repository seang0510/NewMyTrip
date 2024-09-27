var businessController = require('../controller/business');
var express = require('express');
var router = express.Router();

//########### 오늘의 출장 ########### 
//오늘의 출장(trip)
router.get('/trip', businessController.indexTrip);



//########### 관광 명소 ########### 
//관광 명소(tourLocation)
router.get('/tourLocation', businessController.indexTourLocation);

//관광 명소 이미지 get (샘플 : http://192.168.0.13:3030/tour_images/3.1.jpg)
router.get('/tour_images/:imageName', function(req, res){
  var imgName = req.params.imageName;
  console.log('이미지 요청: ' + imgName);
  res.sendFile('/public/tour_images/'+imgName);    
});

//관광면소 리스트 가져오기
router.post('/tourLocation/select', businessController.tourLocationSelect);

module.exports = router;