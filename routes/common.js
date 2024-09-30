var commonController = require('../controller/common');
var express = require('express');
var router = express.Router();

//공지사항 관리(notice)
router.get('/notice', commonController.indexNotice);
router.post('/notice/getNoticeList', commonController.getNoticeList);
router.post('/notice/setNotice', commonController.setNotice);
router.post('/notice/deleteNotice', commonController.deleteNotice);

//사진 관리(photo)
router.get('/photo', commonController.indexPhoto);
  
module.exports = router;