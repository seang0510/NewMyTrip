var indexController = require('../controller/index');
var express = require('express');
var router = express.Router();
const path = require('path');

//로그인
router.get('/login', indexController.getLogin);
router.post('/login/findPassword', indexController.getPasswordByEmail);
router.post('/setPassword', indexController.setPassword);
router.post('/login', indexController.setLogin);
router.get('/login/kakao', indexController.getLoginKakao);
router.get('/login/kakao/callback', indexController.getLoginKakaoCallback);
router.post('/join', indexController.setSignUp);
router.post('/join/social', indexController.setSignUpWithSocial);
router.post('/logout', indexController.setLogout);


//메인화면
router.get('/', indexController.getIndex);
router.post('/', indexController.setLogout);

//mobile
router.post('/mobile/login', indexController.setMobileLogin);
router.post('/mobile/userCheck', indexController.getUserCheck);

//이용약관
router.get('/joinPerson', function(req, res){
    res.sendFile(path.join(__dirname, '..', 'public/html/personalInformation.html'));
});

router.get('/joinConditions', function(req, res){
    res.sendFile(path.join(__dirname, '..', 'public/html/termsConditions.html'));
});

//TEST(주소 -> 위도,경도 변환)
router.post('/testAddress', indexController.getAddress);

//TEST 다음 지도 띄우기
router.get('/daumAddress', indexController.daumAddress);

//TEST 메일 보내기 샘플
router.post('/sendMailSample', indexController.sendMailSample);

router.post('/testZip', indexController.testZip);

console.log("server start! router");

module.exports = router;