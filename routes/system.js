var systemController = require('../controller/system');
var express = require('express');
var router = express.Router();

//권한 관리(auth)
router.get('/auth', systemController.indexAuth);

//공통코드 관리(commonCode)
router.get('/commonCode', systemController.indexCommonCode);

//사용자 관리(user)
router.get('/user', systemController.indexUser);

//router.get('/user', systemController.getUserList);
router.post('/user', function(req, res, next){
  res.json({ "message" : "POST request to the user page" });
});
router.delete('/user', function(req, res, next){
  res.json({ "message" : "DELETE request to the user page" });
});

module.exports = router;