var indexController = require('../controller/index');
var express = require('express');
var router = express.Router();
const path = require('path');

//upload setting
const multer = require('multer')
// multer 미들웨어 설정
const storage = multer.diskStorage({
    // 어디에 저장할지 경로 설정
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    // 파일 이름을 바꾸는 설정
    // 안 바꾸고 싶으면 originalname을 filename으로 주면 됨
    filename: function( req, file, cb) {
        console.log(file.originalname)
        console.log(file.mimetype)
        const filename = Date.now() +"_"+file.originalname
        cb(null, filename)
    }
})
const upload = multer({storage})// 미들웨어를 만들어주는 것

//로그인
router.get('/login', indexController.getLogin);
router.post('/login/findPassword', indexController.getPasswordByEmail);
router.post('/setPassword', indexController.setPassword);
router.post('/login', indexController.setLogin);
router.post('/join', indexController.setSignUp);
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


//TEST(주소 -> 위도,경도 변환)
router.post('/testAddress', indexController.getAddress);

//TEST(파일 업로드 / mutipart)
router.post('/fileUpload', upload.single("file") , indexController.setFileUpload);


console.log("server start! router");

module.exports = router;