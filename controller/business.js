const helper = require('../helper/helper');
const tourLocationService = require('../service/tourLocation');

//오늘의 출장 화면
exports.indexTrip = async (req, res, next) => {
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
        return res.render('business/trip/index', { title: 'Express', userEmail: email, authCode: authGroupCode });
      }        
  }
  catch (err) {
      return res.status(500).json(err);
  }
};

//관광명소 화면
exports.indexTourLocation = async (req, res, next) => {
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
        return res.render('business/tourLocation/index', { title: 'Express', userEmail: email, authCode: authGroupCode });
      }        
  }
  catch (err) {
      return res.status(500).json(err);
  }
};

//관광명소 조회(리스트)
exports.getTourLocationList = async (req, res, next) => {
  let resModel;
  const tourLocationGuid = helper.changeUndefiendToNull(req.query.tourLocationGuid);
  const tourLocationName = helper.changeUndefiendToNull(req.query.tourLocationName);

  try {
      //관광명소 조회
      let rows = await tourLocationService.getTourLocationList(tourLocationGuid, tourLocationName);

      if(rows == null){
        resModel = helper.createResponseModel(false, '등록된 관광명소가 존재하지 않습니다.', null);        
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