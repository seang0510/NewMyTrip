const helper = require('../helper/helper');
const tourLocationService = require('../service/tourLocation');
const tripService = require('../service/trip');
const adService = require('../service/ad');
const exceljs = require('../helper/trip/excel');
const path = require('path');
const axios = require("axios");

//오늘의 출장 화면(GET)123ßß
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
        let bannerList = await adService.getAdList('', ''); //광고 조회

        return res.render('business/trip/index', { title: '모두의 출장', userEmail: email, authCode: authGroupCode, bannerList: bannerList });
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
  let regUserGuid = helper.changeUndefiendToNull(req.body.regUserGuid);

  //시스템 관리자인 경우, 전체 조회
  if(req.body.mobieYn == "Y"){
    //regUserGuid = req.body.userGuid;
  } else{
    if(helper.existSessoin(req.session)){
      const authGroupCode = req.session.authGroupCode;
      if(authGroupCode == 'S'){
        regUserGuid = null;
      }
      else{
        regUserGuid = req.session.userGuid;
      }
    }
  }
  

  try {
    //오늘의 출장 조회
    let rows = await tripService.getTripList(tripGuid, title, regUserGuid);

    if(rows == null){
      resModel = helper.createResponseModel(false, '등록된 오늘의 출장이 존재하지 않습니다.', '');        
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

//오늘의 출장 조회 + 오늘의 출장 상세 아이템(POST)
exports.getTripWithItems = async (req, res, next) => {
  let resModel;
  const tripGuid = helper.changeUndefiendToNull(req.body.tripGuid);
  let regUserGuid;

  //시스템 관리자인 경우, 전체 조회
  //시스템 관리자인 경우, 전체 조회
  if(req.body.mobieYn == "Y"){
    //regUserGuid = req.body.userGuid;
  } else{
    if(helper.existSessoin(req.session)){
      const authGroupCode = req.session.authGroupCode;
      if(authGroupCode == 'S'){
        regUserGuid = null;
      }
      else{
        regUserGuid = req.session.userGuid;
      }
    }
  }

  //시스템 관리자인 경우, 전체 조회
  //시스템 관리자인 경우, 전체 조회
  if(req.body.mobieYn == "Y"){
    //regUserGuid = req.body.userGuid;
  } else{
    if(helper.existSessoin(req.session)){
      const authGroupCode = req.session.authGroupCode;
      if(authGroupCode == 'S'){
        regUserGuid = null;
      }
      else{
        regUserGuid = req.session.userGuid;
      }
    }
  }

  try {
    //오늘의 출장 조회
    resModel = await tripService.getTripWithItems(tripGuid, regUserGuid);
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
  const startDate = helper.changeUndefiendToNull(req.body.startDate);

  const markFacilityNameYn = helper.changeUndefiendToNull(req.body.markFacilityNameYn);
  let markAddressYn = helper.changeUndefiendToNull(req.body.markAddressYn);
  const markItemYn = helper.changeUndefiendToNull(req.body.markItemYn);
  const markItemName = helper.changeUndefiendToNull(req.body.markItemName);
  const markColor = helper.changeUndefiendToNull(req.body.markColor);

  const userGuid = helper.getsessionValueOrRequsetValue(req.session.userGuid, req.body.userGuid);
  const uuid = (tripGuid == null || tripGuid == '') ? helper.generateUUID() : tripGuid;

  try {
    //디폴트 주소 Y
    markAddressYn = markAddressYn == null ? "Y" : markAddressYn;
    //오늘의 출장 등록,수정
    let retVal = await tripService.setTrip(uuid, title, startDate,
           markFacilityNameYn, markAddressYn, markItemYn, markItemName, markColor, userGuid);

    //등록
    if (retVal == 1) {
      let tripMst = await tripService.getTripList(uuid, '', userGuid);
      if (tripMst != null) {
        resModel = helper.createResponseModel(true, '오늘의 출장을 등록하였습니다.', tripMst[0]);
      } else {
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

//오늘의 출장 등록/수정 + 오늘의 출장 상세 아이템(POST)
exports.setTripWithItems = async (req, res, next) => {
  let resModel;
  const tripGuid = helper.changeUndefiendToNull(req.body.tripGuid);
  const title = helper.changeUndefiendToNull(req.body.title);
  const tripDetailItems = helper.changeUndefiendToNull(req.body.tripDetailItems);
  const userGuid = helper.getsessionValueOrRequsetValue(req.session.userGuid, req.body.userGuid);
  
  try {
    //오늘의 출장 등록,수정 + 오늘의 출장 상세 아이템
    let retVal = await tripService.setTripWithItems(tripGuid, title, tripDetailItems, userGuid);

    //등록
    if (retVal == 1) {
      resModel = helper.createResponseModel(true, '오늘의 출장을 등록하였습니다.', '');
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

//오늘의 출장 일괄등록(POST)
exports.importTrip = async (req, res, next) => {
  console.log("## importTrip ##");
  let resModel;
  const file = req.file;
  const userGuid = helper.getsessionValueOrRequsetValue(req.session.userGuid, req.body.userGuid);
  // const fileName = helper.changeUndefiendToNull(req.body.fileName);

  //파일타입이 올바르지 않은 경우
  if (req.fileValidationError != undefined) {
    resModel = helper.createResponseModel(false, req.fileValidationError, null);
    return res.status(200).json(resModel);
  }

  try {
    //오늘의 출장 엑셀 등록,수정
    console.log("오늘의 출장 엑셀 등록,수정");
    let resModel = await tripService.importTrip(file, userGuid);
    return res.status(200).json(resModel);
  }
  catch (err) {
    return res.status(500).json(err);
  }
};

//오늘의 출장 엑셀 다운로드(POST)
exports.exportTrip = async (req, res, next) => {
  let resModel;
  const tripGuid = helper.changeUndefiendToNull(req.body.tripGuid);
  const regUserGuid = helper.changeUndefiendToNull(req.body.regUserGuid);

  //오늘의 출장 조회
  const data = await tripService.exportTrip(tripGuid, regUserGuid);

  if(data == null){
    resModel = helper.createResponseModel(false, '등록된 오늘의 출장 상세내역이 존재하지 않습니다.', '');        
  }

  let fixedColumnCaptions = '번호,명칭,주소,상세주소,위도,경도';
  let fixedColumns = 'ODR,FCLT_NM,ADDR,ADDR_DTL,LAT,LNG';
  let variableColumns = '';
  let fields = Object.keys(data.tripDetails[0]);

  for (var i = 0; i < fields.length; i++) {
    let colName = fields[i];

    //고정컬럼이 아니며, 제외컬럼이 아니며, 가변컬럼에 등록되지 않은 경우
    if(fixedColumns.indexOf(colName) == -1 && variableColumns.indexOf(colName) == -1){

      //처음인 경우가 아니면 쉼표 붙이기
      if(variableColumns != ''){
        variableColumns += ',' + colName;
      }
      else{
        variableColumns += colName;
      }        
    }
  }

  let columns = fixedColumns + ',' + variableColumns;
  let captions =  fixedColumnCaptions + ',' + variableColumns;

  
  var menu = data.title;
  exceljs.excelDownload(menu, data.tripDetails,data.title, captions, columns, res);
};

//오늘의 출장 엑셀 다운로드(POST)
exports.mobileExportTrip = async (req, res, next) => {
  let resModel;
  let resExcelModel;
  const tripGuid = helper.changeUndefiendToNull(req.body.tripGuid);
  const regUserGuid = helper.changeUndefiendToNull(req.body.regUserGuid);

  //오늘의 출장 조회
  const data = await tripService.exportTrip(tripGuid, regUserGuid);

  //console.log("data :: " + JSON.stringify(data.tripDetails));
  if(data == null){
    resModel = helper.createResponseModel(false, '등록된 오늘의 출장 상세내역이 존재하지 않습니다.', '');        
  }

  let fixedColumnCaptions = '번호,명칭,주소,상세주소,위도,경도';
  let fixedColumns = 'ODR,FCLT_NM,ADDR,ADDR_DTL,LAT,LNG';
  let variableColumns = '';
  let fields = Object.keys(data.tripDetails[0]);

  for (var i = 0; i < fields.length; i++) {
    let colName = fields[i];

    //고정컬럼이 아니며, 제외컬럼이 아니며, 가변컬럼에 등록되지 않은 경우
    if(fixedColumns.indexOf(colName) == -1 && variableColumns.indexOf(colName) == -1){

      //처음인 경우가 아니면 쉼표 붙이기
      if(variableColumns != ''){
        variableColumns += ',' + colName;
      }
      else{
        variableColumns += colName;
      }        
    }
  }

  let columns = fixedColumns + ',' + variableColumns;
  let captions =  fixedColumnCaptions + ',' + variableColumns;
  console.log("columns :: " + columns);
  console.log("captions :: " + columns);
  console.log("data.tripDetails :: " + JSON.stringify(data.tripDetails));
  var menu = data.title;
  resExcelModel = exceljs.excelMobileDownload(menu, data.tripDetails,data.title, captions, columns, res);

  
};

//오늘의 출장 삭제(POST) 
exports.deleteTrip = async (req, res, next) => {
let resModel;
const tripGuid = helper.changeUndefiendToNull(req.body.tripGuid);
const userGuid = helper.getsessionValueOrRequsetValue(req.session.userGuid, req.body.userGuid);

  try {
    //오늘의 출장 삭제
    let retVal = await tripService.deleteTrip(tripGuid, userGuid);

    //삭제
    if (retVal == 1) {
     resModel = helper.createResponseModel(true, '오늘의 출장을 삭제하였습니다.', '');
    }
    //실패
    else {
      resModel = helper.createResponseModel(false, '오늘의 출장 삭제에 실패하였습니다.', '');
    }

    return res.status(200).json(resModel);
  }
  catch (err) {
    return res.status(500).json(err);
  }
};

//오늘의 출장 삭제 리스트(POST) 
exports.deleteTripList = async (req, res, next) => {
  let resModel;
  const tripGuidList = helper.changeUndefiendToNull(req.body.tripGuidList);
  const userGuid = helper.getsessionValueOrRequsetValue(req.session.userGuid, req.body.userGuid);
  
  try {
    //오늘의 출장 삭제
    let retVal = await tripService.deleteTripList(tripGuidList, userGuid);

    //삭제
    if (retVal == 1) {
      resModel = helper.createResponseModel(true, '오늘의 출장을 삭제하였습니다.', '');
    }
    //실패
    else {
      resModel = helper.createResponseModel(false, '오늘의 출장 삭제에 실패하였습니다.', '');
    }

    return res.status(200).json(resModel);
  }
  catch (err) {
    return res.status(500).json(err);
  }
};

//오늘의 출장 상세 화면(GET)
exports.indexTripDetail = async (req, res, next) => {
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
        var tripGuid = req.query.tripGuid;        
        var tripDetailGuid = req.query.tripDetailGuid;        
        let itemList = await tripService.getItem(tripGuid);
        let itemNameList = itemList.map(x => x.ITM_NM);
        let bannerList = await adService.getAdList('', ''); //광고 조회
        const userGuid = helper.getsessionValueOrRequsetValue(req.session.userGuid, req.body.userGuid);
        const trip = await tripService.getTripList(tripGuid, null, userGuid);
        let tripName = trip == null ? '모두의 출장 상세' : trip[0].TTL;

        if(tripGuid == null){
          return res.redirect('/business/trip');
        }
        else{
          return res.render('business/trip/detail', { title: '모두의 출장 상세', userEmail: email, authCode: authGroupCode, bannerList: bannerList, tripGuid: tripGuid, tripDetailGuid: tripDetailGuid, tripName: tripName, itemNameList: JSON.stringify(itemNameList) });
        }        
      }        
  }
  catch (err) {
      return res.status(500).json(err);
  }
};

//오늘의 출장 상세 지도보기 화면(GET)
exports.indexTripDetailMap = async (req, res, next) => {
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
        var tripGuid = req.query.tripGuid;
        var tripDetailGuid = req.query.tripDetailGuid;
        let itemList = await tripService.getItem(tripGuid);
        let itemNameList = itemList.map(x => x.ITM_NM);
        let bannerList = await adService.getAdList('', ''); //광고 조회
        const userGuid = helper.getsessionValueOrRequsetValue(req.session.userGuid, req.body.userGuid);
        const trip = await tripService.getTripList(tripGuid, null, userGuid);
        let tripName = trip == null ? '모두의 출장 상세 지도보기' : trip[0].TTL;

        if(tripGuid == null){
          return res.redirect('/business/trip');
        }
        else{
          return res.render('business/trip/detailmap', { title: '모두의 출장 상세 지도보기', userEmail: email, authCode: authGroupCode, bannerList: bannerList, tripGuid: tripGuid, tripDetailGuid: tripDetailGuid, tripName: tripName, itemNameList: JSON.stringify(itemNameList) });
        }        
      }        
  }
  catch (err) {
      return res.status(500).json(err);
  }
};

//오늘의 출장 상세 개별 조회(POST)
exports.getTripDetail = async (req, res, next) => {
  let resModel;
  const tripDetailGuid = helper.changeUndefiendToNull(req.body.tripDetailGuid);
  const tripGuid = helper.changeUndefiendToNull(req.body.tripGuid);

  try {
    //오늘의 출장 조회
    let rows = await tripService.getTripDetail(tripDetailGuid, tripGuid);

    if(rows == null){
      resModel = helper.createResponseModel(false, '등록된 오늘의 출장 상세내역이 존재하지 않습니다.', '');        
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

//오늘의 출장 상세 워터마크 조회(POST)
exports.getTripDetailWaterMark = async (req, res, next) => {
  let resModel;
  const tripGuid = helper.changeUndefiendToNull(req.body.tripGuid);

  try {
    //오늘의 출장 상세 워터마크 조회
    let rows = await tripService.getTripDetailWaterMark(tripGuid);

    if(rows == null){
      resModel = helper.createResponseModel(false, '등록된 오늘의 출장 상세 워터마크가 존재하지 않습니다.', null);        
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

//오늘의 출장 상세 리스트 조회(POST)
exports.getTripDetailList = async (req, res, next) => {
  let resModel;
  const tripDetailGuid = helper.changeUndefiendToNull(req.body.tripDetailGuid);
  const tripGuid = helper.changeUndefiendToNull(req.body.tripGuid);
  const facilityName = helper.changeUndefiendToNull(req.body.facilityName);
  const address = helper.changeUndefiendToNull(req.body.address);
  const regUserGuid = helper.changeUndefiendToNull(req.body.regUserGuid);

  try {
    //오늘의 출장 조회
    let [rows, fields]  = await tripService.getTripDetailList(tripDetailGuid, tripGuid, facilityName, address, regUserGuid);
    let columnNames = helper.getColumnNames(fields[0]);
    if(rows == null){
      resModel = helper.createResponseModel(false, '등록된 오늘의 출장 상세내역이 존재하지 않습니다.', rows[0], columnNames);        
    }
    else{
      resModel = helper.createResponseModel(true, '', rows[0], columnNames);
    }    

    return res.status(200).json(resModel);
  }
  catch (err) {
      return res.status(500).json(err);
  }
};

exports.getItem = async (req, res, next) => {
  let resModel;
  const tripGuid = helper.changeUndefiendToNull(req.body.tripGuid);
  const regUserGuid = helper.changeUndefiendToNull(req.body.regUserGuid);

  console.log(tripGuid);
  try {
    //오늘의 출장 조회
    let tripItm  = await tripService.getItem(tripGuid);

    if(tripItm == null){
      resModel = helper.createResponseModel(false, '등록된 오늘의 출장 컬럼이 존재하지 않습니다.', '');        
    }
    else{
      resModel = helper.createResponseModel(true, '모두의 출장 컬럼이 조회 되었습니다.', tripItm);
    }    

    return res.status(200).json(resModel);
  }
  catch (err) {
      return res.status(500).json(err);
  }
};

//오늘의 출장 상세 리스트 조회:핀 목록(POST)
exports.getTripDetailListForPin = async (req, res, next) => {
  let resModel;
  const tripGuid = helper.changeUndefiendToNull(req.body.tripGuid);
  const regUserGuid = helper.changeUndefiendToNull(req.body.regUserGuid);

  try {
    //오늘의 출장 조회
    let tripDetailList  = await tripService.getTripDetailListForPin(tripGuid, regUserGuid);

    if(tripDetailList == null){
      resModel = helper.createResponseModel(false, '등록된 오늘의 출장 상세내역이 존재하지 않습니다.', '');        
    }
    else{
      resModel = helper.createResponseModel(true, '', tripDetailList);
    }    

    return res.status(200).json(resModel);
  }
  catch (err) {
      return res.status(500).json(err);
  }
};

//오늘의 출장 상세 조회(리스트):이미지 전체 다운로드(POST)
exports.getTripDetailListForImage = async (req, res, next) => {
  let resModel;
  const tripGuid = helper.changeUndefiendToNull(req.body.tripGuid);
  const regUserGuid = helper.changeUndefiendToNull(req.body.regUserGuid);
  const fileName = helper.changeUndefiendToNull(req.body.fileName);

  try {
    //오늘의 출장 조회
    let rows = await tripService.getTripDetailListForImage(tripGuid, regUserGuid);

    if(rows == null){
      resModel = helper.createResponseModel(false, '오늘의 출장 상세 이미지가 존재하지 않습니다.', '');        
    }
    else{
      resModel = helper.createResponseModel(true, '', rows);
    }    

    var fs = require("fs");
    var zip = new require('node-zip')();
    var checkFile = 0;

    for (var i = 0; i < resModel.value.length; i++) {
      console.log(resModel.value[i].FILE_NM);
      if(fs.existsSync('.' + resModel.value[i].FILE_PATH)){ // 파일이 존재한다면 true 그렇지 않은 경우 false 반환

        checkFile = 1;
        
        
        zip.file(decodeURI(resModel.value[i].FILE_NM), fs.readFileSync('.' + resModel.value[i].FILE_PATH));
      }else{
        console.log("## 파일 XX");
      }
    }

    if(checkFile > 0){
      //파일 존재
      var data = zip.generate({base64:false, compression:'DEFLATE'});
      fs.writeFileSync("./public/download/"+fileName + ".zip", data, 'binary');

      var returnData = new Object();
      returnData.url = fileName + ".zip";
      console.log(returnData);
      resModel = helper.createResponseModel(true, '이미지 파일이 존재 합니다.', returnData);
    }else{
      //이미지 파일 존재 하지 않음
      
      
      resModel = helper.createResponseModel(false, '이미지 파일이 존재 하지 않습니다.', '');
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
  const addressDetail = helper.changeUndefiendToEmpty(req.body.addressDetail);
  const latitude = helper.changeUndefiendToNull(req.body.latitude);
  const longitude = helper.changeUndefiendToNull(req.body.longitude);
  const compYn = helper.changeUndefiendToNull(req.body.compYn);
  const order = helper.changeUndefiendToZero(req.body.order);
  const tripDetailItems = helper.changeUndefiendToNull(req.body.tripDetailItems);
  const userGuid = helper.getsessionValueOrRequsetValue(req.session.userGuid, req.body.userGuid);

  try {
    //오늘의 출장 등록,수정
    let retVal = await tripService.setTripDetail(tripDetailGuid, tripGuid, facilityName, address, addressDetail, latitude, longitude, compYn, order, tripDetailItems, userGuid);

    //등록
    if (retVal == 1) {
      resModel = helper.createResponseModel(true, '오늘의 출장 상세내역을 등록하였습니다.', '');
    }
    //수정
    else if (retVal == 0) {
      resModel = helper.createResponseModel(true, '오늘의 출장 상세내역을 수정하였습니다.', '');      
    }
    //실패
    else {
      resModel = helper.createResponseModel(false, '오늘의 출장 상세내역을 등록,수정에 실패하였습니다.', '');
    }

    return res.status(200).json(resModel);
  }
  catch (err) {
    return res.status(500).json(err);
  }
};

exports.setTripStartDay = async (req, res, next) => {
  let resModel;
  const userGuid = helper.changeUndefiendToNull(req.body.userGuid);
  const tripMstGuid = helper.changeUndefiendToNull(req.body.tripMstGuid);

  try {
    //오늘의 출장 등록,수정
    let retVal = await tripService.setTripStartDay(tripMstGuid , userGuid);

    //성공
    if (retVal == 1) {
      resModel = helper.createResponseModel(true, '만료일을 수정 완료 하였습니다.', '');
    }
    //실패
    else {
      resModel = helper.createResponseModel(false, '만료일을 수정 실패 하였습니다.', '');
    }

    return res.status(200).json(resModel);
  }
  catch (err) {
    return res.status(500).json(err);
  }
};

//오늘의 출장 상세 확정
exports.setTripDetailCompYN = async (req, res, next) => {
  let resModel;
  const tripDetailGuid = helper.changeUndefiendToNull(req.body.tripDetailGuid);
  let compYn = helper.changeUndefiendToNull(req.body.compYn);
  compYn = compYn.toUpperCase();
  const userGuid = helper.changeUndefiendToNull(req.body.userGuid);
  const msg = compYn == "Y" ? "확정" : "확정 롤백";

  try {
    //오늘의 출장 등록,수정
    let retVal = await tripService.setTripDetailCompYN(tripDetailGuid, compYn, userGuid);

    //성공
    if (retVal == 1) {
      resModel = helper.createResponseModel(true, '오늘의 출장 상세를 ' + msg + '하였습니다.', '');
    }
    //실패
    else {
      resModel = helper.createResponseModel(false, '오늘의 출장 상세  ' + msg + '에 실패하였습니다.', '');
    }

    return res.status(200).json(resModel);
  }
  catch (err) {
    return res.status(500).json(err);
  }
};

//오늘의 출장 상세 이미지 등록(POST)
exports.setTripDetailImages = async (req, res, next) => {
  let resModel;
  const tripDetailGuid = helper.changeUndefiendToNull(req.body.tripDetailGuid);
  const userGuid = helper.getsessionValueOrRequsetValue(req.session.userGuid, req.body.userGuid);
  const files = req.files;

  try {
    //오늘의 출장 등록,수정
    let retVal = await tripService.setTripDetailImages(tripDetailGuid, files, userGuid);

    //등록
    if (retVal == 1) {
      resModel = helper.createResponseModel(true, '오늘의 출장 상세 이미지를 등록하였습니다.', '');
    }
    //수정
    else if (retVal == 0) {
      resModel = helper.createResponseModel(false, '등록할 오늘의 출장 상세 이미지가 없습니다.', '');      
    }
    //실패
    else {
      resModel = helper.createResponseModel(false, '오늘의 출장 상세 이미지를 등록에 실패하였습니다.', '');
    }

    return res.status(200).json(resModel);
  }
  catch (err) {
    return res.status(500).json(err);
  }
};

//오늘의 출장 상세 등록/수정(이미지 포함)(POST)
exports.setTripDetailWithImages = async (req, res, next) => {
  let resModel;
  const tripDetailGuid = helper.changeUndefiendToNull(req.body.tripDetailGuid);
  const tripGuid = helper.changeUndefiendToNull(req.body.tripGuid);
  const facilityName = helper.changeUndefiendToNull(req.body.facilityName);
  const address = helper.changeUndefiendToNull(req.body.address);
  const addressDetail = helper.changeUndefiendToEmpty(req.body.addressDetail);
  const latitude = helper.changeUndefiendToNull(req.body.latitude);
  const longitude = helper.changeUndefiendToNull(req.body.longitude);
  const compYn = helper.changeUndefiendToNull(req.body.compYn);
  const order = helper.changeUndefiendToZero(req.body.order);
  const tripDetailItems = JSON.parse(helper.changeUndefiendToNull(req.body.tripDetailItems));
  const userGuid = helper.changeUndefiendToNull(req.body.userGuid);
  const files = req.files;

  try {
    //오늘의 출장 등록,수정
    let retVal = await tripService.setTripDetailWithImages(tripDetailGuid, tripGuid, facilityName, address, addressDetail, latitude, longitude, compYn, order, tripDetailItems, files, userGuid);

    //등록
    if (retVal == 1) {
      resModel = helper.createResponseModel(true, '오늘의 출장 상세내역을 등록하였습니다.', '');
    }
    //수정
    else if (retVal == 0) {
      resModel = helper.createResponseModel(true, '오늘의 출장 상세내역을 수정하였습니다.', '');      
    }
    //실패
    else {
      resModel = helper.createResponseModel(false, '오늘의 출장 상세내역을 등록,수정에 실패하였습니다.', '');
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

//오늘의 출장 상세 삭제 리스트(POST) 
exports.deleteTripDetailList = async (req, res, next) => {
  let resModel;
  const tripDetailGuidList = helper.changeUndefiendToNull(req.body.tripDetailGuidList);
  const userGuid = helper.getsessionValueOrRequsetValue(req.session.userGuid, req.body.userGuid);
  
  try {
    //오늘의 출장 삭제
    let retVal = await tripService.deleteTripDetailList(tripDetailGuidList, userGuid);

    //삭제
    if (retVal == 1) {
      resModel = helper.createResponseModel(true, '오늘의 출장 상세를 삭제하였습니다.', '');
    }
    //실패
    else {
      resModel = helper.createResponseModel(false, '오늘의 출장 상세 삭제에 실패하였습니다.', '');
    }

    return res.status(200).json(resModel);
  }
  catch (err) {
    return res.status(500).json(err);
  }
};

//오늘의 출장 상세 이미지 삭제(POST)
exports.deleteTripDetailImages = async (req, res, next) => {
  let resModel;
  const tripDetailImageGuid = helper.changeUndefiendToNull(req.body.tripDetailImageGuid);
  const tripDetailGuid = helper.changeUndefiendToNull(req.body.tripDetailGuid);
  const userGuid = helper.getsessionValueOrRequsetValue(req.session.userGuid, req.body.userGuid);

  try {
    //오늘의 출장 삭제
    let retVal = await tripService.deleteTripDetailImages(tripDetailImageGuid, tripDetailGuid, userGuid);

    //삭제
    if (retVal == 1) {
      resModel = helper.createResponseModel(true, '오늘의 출장 상세 이미지를 삭제하였습니다.', '');
    }
    //실패
    else {
      resModel = helper.createResponseModel(false, '오늘의 출장 상세 이미지 삭제에 실패하였습니다.', '');
    }

    return res.status(200).json(resModel);
  }
  catch (err) {
    return res.status(500).json(err);
  }
};

//오늘의 출장 상세 이미지 전체 다운로드(POST) - ZIP 파일 만들기(WEB용)
exports.exportTripDetailImage = async (req, res, next) => {
  const tripGuid = helper.changeUndefiendToNull(req.body.tripGuid);
  let userGuid = helper.getsessionValueOrRequsetValue(req.session.userGuid, req.body.userGuid);

  //시스템 관리자인 경우, 전체 조회
  if(req.body.mobieYn == "Y"){
    //regUserGuid = req.body.userGuid;
  } else{
    if(helper.existSessoin(req.session)){
      const authGroupCode = req.session.authGroupCode;
      if(authGroupCode == 'S'){
        regUserGuid = null;
      }
      else{
        regUserGuid = req.session.userGuid;
      }
    }
  }

  try {
    //오늘의 출장 이미지 전체 가져오기
    let resModel = await tripService.getTripDetailListForImageWithTitle(tripGuid, userGuid);

    if(!resModel.success){
      return resModel;
    }
    else{
      let fs = require("fs");
      let zip = new require('node-zip')();
      let isExisted = false;
      let zipFileName = Date.now() + '_' + resModel.value.TTL + '.zip';
      let tripDetailImages = resModel.value.tripDetailImages;

      //파일 존재 확인 후 Zip파일 제작
      for (var i = 0; i < tripDetailImages.length; i++) {      
        var filePath = path.join(process.cwd(), tripDetailImages[i].FILE_PATH);
        var fileName = tripDetailImages[i].FILE_NM;
        if(fs.existsSync(filePath)){ // 파일이 존재한다면 true 그렇지 않은 경우 false 반환  
          isExisted = true;
          zip.file(fileName, fs.readFileSync(filePath));
        }
      }

      if(isExisted){
        //파일 존재
        var data = zip.generate({base64:false, compression:'DEFLATE'});
        var folderPath = path.join(process.cwd(), `/uploads/business/trip/`);
        var filePath = path.join(folderPath, zipFileName);
        var urlPath = path.join(`/business/trip/`, encodeURI(zipFileName));
        fs.writeFileSync(filePath, data, 'binary');

        var returnData = new Object();
        returnData.URL = urlPath;
        resModel = helper.createResponseModel(true, '오늘의 출장에 등록된 이미지를 전체 다운로드 하였습니다.', returnData);
      }
      else{
        //이미지 파일 존재 하지 않음
        resModel = helper.createResponseModel(false, '오늘의 출장에 등록된 이미지가 존재하지 않습니다.', '');
      }
    }    

    return res.status(200).json(resModel);
  }
  catch (err) {
    return res.status(500).json(err);
  }
};

//주소 찾기 화면(GET)
exports.findAddress = async (req, res, next) => {
  let tripDetailGuid = helper.changeUndefiendToNull(req.query.tripDetailGuid);
  let hasParentModalYN = helper.changeUndefiendToNull(req.query.hasParentModalYN); //모달폼(상세 등록,수정창)에서 들어온 경우(Y), 바로 주소변경해야하는 경우(N)
  let address = helper.changeUndefiendToNull(req.query.address);
  let latitude = helper.changeUndefiendToZero(req.query.latitude);
  let longitude = helper.changeUndefiendToZero(req.query.longitude);

  try {
      //로그인 되지 않은 경우
      if(!(req.session.valid == true)){
          return res.render('error', { title: 'Express', layout: false });
      }
      //현재 로그인 되어 있는 경우    
      else{
          //위도,경도가 존재하는 경우, 주소 가져오기
          if(latitude != 0 && longitude != 0){
            const response = await axios({
              method: "GET",
              url: `https://dapi.kakao.com/v2/local/geo/coord2address.json?y=`+ latitude + '&x=' + longitude,
              headers: {
                Authorization: process.env.KAKAO_FIND_ADDR,
              },
            });

            if(response.data.documents.length > 0 && (address == null && address.trim() == '')){
              address = response.data.documents[0].address.address_name;
            }                
          }
          //주소가 존재하는 경우, 위도/경도 가져오기
          else if(address != null && address.trim() != ''){
            const encodedAddress = encodeURIComponent(address);
            const response = await axios({
              method: "GET",
              url: `https://dapi.kakao.com/v2/local/search/address.json?analyze_type=similar&query=${encodedAddress}`,
              headers: {
                Authorization: process.env.KAKAO_FIND_ADDR,
              },
            });

            if(response.data.documents.length > 0){
              latitude = response.data.documents[0].y;
              longitude = response.data.documents[0].x;
            }       
          }
          else{
            address = '';
            latitude = 0;
            longitude = 0;
          }
          return res.render('business/trip/findAddress', { title: '주소 찾기', layout: false, tripDetailGuid: tripDetailGuid, hasParentModalYN: hasParentModalYN, address: address, latitude: latitude, longitude: longitude });
      }        
  }
  catch (err) {
      return res.render('business/trip/findAddress', { title: '주소 찾기', layout: false, tripDetailGuid: tripDetailGuid, hasParentModalYN: hasParentModalYN, address: address, latitude: latitude, longitude: longitude });
  }
};

//로드맵 화면(GET)
exports.roadMap = async (req, res, next) => {
  let address = helper.changeUndefiendToNull(req.query.address);
  let latitude = 0;
  let longitude = 0;

  try {
      //로그인 되지 않은 경우
      if(!(req.session.valid == true)){
          return res.render('error', { title: 'Express', layout: false });
      }
      //현재 로그인 되어 있는 경우    
      else{
          //주소가 존재하는 경우, 위도/경도 가져오기
          if(address != null){
            const encodedAddress = encodeURIComponent(address);
            const response = await axios({
              method: "GET",
              url: `https://dapi.kakao.com/v2/local/search/address.json?analyze_type=similar&query=${encodedAddress}`,
              headers: {
                Authorization: process.env.KAKAO_FIND_ADDR,
              },
            });

            if(response.data.documents.length > 0){
              latitude = response.data.documents[0].y;
              longitude = response.data.documents[0].x;
            }       
          }
          return res.render('business/trip/roadMap', { title: '로드맵', layout: false, address: address, latitude: latitude, longitude: longitude });
      }        
  }
  catch (err) {
      return res.render('business/trip/roadMap', { title: '로드맵', layout: false, address: address, latitude: latitude, longitude: longitude });
  }
};

//위도,경도 -> 주소 변환
exports.getAddressByCoordinate = async (req, res, next) => {
  let resModel;
  let latitude = helper.changeUndefiendToZero(req.body.latitude);
  let longitude = helper.changeUndefiendToZero(req.body.longitude);

  try {        
      const response = await axios({
        method: "GET",
        url: `https://dapi.kakao.com/v2/local/geo/coord2address.json?y=`+ latitude + '&x=' + longitude,
        headers: {
          Authorization: process.env.KAKAO_FIND_ADDR,
        },
      });

      var returnData = new Object();

      if(response.data.documents.length > 0){
        if(response.data.documents[0].road_address == null){
            returnData.address = response.data.documents[0].address.address_name;
        }
        //신주소
        else{            
            returnData.address = response.data.documents[0].road_address.address_name;
            
        }
        resModel = helper.createResponseModel(true, '주소가 정상 조회되었습니다.', returnData);
      }
      else{
        resModel = helper.createResponseModel(false, '주소 조회에 실패하였습니다.', '');
      }

      return res.status(200).json(resModel);                      
  }
  catch (err) {
      return res.status(500).json(err);
  }
};

//주소,위도,경도 수정
exports.setAddressAndCoordinate = async (req, res, next) => {
  let resModel;
  const tripDetailGuid = helper.changeUndefiendToNull(req.body.tripDetailGuid);
  const address = helper.changeUndefiendToNull(req.body.address);
  const latitude = helper.changeUndefiendToZero(req.body.latitude);
  const longitude = helper.changeUndefiendToZero(req.body.longitude);
  const userGuid = helper.getsessionValueOrRequsetValue(req.session.userGuid, req.body.userGuid);

  try {        

      let retVal = await tripService.setTripDetail(tripDetailGuid, null, null, address, '', latitude, longitude, null, 0, null, userGuid);

      //등록(1),수정(0)
      if (retVal == 0 || retVal == 1) {
        resModel = helper.createResponseModel(true, '주소,위도,경도가 갱신되었습니다.', '');
      }
      //실패
      else {
        resModel = helper.createResponseModel(false, '주소,위도,경도가 갱신에 실패하였습니다.', '');
      }

      return res.status(200).json(resModel);                      
  }
  catch (err) {
      return res.status(500).json(err);
  }
};

//주소 -> 위도,경도 변환
exports.getCoordinateByAddress = async (req, res, next) => {
  let resModel;
  const tripDetailGuid = helper.changeUndefiendToNull(req.body.tripDetailGuid);
  let address = helper.changeUndefiendToNull(req.body.address);
  let addressDetail = helper.changeUndefiendToEmpty(req.body.addressDetail);
  let zoneCode = helper.changeUndefiendToEmpty(req.body.zoneCode);
  let latitude = helper.changeUndefiendToZero(req.body.latitude);
  let longitude = helper.changeUndefiendToZero(req.body.longitude);
  let response;

  try {        
    //위도,경도가 존재하는 경우, 주소 가져오기
    if(latitude != 0 && longitude != 0){
      response = await axios({
        method: "GET",
        url: `https://dapi.kakao.com/v2/local/geo/coord2address.json?y=`+ latitude + '&x=' + longitude,
        headers: {
          Authorization: process.env.KAKAO_FIND_ADDR,
        },
      });

      if(response.data.documents.length > 0 && (address == null && address.trim() == '')){
        address = response.data.documents[0].address.address_name;
      }                
    }
    //주소가 존재하는 경우, 위도/경도 가져오기
    else if(address != null && address.trim() != ''){
      const encodedAddress = encodeURIComponent(address);
      response = await axios({
        method: "GET",
        url: `https://dapi.kakao.com/v2/local/search/address.json?analyze_type=similar&query=${encodedAddress}`,
        headers: {
          Authorization: process.env.KAKAO_FIND_ADDR,
        },
      });

      if(response.data.documents.length > 0){
        latitude = response.data.documents[0].y;
        longitude = response.data.documents[0].x;
      }        
    }    
      
    var returnData = new Object();
    if(response.data.documents.length > 0){
      returnData.address = address;
      returnData.addressDetail = addressDetail;
      returnData.latitude = latitude;
      returnData.longitude = longitude;

      resModel = helper.createResponseModel(true, '주소와 위도,경도가 조회되었습니다.', returnData);
    }       
    else{
      resModel = helper.createResponseModel(false, '주소와 위도,경도 조회에 실패하였습니다.', '');
    }

    return res.status(200).json(resModel);                      
  }
  catch (err) {
      return res.status(500).json(err);
  }
};

//주소 -> 위도,경도 변환 바로 상세 테이블에 적용
exports.setCoordinateByAddress = async (req, res, next) => {
  let resModel;
  const tripDetailGuid = helper.changeUndefiendToNull(req.body.tripDetailGuid);
  let address = helper.changeUndefiendToNull(req.body.address);
  let addressDetail = helper.changeUndefiendToEmpty(req.body.addressDetail);
  const zoneCode = helper.changeUndefiendToEmpty(req.body.zoneCode);
  const userGuid = helper.getsessionValueOrRequsetValue(req.session.userGuid, req.body.userGuid);
  let latitude = 0;
  let longitude = 0;

  try {        
      const encodedAddress = encodeURIComponent(address);      
      const response = await axios({
          method: "GET",
          url: `https://dapi.kakao.com/v2/local/search/address.json?analyze_type=similar&query=${encodedAddress}`,
          headers: {
            Authorization: process.env.KAKAO_FIND_ADDR,
          },
        });

      var returnData = new Object();
      if(response.data.documents.length > 0){
        latitude = response.data.documents[0].y;
        longitude = response.data.documents[0].x;

        returnData.address = address;
        returnData.addressDetail = addressDetail;
        returnData.latitude = latitude;
        returnData.longitude = longitude;
        
        let retVal = await tripService.setTripDetail(tripDetailGuid, null, null, address, addressDetail, latitude, longitude, null, 0, null, userGuid);

        //등록(1),수정(0)
        if (retVal == 0 || retVal == 1) {
          resModel = helper.createResponseModel(true, '주소,위도,경도가 갱신되었습니다.', returnData);
        }
        //실패
        else {
          resModel = helper.createResponseModel(false, '주소,위도,경도가 갱신에 실패하였습니다.', returnData);
        }
      }
      else{
          resModel = helper.createResponseModel(false, '주소와 위도,경도 조회에 실패하였습니다.', '');
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

//오늘의 출장 위도 경도 없는 주소 CRON 으로 위도,경도 가져오기
exports.setNewAddress = async () => {
  console.log("## setNewAddress");
  let resModel;

  const address = "원종동 283-17";
    try {        
        console.log(address);
        const encodedAddress = encodeURIComponent(address); // * //
        console.log(encodedAddress);
        
        const response = await axios({
            method: "GET",
            url: `https://dapi.kakao.com/v2/local/search/address.json?analyze_type=similar&query=${encodedAddress}`,
            headers: {
              Authorization: `KakaoAK 7a4bd3c4549c64dcaa5835db39f72108`,
            },
          });
          

        console.log(response.data.documents); // * //
        return res.status(200).json("");                      
    }
    catch (err) {
        resModel = helper.createResponseModel(false, '로그아웃에 실패하였습니다.', err);
        return res.status(500).json(resModel);
    }
};