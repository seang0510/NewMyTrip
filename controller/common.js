const helper = require('../helper/helper');
const noticeService = require('../service/notice');

//공지사항 화면
exports.indexNotice = async (req, res, next) => {
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
        return res.render('common/notice/index', { title: 'Express', userEmail: email, authCode: authGroupCode });
      }        
  }
  catch (err) {
      return res.status(500).json(err);
  }
};

//사진관리 화면
exports.indexPhoto = async (req, res, next) => {
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
        return res.render('common/photo/index', { title: 'Express', userEmail: email, authCode: authGroupCode });
      }        
  }
  catch (err) {
      return res.status(500).json(err);
  }
};

exports.noticeSelect = async (req, res, next) => {
    console.log("## noticeSelect ##");
    let resModel;
    const email = req.body.board_type_code;   //N:공지사항 ,B:게시판
    console.log("## email ## " + email);

    try {
        //사용자 조회
        let notice = await noticeService.getNoticeList(email);
        console.log(notice);
        resModel = helper.createResponseModel(true, '', notice);
        return res.status(200).json(resModel);
    }
    catch (err) {
        return res.status(500).json(err);
    }
};