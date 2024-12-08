var businessController = require('../controller/business');
var express = require('express');
var router = express.Router();
const { upload } = require('../helper/upload');
const path = require('path');

//########### 오늘의 출장 ########### 
router.get('/trip', businessController.indexTrip);
router.get('/trip/detail', businessController.indexTripDetail);
router.get('/trip/detailmap', businessController.indexTripDetailMap);
router.get('/trip/findAddress', businessController.findAddress); //카카오 지도 열기
router.post('/trip/getTripList', businessController.getTripList);
router.post('/trip/getTripWithItems', businessController.getTripWithItems);
router.post('/trip/setTrip', businessController.setTrip);
router.post('/trip/setTripWithItems', businessController.setTripWithItems);
router.post('/trip/importTrip', upload(`business/trip`).single("file"), businessController.importTrip);
router.post('/trip/importTripForWeb', upload(`business/trip`, `latin1`).single("file"), businessController.importTrip);
router.post('/trip/exportTrip', businessController.exportTrip);
router.post('/trip/mobile/exportTrip', businessController.mobileExportTrip);
router.post('/trip/deleteTrip', businessController.deleteTrip);
router.post('/trip/deleteTripList', businessController.deleteTripList);
router.post('/trip/getTripDetail', businessController.getTripDetail);
router.post('/trip/getTripDetailWaterMark', businessController.getTripDetailWaterMark);
router.post('/trip/getTripDetailList', businessController.getTripDetailList);
router.post('/trip/getTripDetailListForPin', businessController.getTripDetailListForPin);
router.post('/trip/getTripDetailListForImage', businessController.getTripDetailListForImage);
router.post('/trip/exportTripDetailImage', businessController.exportTripDetailImage);
router.post('/trip/setTripDetail', businessController.setTripDetail);
router.post('/trip/setTripDetailCompYN', businessController.setTripDetailCompYN);
router.post('/trip/setTripDetailImages', upload(`business/trip`).array("files"), businessController.setTripDetailImages);
router.post('/trip/setTripDetailImagesForWeb', upload(`business/trip`, `latin1`).array("files"), businessController.setTripDetailImages);
router.post('/trip/setTripDetailWithImages', upload(`business/trip`).array("files"), businessController.setTripDetailWithImages);
router.post('/trip/deleteTripDetail', businessController.deleteTripDetail);
router.post('/trip/deleteTripDetailList', businessController.deleteTripDetailList);
router.post('/trip/deleteTripDetailImages', businessController.deleteTripDetailImages);
router.post('/trip/getItem', businessController.getItem);
router.post('/trip/setTripStartDay', businessController.setTripStartDay);
router.post('/trip/getAddressByCoordinate', businessController.getAddressByCoordinate); //위도,경도 -> 주소 변환
router.post('/trip/setAddressAndCoordinate', businessController.setAddressAndCoordinate); //주소,위도,경도 수정
router.post('/trip/getCoordinateByAddress', businessController.getCoordinateByAddress); //주소 -> 위도,경도 변환
router.post('/trip/setCoordinateByAddress', businessController.setCoordinateByAddress); //주소 -> 위도,경도 변환 바로 상세 테이블에 적용

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
  res.sendFile('/uploads/business/trip/'+imgName);    
});

//http://192.168.0.13:3030/business/excelDown/2024-11-7위도경도없는중복_TripData.xlsx
router.get('/excelDown/:fileName', function(req, res){
  var fileName = req.params.fileName;
  res.sendFile(path.join(__dirname, '..', 'public/download/' + fileName));    
});

module.exports = router;