const userService = require('../service/user');
const adService = require('../service/ad');
const helper = require('../helper/helper');

//사용자 화면(GET)
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
          let bannerList = await adService.getAdList('', ''); //광고 조회
          return res.render('system/user/index', { title: '계정 관리', userEmail: email, authCode: authGroupCode, bannerList: bannerList });
        }        
    }
    catch (err) {
        return res.status(500).json(err);
    }
};

//사용자 등록,수정
//setUser

//사용자 조회(개별)

//사용자 조회(리스트)
exports.getUserList = async (req, res, next) => {
    let resModel;
    let userList;

    try {   
        let rows = await userService.getUserList(null, null, null, null);

        if(rows == null){
            resModel = helper.createResponseModel(false, '등록된 계정이 존재하지 않습니다.', '');      
        }
        else {
            //현재 사용중인 이메일은 제거, 시스템 사용자 이메일은 제거, 삭제된 사용자 이메일은 제거
            userList = rows.filter(x => x.EMAIL != req.session.email && x.AUTH_GRP_COD != 'S' && x.DEL_YN != 'Y');

            //불필요한 필드 제거 및 Row Number 재설정
            let rowNo = 1;
            userList.forEach(function(x){ 
                delete x.PWD;
                delete x.PUSH_TOKEN;
                x.NO = rowNo++;
            });

            resModel = helper.createResponseModel(true, '', userList);
        }

        return res.status(200).json(resModel);
    }
    catch (err) {
        return res.status(500).json(err);
    }
};

//사용자 삭제 개별(POST) 
exports.deleteUser = async (req, res, next) => {
    let resModel;
    let userGuidList = [];
    userGuidList.push(helper.changeUndefiendToNull(req.session.userGuid));
    const regUserGuid = helper.getsessionValueOrRequsetValue(req.session.userGuid, req.body.userGuid);
    
    try {

      //사용자 계정이 시스템 관리자인 경우
      if(req.session.authGroupCode == 'S'){
        resModel = helper.createResponseModel(false, '시스템 관리자는 삭제할 수 없습니다.', '');
        return res.status(200).json(resModel);
      }

      //오늘의 출장 삭제
      let retVal = await userService.deleteUserList(userGuidList, 'Y', regUserGuid);

      //삭제
      if (retVal == 1) {
        req.session.destroy(function(){ 
            res.clearCookie();
            resModel = helper.createResponseModel(true, '사용자 삭제에 성공하였습니다.', '');
            return res.status(200).json(resModel);           
        });
      }
      //실패
      else {
        resModel = helper.createResponseModel(false, '사용자 삭제에 실패하였습니다.', '');
        return res.status(200).json(resModel);
      }
    }
    catch (err) {
      return res.status(500).json(err);
    }
};

//사용자 삭제 리스트(POST) 
exports.deleteUserList = async (req, res, next) => {
    let resModel;
    const userGuidList = helper.changeUndefiendToNull(req.body.userGuidList);
    const regUserGuid = helper.getsessionValueOrRequsetValue(req.session.userGuid, req.body.userGuid);
    
    try {
      //오늘의 출장 삭제
      let retVal = await userService.deleteUserList(userGuidList, 'Y', regUserGuid);
  
      //삭제
      if (retVal == 1) {
        resModel = helper.createResponseModel(true, '계정을 삭제하였습니다.', '');
      }
      //실패
      else {
        resModel = helper.createResponseModel(false, '계정 삭제에 실패하였습니다.', '');
      }
  
      return res.status(200).json(resModel);
    }
    catch (err) {
      return res.status(500).json(err);
    }
};

//사용자 사용유무 변경 리스트(POST) 
exports.stopUserList = async (req, res, next) => {
  let resModel;
  const userGuidList = helper.changeUndefiendToNull(req.body.userGuidList);
  const useYn = helper.changeUndefiendToNull(req.body.useYn);
  const regUserGuid = helper.getsessionValueOrRequsetValue(req.session.userGuid, req.body.userGuid);
  
  try {
    //오늘의 출장 삭제
    let retVal = await userService.stopUserList(userGuidList, useYn, regUserGuid);

    //삭제
    if (retVal == 1) {
      resModel = helper.createResponseModel(true, '계정 사용유무를 변경하였습니다.', '');
    }
    //실패
    else {
      resModel = helper.createResponseModel(false, '계정 사용유무 변경에 실패하였습니다.', '');
    }

    return res.status(200).json(resModel);
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