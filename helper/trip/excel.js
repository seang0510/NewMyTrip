const exceljs = require("exceljs");
const path = require('path');
const helper = require('../helper');
const moment = require('moment-timezone');
const momentMsDate = require('moment-msdate');
const { data } = require("jquery");

//엑셀 업로드
async function getTripDataFromExcel(file, userGuid) {
  //반환 모델
  let resModel = [];

  //파일 읽기
  const fileType = 'A';
  const fileName = file.originalname; //Web에서 보는 파일명
  const orgFileName = file.filename; //실제 디스크에 저장되는 파일명

  console.log("## orgFileName : " + orgFileName );
  if (file == null || file.originalname == null || file.filename == null) {
    return setResponseModel(false, '업로드한 파일이 올바르지 않습니다.', '');
  }

  //고정,가변 컬럼
  const fixedColumns = [ '번호', '명칭', '주소', '상세주소', '위도', '경도' ];
  const variableColumns = [];

  //모두의 출장 Object
  let titleName = decodeURI( path.parse(fileName).name );
  titleName = titleName.replace('+', " ");
  titleName = titleName.replace(/%2B/g, "+");

  let trip = {
    tripGuid : helper.generateUUID(),
    title : titleName,
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
    worksheet.eachSheet((sheet) => {
      sheet.eachRow((row, rowNumber) => {

        let tripDetailGuid = helper.generateUUID();
        let order = 0;
        let facilityName = '';
        let address = '';
        let addressDetail = '';
        let latitude = 0;
        let longitude = 0;

        row.eachCell((cell, colNumber) => {
          //첫번째 행은 Header이며, 고정 컬럼은 TripDetail의 컬럼이며, 가변 컬럼은 ITM_NM 값이다.
          if (rowNumber == 1) {
            //문자열인 경우 공백 제거
            if(typeof cell.value == 'string'){
              cell.value = cell.toString().replace(/(\s*)/g, "");
            }
            //고정컬럼인 경우
            if (colNumber <= fixedColumns.length) {
              /*
              if(cell.value != fixedColumns[colNumber - 1]){
                throw new Error('업로드한 파일이 올바르지 않습니다.');
              }
              */ 
            }
            //가변컬럼인 경우
            else {
              console.log("가변 컬럼 :: " + cell.value);
              variableColumns.push(cell.value);
            }
          }
          else {
            //고정 컬럼인 경우
            if(colNumber <= fixedColumns.length){
              switch(colNumber){
                case 1: //순번
                  order = cell.value;
                  break;
                case 2: //명칭
                  facilityName = cell.value;
                  break;
                case 3: //주소
                  address = cell.value;
                  break;
                case 4: //상세주소
                  addressDetail = cell.value;
                  break;
                case 5: //위도
                  latitude = cell.value;
                  break;
                case 6: //경도
                  longitude = cell.value;
                  break;
              }
            }
            else{
              /*
              //값이 있는 경우에만 입력
              if(cell.value.toString().trim() != ''){
                //상세 아이템 레코드
                let tripDetailItem = [];
                tripDetailItem.push(helper.generateUUID());
                tripDetailItem.push(tripDetailGuid);
                tripDetailItem.push(variableColumns[colNumber - fixedColumns.length - 1]);
                tripDetailItem.push(cell.value.toString().trim());
                tripDetailItem.push(colNumber - fixedColumns.length);

                console.log(tripDetailItem);
                //배열에 추가
                arrTripDetailItem.push(tripDetailItem);
              }
              */
              //상세 아이템 레코드              
              let cellValue = cell.value;
              console.log("cell.value :: " + cell.value);

              //특정 포맷이 존재하는 경우
              if(cell.style.numFmt !== undefined){
                console.log("========== today ==========");

                let momentToOADate = momentMsDate(cell.value).toOADate();
                let dateFormat = cell.style.numFmt.toString().replace('yyyy-mm-dd', 'YYYY-MM-DD');
                cellValue = moment.fromOADate(momentToOADate, 'Asia/Seoul').format(dateFormat);
              }
              
              let tripDetailItem = [];
              tripDetailItem.push(helper.generateUUID());
              tripDetailItem.push(tripDetailGuid);
              tripDetailItem.push(variableColumns[colNumber - fixedColumns.length - 1]);
              tripDetailItem.push(cellValue);
              tripDetailItem.push(colNumber - fixedColumns.length);

              //배열에 추가
              arrTripDetailItem.push(tripDetailItem);
            }       
          }
        })

        //배열에 추가
        if (rowNumber > 1)
        {
          let tripDetail = [];
          tripDetail.push(tripDetailGuid);
          tripDetail.push(trip.tripGuid);
          tripDetail.push(facilityName);
          tripDetail.push(address);
          tripDetail.push(addressDetail);          
          tripDetail.push(new Point(latitude,longitude));
          tripDetail.push('N');
          tripDetail.push(order);
          tripDetail.push(userGuid);
          tripDetail.push(trip.startDate);
          tripDetail.push(userGuid);
          tripDetail.push(trip.startDate);
          arrTripDetail.push(tripDetail);        
        }
      })

      //반환모델에 추가
      resModel = setResponseModel(true, '오늘의 출장 일괄등록을 성공하셨습니다.', []);
      resModel.data.trip = trip;
      resModel.data.tripDetails = arrTripDetail;
      resModel.data.tripDetailItems = arrTripDetailItem;      
      resModel.data.variableColumns = variableColumns;

      console.log("arrTripDetailItem :: " + arrTripDetailItem);


    })
  } catch (err) {
    console.log(err);
    resModel = setResponseModel(false, err.message, '');
  } finally {
    return resModel;
  }  
};

//주소로 위도 경도 가져오기
async function getKaKaoAddress(address) {
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
      console.log("datas : " + JSON.stringify(response.data)); // * //
      return "";                      
  }
  catch (err) {
      return "";
  }

}
//엑셀 다운로드
function excelDownload(menu, data, dataTitle, headers, keys, res) {

  //파일이름에들어갈 오늘날짜를 위해서 데이트선언 ( 중복 방지는 덤 )
  const currentDate = new Date();

  //오늘날짜를 YYYY-MM-DD 로 선언하여 파일이름에 붙이기 위해서.
  const currentDayFormat = currentDate.getFullYear() + "-" + (currentDate.getMonth() + 1) + "-" + currentDate.getDate();

  //exceljs 를써서 새로운 엑셀객체 생성
  const workbook = new exceljs.Workbook();

  //해당객체의 시트를 생성하면서 이름을 정해준다.
  const worksheet = workbook.addWorksheet(menu);

  //엑셀 헤더부분에 들어갈 첫줄데이터, 구분자로 되어있기때문에 받아서 다시 배열로 셋팅하는것.
  headers = headers.split(',');
  //데이터를 넣을때 헤더부분에 셋팅하게위해 키값을 선언하여 addrow 데이터의 json key값과 동일하게 선언해주면된다.
  keys = keys.split(',');

  //시트의 첫 헤더를 정해줄 데이터를 담을 json데이터
  const columnsHeader = {
    headerData: []
  };

  //위에서 ,구분자로 짤라서 담아놓은 배열의 사이즈만큼 반복하여 헤더데이터에 셋팅 셋팅값은 {header : --, key: -- 두가지는 필수값}
  for (var i = 0; i < headers.length; i++) {
    columnsHeader.headerData[i] = { header: headers[i], key: keys[i] };
  }

  //포문을 통해서 직접 셋팅하게되면 write 할시에 에러를 뱉어내기때문에 다른객체에 담아서 넣어줍니다.
  worksheet.columns = columnsHeader.headerData;

  //row데이터 바인딩
  for (var i = 0; i < data.length; i++) {
    worksheet.addRow(data[i]);
  }

  //엑셀시트을 생성하기위해서 헤더셋팅
  let fileName = encodeURI(currentDayFormat + '_'+dataTitle + '_TripData'); //한글 UTF-8 방법이 없는 것 같음
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader("Content-Disposition", "attachment; filename=" + fileName + ".xlsx");//menu와 파일명을 동일하게 취급하여 파일명 = 메뉴+오늘날짜.xlsx 로 셋팅
  //실제로 workbook을 만들고 파일로 다운로드 할수있게 만들어주는함수
  workbook.xlsx.write(res)
    .then(function (data) {
      res.end();
      console.log('엑셀 다운로드중...');
      
    });
};


//엑셀 다운로드
function excelMobileDownload(menu, data, dataTitle, headers, keys, res) {
  let resModel;

  //파일이름에들어갈 오늘날짜를 위해서 데이트선언 ( 중복 방지는 덤 )
  const currentDate = new Date();

  //오늘날짜를 YYYY-MM-DD 로 선언하여 파일이름에 붙이기 위해서.
  const currentDayFormat = currentDate.getFullYear() + "-" + (currentDate.getMonth() + 1) + "-" + currentDate.getDate();

  //exceljs 를써서 새로운 엑셀객체 생성
  const workbook = new exceljs.Workbook();

  //해당객체의 시트를 생성하면서 이름을 정해준다.
  const worksheet = workbook.addWorksheet(menu);

  //엑셀 헤더부분에 들어갈 첫줄데이터, 구분자로 되어있기때문에 받아서 다시 배열로 셋팅하는것.
  headers = headers.split(',');
  //데이터를 넣을때 헤더부분에 셋팅하게위해 키값을 선언하여 addrow 데이터의 json key값과 동일하게 선언해주면된다.
  keys = keys.split(',');

  //시트의 첫 헤더를 정해줄 데이터를 담을 json데이터
  const columnsHeader = {
    headerData: []
  };

  //위에서 ,구분자로 짤라서 담아놓은 배열의 사이즈만큼 반복하여 헤더데이터에 셋팅 셋팅값은 {header : --, key: -- 두가지는 필수값}
  for (var i = 0; i < headers.length; i++) {
    columnsHeader.headerData[i] = { header: headers[i], key: keys[i] };
  }

  //포문을 통해서 직접 셋팅하게되면 write 할시에 에러를 뱉어내기때문에 다른객체에 담아서 넣어줍니다.
  worksheet.columns = columnsHeader.headerData;

  //row데이터 바인딩
  for (var i = 0; i < data.length; i++) {
    worksheet.addRow(data[i]);
  }
  //let fileName = encodeURI(currentDayFormat + dataTitle + '_TripData'); //한글 UTF-8 방법이 없는 것 같음
  let fileName = currentDayFormat + '_'+dataTitle + '_TripData';

  console.log("시작");
  workbook.xlsx.writeFile("./public/download/"+fileName + ".xlsx");
  console.log(fileName + ".xlsx");

  var returnData = new Object();
  returnData.url = fileName + ".xlsx";
  
  resModel = helper.createResponseModel(true, '엑셀 파일을 다운로드 하였습니다.', returnData);
  return res.status(200).json(resModel);

};


//return Model 제작
function setResponseModel(isSuccess, message, data){
  let resModel = {
    success : isSuccess,
    message : message,
    data : data,
  };  m

  return resModel;
};

//MY-SQL Point 타입 변환
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  toSqlString() {
    return `POINT(${this.x},${this.y})`;
  }
}

module.exports = {
  getTripDataFromExcel,
  excelDownload,
  excelMobileDownload,
};