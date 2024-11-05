var commonController = require('../controller/common');
var express = require('express');
var router = express.Router();
const { upload } = require('../helper/upload');

//공지사항 관리(notice)
router.get('/notice', commonController.indexNotice);
router.get('/notice/getNotice', commonController.getNotice);
router.post('/notice/getNoticeList', commonController.getNoticeList);
router.post('/notice/setNotice', commonController.setNotice);
router.post('/notice/deleteNotice', commonController.deleteNotice);

//사진 관리(photo)
router.get('/photo', commonController.indexPhoto);

//광고 관리(AD)
router.post('/ad/getAdList', commonController.getAdList);
router.post('/ad/setAd', upload(`common/ad`).single("file"), commonController.setAd);
router.post('/ad/deleteAd', commonController.deleteAd);

module.exports = router;