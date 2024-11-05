const { render } = require('../app');
const helper = require('../helper/helper');
const adService = require('../service/ad');
const noticeService = require('../service/notice');


//공지사항 화면(GET)
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
        return res.render('common/notice/index', { title: '공지사항', userEmail: email, authCode: authGroupCode });
      }        
  }
  catch (err) {
      return res.status(500).json(err);
  }
};

//공지사항 조회(GET)
exports.getNotice = async (req, res, next) => {
  try {
    //로그인 되지 않은 경우
    if(!(req.session.valid == true)){
      var msg = helper.setMessageForCookie('로그인 오류', '로그인 하시길 바랍니다.');
      res.cookie('MSG', msg, { httpOnly: false, secure: false });
      return res.redirect('/login');
    }
    //현재 로그인 되어 있는 경우    
    else{
      let boardGuid = helper.changeUndefiendToNull(req.query.boardGuid);
      const email = req.session.email;
      const authGroupCode = req.session.authGroupCode;

      //공지사항 조회
      let rows;
      let title;
      let contents;
      let regDate;
      let renderUrl;

      if(boardGuid != null){
        rows = await noticeService.getNoticeList(boardGuid, null, null);
        renderUrl = 'common/notice/read';
      }
      else{
        boardGuid = helper.generateUUID();
        renderUrl = 'common/notice/create';
      }

      if(rows != null){
        title = rows[0]['TTL'];
        contents = rows[0]['CNTS'];
        regDate = rows[0]['REG_DT'];
      }
      else{
        title = '';
        contents = '';
        regDate = helper.dateFormat(new Date());
      }

      return res.render(renderUrl, {
        title: '공지사항',        
        userEmail: email,
        authCode: authGroupCode,
        boardGuid: boardGuid,
        noticeTitle: title,
        contents: contents,
        regDate: regDate,          
      });
    }    
  }
  catch (err) {
      return res.status(500).json(err);
  }
};

//사진관리 화면(GET)
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

//공지사항 조회(POST)
exports.getNoticeList = async (req, res, next) => {
    let resModel;
    console.log("getNoticeList");
    const boardGuid = helper.changeUndefiendToNull(req.body.boardGuid);
    const title = helper.changeUndefiendToNull(req.body.title);
    const contents = helper.changeUndefiendToNull(req.body.contents);
    console.log("boardGuid :: " + boardGuid);

    try {
      //공지사항 조회
      let rows = await noticeService.getNoticeList(boardGuid, title, contents);

      if(rows == null){
        resModel = helper.createResponseModel(false, '등록된 공지사항이 존재하지 않습니다.', '');        
      }
      else{
        resModel = helper.createResponseModel(true, '', rows);
      }    

      return res.status(200).json(resModel);
    }
    catch (err) {
        return res.status(500).json(err);
    }
};

//공지사항 등록/수정(POST)
exports.setNotice = async (req, res, next) => {
  let resModel;
  const boardGuid = helper.changeUndefiendToNull(req.body.boardGuid);
  const title = helper.changeUndefiendToNull(req.body.title);
  const contents = helper.changeUndefiendToNull(req.body.contents);
  const userGuid = helper.changeUndefiendToNull(req.body.userGuid);

  try {
    //공지사항 등록,수정
    let retVal = await noticeService.setNotice(boardGuid, title, contents, userGuid);

    //등록
    if(retVal == 1){
      resModel = helper.createResponseModel(true, '공지사항을 등록하였습니다.', '');        
    }
    //실패
    else if (retVal == -1) {
      resModel = helper.createResponseModel(false, '공지사항을 등록,수정에 실패하였습니다.', '');
    }
    //수정
    else{
      resModel = helper.createResponseModel(true, '공지사항을 수정하였습니다.', '');        
    }

    return res.status(200).json(resModel);
  }
  catch (err) {
      return res.status(500).json(err);
  }
};

//공지사항 삭제(POST)
exports.deleteNotice = async (req, res, next) => {
  let resModel;
  const boardGuid = helper.changeUndefiendToNull(req.body.boardGuid);
  const userGuid = helper.changeUndefiendToNull(req.body.userGuid);

  try {
    //공지사항 삭제
    let retVal = await noticeService.deleteNotice(boardGuid, userGuid);

    //삭제
    if(retVal == 1){
      resModel = helper.createResponseModel(true, '공지사항을 삭제하였습니다.', '');        
    }
    //실패
    else{
      resModel = helper.createResponseModel(false, '공지사항을 삭제에 실패하였습니다.', '');
    }

    return res.status(200).json(resModel);
  }
  catch (err) {
      return res.status(500).json(err);
  }
};

//광고 조회(POST)
exports.getAdList = async (req, res, next) => {
  let resModel;
  const adGuid = helper.changeUndefiendToNull(req.body.adGuid);
  const adName = helper.changeUndefiendToNull(req.body.adName);

  try {
    //공지사항 조회
    let rows = await adService.getAdList(adGuid, adName);

    if(rows == null){
      resModel = helper.createResponseModel(false, '등록된 광고가 존재하지 않습니다.', '');        
    }
    else{
      resModel = helper.createResponseModel(true, '', rows);
    }    

    return res.status(200).json(resModel);
  }
  catch (err) {
      return res.status(500).json(err);
  }
};

//광고 등록/수정(POST)
exports.setAd = async (req, res, next) => {
  let resModel;
  const adGuid = helper.changeUndefiendToNull(req.body.adGuid);
  const adName = helper.changeUndefiendToNull(req.body.adName);
  const urlLink = helper.changeUndefiendToNull(req.body.urlLink);
  const userGuid = helper.changeUndefiendToNull(req.body.userGuid);
  const file = req.file;

  //파일타입이 올바르지 않은 경우
  if (req.fileValidationError != undefined) {
    resModel = helper.createResponseModel(false, req.fileValidationError, null);
    return res.status(200).json(resModel);
  }

try {
  //광고 등록,수정
  let retVal = await adService.setAd(adGuid, adName, file, urlLink, userGuid);

  //등록
  if(retVal == 1){
    resModel = helper.createResponseModel(true, '광고를 등록하였습니다.', '');        
  }
  //실패
  else if (retVal == -1) {
    resModel = helper.createResponseModel(false, '광고를 등록,수정에 실패하였습니다.', '');
  }
  //수정
  else{
    resModel = helper.createResponseModel(true, '광고를 수정하였습니다.', '');        
  }

  return res.status(200).json(resModel);
}
catch (err) {
    return res.status(500).json(err);
}
};

//광고 삭제(POST)
exports.deleteAd = async (req, res, next) => {
let resModel;
const adGuid = helper.changeUndefiendToNull(req.body.adGuid);
const userGuid = helper.changeUndefiendToNull(req.body.userGuid);

try {
  //공지사항 삭제
  let retVal = await adService.deleteAd(adGuid, userGuid);

  //삭제
  if(retVal == 1){
    resModel = helper.createResponseModel(true, '광고를 삭제하였습니다.', '');        
  }
  //실패
  else{
    resModel = helper.createResponseModel(false, '광고를 삭제에 실패하였습니다.', '');
  }

  return res.status(200).json(resModel);
}
catch (err) {
    return res.status(500).json(err);
}
};
