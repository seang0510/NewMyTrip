const exceljs = require("exceljs");
const path = require('path');
const helper = require('../helper');

async function getTripData(file, userGuid) {
  //반환 모델
  let resModel = [];

  //파일 읽기
  const fileType = 'A';
  const fileName = file.originalname; //Web에서 보는 파일명
  const orgFileName = file.filename; //실제 디스크에 저장되는 파일명

  if (file == null || file.originalname == null || file.filename == null) {
    return setResponseModel(false, '업로드한 파일이 올바르지 않습니다.', '');
  }

  //고정,가변 컬럼
  const fixedColumns = [ '순번', '항목1', '주소', '상세주소', '위도', '경도' ];
  const variableColumns = [];

  //모두의 출장 Object
  let trip = {
    tripGuid : helper.generateUUID(),
    title : fileName,
    startDate : helper.dateFormat(new Date()),
    markFacilityNameYn: null,
    markAddressYn: null,
    markItemYn: null,
    markItemName: null,
    markColor: null,
    userGuid: userGuid
  };
  let arrTripDetail = [];
  let arrTripDetailItem = [];


  try {
    const workbook = new exceljs.Workbook();
    let folerPath = path.join(__dirname, `../../uploads/business/trip/`);
    const worksheet = await workbook.xlsx.readFile(folerPath + orgFileName);
    var test = "";
    worksheet.eachSheet((sheet) => {
      sheet.eachRow((row, rowNumber) => {

        //상세 레코드
        let tripDetail = {
          tripDetailGuid : helper.generateUUID(),
          tripGuid : trip.tripGuid,
          compYn : 'N',
          order: rowNumber - 1,
          tripDetailItems: [],
          userGuid: userGuid
        };

        row.eachCell((cell, colNumber) => {
          //첫번째 행은 Header이며, 고정 컬럼은 TripDetail의 컬럼이며, 가변 컬럼은 ITM_NM 값이다.
          if (rowNumber == 1) {
            //문자열인 경우 공백 제거
            if(typeof cell.value == 'string'){
              cell.value = cell.toString().replace(/(\s*)/g, "");
            }
            //고정컬럼인 경우
            if (colNumber <= fixedColumns.length) {
              if(cell.value != fixedColumns[colNumber - 1]){
                throw new Error('업로드한 파일이 올바르지 않습니다.');
              }
            }
            //가변컬럼인 경우
            else {
              variableColumns.push(cell.value);
            }
          }
          else {
            //고정 컬럼인 경우
            if(colNumber <= fixedColumns.length){
              switch(colNumber){
                case 1: //순번
                  tripDetail.order = cell.value;
                  break;
                case 2: //항목1
                  tripDetail.facilityName = cell.value;
                  break;
                case 3: //주소
                  tripDetail.address = cell.value;
                  break;
                case 4: //상세주소
                  tripDetail.addressDetail = cell.value;
                  break;
                case 5: //위도
                  tripDetail.latitude = cell.value;
                  break;
                case 6: //경도
                  tripDetail.longitude = cell.value;
                  break;
              }
            }
            else{
              //값이 있는 경우에만 입력
              if(cell.value.trim() != ''){
                //상세 아이템 레코드
                let tripDetailItem = {
                  tripDetailItemGuid : helper.generateUUID(),
                  tripDetailGuid: tripDetail.tripDetailGuid,
                  itemName : variableColumns[colNumber - fixedColumns.length - 1],
                  itemValue : cell.value.trim(),
                  order : colNumber - fixedColumns.length,
                };              

                //배열에 추가
                arrTripDetailItem.push(tripDetailItem);
              }
            }       
          }
        })

        //배열에 추가
        if (rowNumber > 1)
        {
          arrTripDetail.push(tripDetail);        
        }
      })

      //반환모델에 추가
      resModel = setResponseModel(true, '오늘의 출장 일괄등록을 성공하셨습니다.', []);
      resModel.data.trip = trip;
      resModel.data.tripDetails = arrTripDetail;
      resModel.data.tripDetailItems = arrTripDetailItem;      
    })
  } catch (err) {
    console.log(err);
    resModel = setResponseModel(false, err.message, '');
  } finally {
    return resModel;
  }  
};

//return Model 제작
function setResponseModel(isSuccess, message, data){
  let resModel = {
    isSuccess : isSuccess,
    message : message,
    data : data,
  };  

  return resModel;
};

module.exports = {
  getTripData,
};