const userService = require('../service/user');
const helper = require('../helper/helper');

//사용자 화면
exports.indexUser = async (req, res, next) => {
    try {
        //로그인 되지 않은 경우
        if(!(req.session.valid == true)){
          var msg = helper.setMessageForCookie('로그인 오류', '로그인 하시길 바랍니다.');
          res.cookie('MSG', msg, { httpOnly: false, secure: false });
          return res.redirect('/login');
      }
        //현재 로그인 되어 있는 경우    
        else{
          var email = req.session.email;
          var authGroupCode = req.session.authGroupCode;
          let rows = await userService.getUserList();
          return res.render('system/user/index', { title: 'Express', data: rows, userEmail: email, authCode: authGroupCode });
        }        
    }
    catch (err) {
        return res.status(500).json(err);
    }
};

//사용자 등록,수정
//setUser

//사용자 삭제
//deleteUser

//사용자 조회(개별)
exports.getUser = async (req, res, next) => {
    try {
        let rows = await userService.getUserList();
        req.api = '1';

        if (req.api != null) {
            return res.status(200).json(rows);
        }
        else {
            return res.render('system/user/index', { title: 'Express', data: rows });
        }
    }
    catch (err) {
        return res.status(500).json(err);
    }
};

//사용자 조회(리스트)
exports.getUserList = async (req, res, next) => {
    try {
        let rows = await userService.getUserList();
        req.api = '1';

        if (req.api != null) {
            return res.status(200).json(rows);
        }
        else {
            return res.render('system/user/index', { title: 'Express', data: rows });
        }
    }
    catch (err) {
        return res.status(500).json(err);
    }
};

//공통코드 화면
exports.indexCommonCode = async (req, res, next) => {
  try {
      //로그인 되지 않은 경우
      if(!(req.session.valid == true)){
        var msg = helper.setMessageForCookie('로그인 오류', '로그인 하시길 바랍니다.');
        res.cookie('MSG', msg, { httpOnly: false, secure: false });
        return res.redirect('/login');
    }
      //현재 로그인 되어 있는 경우    
      else{
        var email = req.session.email;
        var authGroupCode = req.session.authGroupCode;
        return res.render('system/commonCode/index', { title: 'Express', userEmail: email, authCode: authGroupCode });
      }        
  }
  catch (err) {
      return res.status(500).json(err);
  }
};

//권한 화면
exports.indexAuth = async (req, res, next) => {
  try {
      //로그인 되지 않은 경우
      if(!(req.session.valid == true)){
        var msg = helper.setMessageForCookie('로그인 오류', '로그인 하시길 바랍니다.');
        res.cookie('MSG', msg, { httpOnly: false, secure: false });
        return res.redirect('/login');
    }
      //현재 로그인 되어 있는 경우    
      else{
        var email = req.session.email;
        var authGroupCode = req.session.authGroupCode;
        return res.render('system/auth/index', { title: 'Express', userEmail: email, authCode: authGroupCode });
      }        
  }
  catch (err) {
      return res.status(500).json(err);
  }
};