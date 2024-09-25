var commonController = require('../controller/common');
var express = require('express');
var router = express.Router();

//공지사항 관리(notice)
router.get('/notice', commonController.indexNotice);

//사진 관리(photo)
router.get('/photo', commonController.indexPhoto);
  
module.exports = router;