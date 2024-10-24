var businessController = require('../controller/business');
var express = require('express');
var router = express.Router();
const { upload } = require('../helper/upload');

//########### 오늘의 출장 ########### 
router.get('/trip', businessController.indexTrip);
router.post('/trip/getTripList', businessController.getTripList);
router.post('/trip/setTrip', businessController.setTrip);
router.post('/trip/deleteTrip', businessController.deleteTrip);
router.post('/trip/getTripDetail', businessController.getTripDetail);
router.post('/trip/getTripDetailWaterMark', businessController.getTripDetailWaterMark);
router.post('/trip/getTripDetailList', businessController.getTripDetailList);
router.post('/trip/setTripDetail', businessController.setTripDetail);
router.post('/trip/setTripDetailImage', upload(`business/trip`).single("file"), businessController.setTripDetailImage);
router.post('/trip/deleteTripDetail', businessController.deleteTripDetail);

//########### 관광 명소 ########### 
router.get('/tourLocation', businessController.indexTourLocation);
router.post('/tourLocation/getTourLocationList', businessController.getTourLocationList);

//관광 명소 이미지 get (샘플 : http://54.252.145.88:3030/tour_images/3.1.jpg)
router.get('/tour_images/:imageName', function(req, res){
  var imgName = req.params.imageName;
  console.log('이미지 요청: ' + imgName);
  res.sendFile('/public/tour_images/'+imgName);    
});

//배너 이미지 get (샘플 : http://192.168.0.13:3030/banner/라면.jpg)
router.get('/banner/:imageName', function(req, res){
  var imgName = req.params.imageName;
  console.log('이미지 요청: ' + imgName);
  res.sendFile('/public/banner/'+imgName);    
});

//디테일 상세 이미지(샘플 : http://192.168.0.13:3030/business/trip/1729702082687_라면.jpg)
router.get('/trip/:imageName', function(req, res){
  var imgName = req.params.imageName;
  console.log('이미지 요청: ' + imgName);
  res.readFile('/uploads/business/trip/'+imgName);    
});

module.exports = router;