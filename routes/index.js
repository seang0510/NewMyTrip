var indexController = require('../controller/index');
var express = require('express');
var router = express.Router();
const path = require('path');

//로그인
router.get('/login', indexController.getLogin);
router.get('/login/findPassword', indexController.getPasswordByEmail); //API 공용
router.post('/login', indexController.setLogin);
router.post('/join', indexController.setSignUp); //API 공용
router.post('/logout', indexController.setLogout);

//메인화면
router.get('/', indexController.getIndex);
router.post('/', indexController.setLogout);

//mobile
router.post('/mobile/login', indexController.setMobileLogin);

//이용약관
router.get('/joinPerson', function(req, res){
    res.sendFile(path.join(__dirname, '..', 'public/html/personalInformation.html'));
});

router.get('/joinConditions', function(req, res){
    res.sendFile(path.join(__dirname, '..', 'public/html/termsConditions.html'));
});

console.log("server start! router");

module.exports = router;