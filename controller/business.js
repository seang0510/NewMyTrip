const helper = require('../helper/helper');
const tourLocationService = require('../service/tourLocation');
const tripService = require('../service/trip');

//오늘의 출장 화면(GET)
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

//오늘의 출장 조회(POST)
exports.getTripList = async (req, res, next) => {
  let resModel;
  const tripGuid = helper.changeUndefiendToNull(req.body.tripGuid);
  const title = helper.changeUndefiendToNull(req.body.title);
  const regUserGuid = helper.changeUndefiendToNull(req.body.regUserGuid);

  try {
    //오늘의 출장 조회
    let rows = await tripService.getTripList(tripGuid, title, regUserGuid);

    if(rows == null){
      resModel = helper.createResponseModel(false, '등록된 오늘의 출장이 존재하지 않습니다.', null);        
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

//오늘의 출장 등록/수정(POST)
exports.setTrip = async (req, res, next) => {
  let resModel;
  const tripGuid = helper.changeUndefiendToNull(req.body.tripGuid);
  const title = helper.changeUndefiendToNull(req.body.title);
  const expireDate = helper.changeUndefiendToNull(req.body.expireDate);
  const userGuid = helper.changeUndefiendToNull(req.body.userGuid);
  const uuid = (tripGuid == null || tripGuid == '') ? helper.generateUUID() : tripGuid;

  try {
    //오늘의 출장 등록,수정
    let retVal = await tripService.setTrip(uuid, title, expireDate, userGuid);

    //등록
    if (retVal == 1) {
      let tripMst = await tripService.getTripList(uuid, '', userGuid);
      if(tripMst != null){
        resModel = helper.createResponseModel(true, '오늘의 출장을 등록하였습니다.', tripMst[0]);
      }else{
        //master 삭제
        console.log(uuid);
        console.log(userGuid);
        let tripMstDelete = await tripService.deleteTrip(uuid, userGuid);
        resModel = helper.createResponseModel(true, '오늘의 출장 디테일 등록에 실패하였습니다.', '');
      }
      
    }
    //실패
    else if (retVal == -1) {
      resModel = helper.createResponseModel(false, '오늘의 출장을 등록,수정에 실패하였습니다.', '');
    }
    //수정
    else {
      resModel = helper.createResponseModel(true, '오늘의 출장을 수정하였습니다.', '');
    }

    return res.status(200).json(resModel);
  }
  catch (err) {
    return res.status(500).json(err);
  }
};

//오늘의 출장 삭제(POST)
exports.deleteTrip = async (req, res, next) => {
let resModel;
const tripGuid = helper.changeUndefiendToNull(req.body.tripGuid);
const userGuid = helper.changeUndefiendToNull(req.body.userGuid);

  try {
    //오늘의 출장 삭제
    let retVal = await tripService.deleteTrip(tripGuid, userGuid);

    //삭제
    if (retVal == 1) {
      resModel = helper.createResponseModel(true, '오늘의 출장을 삭제하였습니다.', null);
    }
    //실패
    else {
      resModel = helper.createResponseModel(false, '오늘의 출장 삭제에 실패하였습니다.', null);
    }

    return res.status(200).json(resModel);
  }
  catch (err) {
    return res.status(500).json(err);
  }
};

//오늘의 출장 상세 조회(POST)
exports.getTripDetailList = async (req, res, next) => {
  let resModel;
  const tripDetailGuid = helper.changeUndefiendToNull(req.body.tripDetailGuid);
  const tripGuid = helper.changeUndefiendToNull(req.body.tripGuid);
  const facilityName = helper.changeUndefiendToNull(req.body.facilityName);
  const address = helper.changeUndefiendToNull(req.body.address);
  const regUserGuid = helper.changeUndefiendToNull(req.body.regUserGuid);

  try {
    //오늘의 출장 조회
    let rows = await tripService.getTripDetailList(tripDetailGuid, tripGuid, facilityName, address, regUserGuid);

    if(rows == null){
      resModel = helper.createResponseModel(false, '등록된 오늘의 출장 상세내역이 존재하지 않습니다.', null);        
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

//오늘의 출장 상세 등록/수정(POST)
exports.setTripDetail = async (req, res, next) => {
  let resModel;
  const tripDetailGuid = helper.changeUndefiendToNull(req.body.tripDetailGuid);
  const tripGuid = helper.changeUndefiendToNull(req.body.tripGuid);
  const facilityName = helper.changeUndefiendToNull(req.body.facilityName);
  const address = helper.changeUndefiendToNull(req.body.address);
  const latitude = helper.changeUndefiendToNull(req.body.latitude);
  const longitude = helper.changeUndefiendToNull(req.body.longitude);
  const order = helper.changeUndefiendToNull(req.body.order);
  const tripDetailItems = helper.changeUndefiendToNull(req.body.tripDetailItems);
  const userGuid = helper.changeUndefiendToNull(req.body.userGuid);

  try {
    //오늘의 출장 등록,수정
    let retVal = await tripService.setTripDetail(tripDetailGuid, tripGuid, facilityName, address, latitude, longitude, order, tripDetailItems, userGuid);

    //등록
    if (retVal == 1) {
      resModel = helper.createResponseModel(true, '오늘의 출장 상세내역을 등록하였습니다.', null);
    }
    //수정
    else if (retVal == 0) {
      resModel = helper.createResponseModel(true, '오늘의 출장 상세내역을 수정하였습니다.', null);      
    }
    //실패
    else {
      resModel = helper.createResponseModel(false, '오늘의 출장 상세내역을 등록,수정에 실패하였습니다.', null);
    }

    return res.status(200).json(resModel);
  }
  catch (err) {
    return res.status(500).json(err);
  }
};

//오늘의 출장 상세 삭제(POST)
exports.deleteTripDetail = async (req, res, next) => {
let resModel;
const tripDetailGuid = helper.changeUndefiendToNull(req.body.tripDetailGuid);
const userGuid = helper.changeUndefiendToNull(req.body.userGuid);

  try {
    //오늘의 출장 삭제
    let retVal = await tripService.deleteTripDetail(tripDetailGuid, userGuid);

    //삭제
    if (retVal == 1) {
      resModel = helper.createResponseModel(true, '오늘의 출장 상세내역을 삭제하였습니다.', null);
    }
    //실패
    else {
      resModel = helper.createResponseModel(false, '오늘의 출장 상세내역 삭제에 실패하였습니다.', null);
    }

    return res.status(200).json(resModel);
  }
  catch (err) {
    return res.status(500).json(err);
  }
};

//관광명소 화면(GET)
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

//관광명소 조회(POST)
exports.getTourLocationList = async (req, res, next) => {
  let resModel;
  const tourLocationGuid = helper.changeUndefiendToNull(req.body.tourLocationGuid);
  const tourLocationName = helper.changeUndefiendToNull(req.body.tourLocationName);

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