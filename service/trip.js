const pool = require('../db/pool');
const helper = require('../helper/helper');


//오늘의 출장 조회
exports.getTripList = async (tripGuid, title, regUserGuid) => {
    try {        
        const [rows, fields] = await pool.query('CALL BIZ_TRIP_MST_SELECT(?,?,?,?)', [tripGuid, title, regUserGuid, 'N']);

        if(rows[0].length > 0){
            console.log("오늘의 출장 조회 성공");
            return rows[0];            
        }
        else{
            console.log("오늘의 출장 조회 실패");
            return null;
        }
    } catch (err) {
        console.log(err);
        throw Error(err);
    }
};

//오늘의 출장 등록,수정
exports.setTrip = async (tripGuid, title, startDate, markFacilityNameYn, markAddressYn, markItemYn, markItemName, markColor, userGuid) => {
    let conn = await pool.getConnection();    
    try {        
        let params = [tripGuid, title, startDate, markFacilityNameYn, markAddressYn, markItemYn, markItemName, markColor, userGuid];

        await conn.beginTransaction();
        const res = await pool.query('CALL BIZ_TRIP_MST_CREATE(?,?,?,?,?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);
        await conn.commit();

        if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] == 'C'){
            console.log("오늘의 출장 등록 성공");
            return 1; //등록 성공
        }
        else if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] == 'U'){
            console.log("오늘의 출장 수정 성공");
            return 0; //수정 성공
        }
        else{
            console.log("오늘의 출장 등록 실패");
            return -1; //등록 실패
        }
    } catch (err) {
        conn.rollback();
        console.log(err);
        throw Error(err);
    } finally {
        conn.release();
    }
};

//오늘의 출장 삭제
exports.deleteTrip = async (tripGuid, userGuid) => {
    let conn = await pool.getConnection();    
    try {        
        let params = [tripGuid, userGuid];

        await conn.beginTransaction();
        const res = await pool.query('CALL BIZ_TRIP_MST_UPDATE_YN(?,?,@RET_VAL); select @RET_VAL;', params);
        await conn.commit();

        if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] == 'Y'){
            console.log("오늘의 출장 삭제 성공");
            return 1; //삭제 성공
        }
        else{
            console.log("오늘의 출장 삭제 실패");
            return -1; //삭제 실패
        }
    } catch (err) {
        conn.rollback();
        console.log(err);
        throw Error(err);
    } finally {
        conn.release();
    }
};

//오늘의 출장 상세 조회(개별)
exports.getTripDetail = async (tripDetailGuid, tripGuid) => {
    let tripDetail;
    let tripDetailItems;
    let res;
    let isSuccess = false;

    try {        
        
        res = await pool.query('CALL BIZ_TRIP_DTL_SELECT(?,?)', [tripDetailGuid, 'N']);

        if(res[0][0].length > 0){
            console.log("오늘의 출장 상세 조회 성공");
            tripDetail = res[0][0][0];

            res = await pool.query('CALL BIZ_TRIP_DTL_ITM_SELECT(?,?,?)', [tripDetailGuid, tripGuid, 'N']);

            if(res[0][0].length > 0){
                console.log("오늘의 출장 상세 아이템 조회 성공");
                tripDetailItems = res[0][0];    
                tripDetail.ITMS = tripDetailItems;
                isSuccess = true;
            }
        }
        else{
            console.log("오늘의 출장 상세 조회 실패");
            isSuccess = false;
        }

        if(isSuccess){
            res = await pool.query('CALL BIZ_TRIP_DTL_IMG_SELECT(?,?,?)', [null, tripDetailGuid, 'N']);

            if(res[0][0].length > 0){
                console.log("오늘의 출장 상세 이미지 조회 성공");
                tripDetailImages = res[0][0];    
                tripDetail.IMGS = tripDetailImages;
                isSuccess = true;
            }
        }
        else{
            console.log("오늘의 출장 상세 이미지 조회 실패");
            isSuccess = false;
        }

        if(isSuccess){
            return tripDetail;
        }
        else{
            return null;
        }        

    } catch (err) {
        console.log(err);
        throw Error(err);
    }
};

//오늘의 출장 상세 워터마크 조회(개별)
exports.getTripDetailWaterMark = async (tripDetailGuid) => {
    try {        
        
        const [rows, fields] = await pool.query('CALL BIZ_TRIP_DTL_SELECT_WMK(?,?)', [tripDetailGuid, 'N']);

        if(rows[0].length > 0){
            console.log("오늘의 출장 상세 워터마크 조회 성공");
            return rows[0];            
        }
        else{
            console.log("오늘의 출장 상세 워터마크 조회 실패");
            return null;
        }
    } catch (err) {
        console.log(err);
        throw Error(err);
    }
};

//오늘의 출장 상세 조회(리스트)
exports.getTripDetailList = async (tripDetailGuid, tripGuid, facilityName, address, regUserGuid) => {
  try {        
      const [rows, fields] = await pool.query('CALL BIZ_TRIP_DTL_SELECT_LIST(?,?,?,?,?,?)', [tripDetailGuid, tripGuid, facilityName, address, regUserGuid, 'N']);

      if(rows[0].length > 0){
          console.log("오늘의 출장 상세 조회 성공");
          return rows[0];            
      }
      else{
          console.log("오늘의 출장 상세 조회 실패");
          return null;
      }
  } catch (err) {
      console.log(err);
      throw Error(err);
  }
};

//오늘의 출장 상세 등록,수정
exports.setTripDetail = async (tripDetailGuid, tripGuid, facilityName, address, addressDetail, latitude, longitude, compYn, order, tripDetailItems, userGuid) => {
    tripDetailGuid = (tripDetailGuid == null || tripDetailGuid == '') ? helper.generateUUID() : tripDetailGuid;
    let conn = await pool.getConnection();
    let params;
    let res;
    let returnCode = -1;
    let isSuccess = false;

    try {
        await conn.beginTransaction();

        //오늘의 출장 상세 아이템 삭제
        res = await pool.query('CALL BIZ_TRIP_DTL_ITM_DELETE(?,@RET_VAL); select @RET_VAL;', tripDetailGuid);

        if (res[0][1][0]["@RET_VAL"] == 'D') {
            console.log("오늘의 출장 상세 아이템 삭제 성공");
            isSuccess = true;
        }
        else {
            console.log("오늘의 출장 상세 아이템 삭제 실패");
            isSuccess = false;
        }

        //오늘의 출장 상세 등록,수정
        if (isSuccess == true) {
            params = [tripDetailGuid, tripGuid, facilityName, address, addressDetail, latitude, longitude, compYn, order, userGuid, 'N'];
            res = await pool.query('CALL BIZ_TRIP_DTL_CREATE(?,?,?,?,?,?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);

            if (res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] == 'C') {
                console.log("오늘의 출장 상세 등록 성공");
                isSuccess = true;
                returnCode = 1; //등록 성공          
            }
            else if (res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] == 'U') {
                console.log("오늘의 출장 상세 수정 성공");
                isSuccess = true;
                returnCode = 0; //수정 성공
            }
            else {
                console.log("오늘의 출장 상세 등록 실패");
                isSuccess = false;
                returnCode = -1; //등록 실패
            }
        }

        //오늘의 출장 상세 아이템 등록
        if (isSuccess == true) {
            for (var i = 0; i < tripDetailItems.length; i++) {
                let tripDetailItemGuid = helper.generateUUID();
                let itemName = tripDetailItems[i].itemName;
                let itemValue = tripDetailItems[i].itemValue;
                let order = i + 1;

                params = [tripDetailItemGuid, tripDetailGuid, itemName, itemValue, order, 'N'];
                res = await pool.query('CALL BIZ_TRIP_DTL_ITM_INSERT(?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);

                if (res[0][0].affectedRows >= 1 && res[0][1][0]["@RET_VAL"] == 'I') {
                    if (i == tripDetailItems.length - 1) {
                        console.log("오늘의 출장 상세 아이템 등록 성공");
                        isSuccess = true;
                    }
                }
                else {
                    console.log("오늘의 출장 상세 아이템 등록 실패");
                    isSuccess = false;
                    break;
                }
            }
        }

        if (isSuccess == false) {
            conn.rollback();
            returnCode = -1;
        }
        else {
            await conn.commit();
        }

        return returnCode;
    } catch (err) {
        conn.rollback();
        console.log(err);
        throw Error(err);
    } finally {
        conn.release();
    }
};

//오늘의 출장 상세 등록(이미지)
exports.setTripDetailImage = async (tripDetailGuid, file, userGuid) => {
    let conn = await pool.getConnection();
    let params;
    let res;
    let returnCode = -1;
    let isSuccess = false;
    let fileGuid = null;

    try {
        await conn.beginTransaction();

        //첨부파일이 존재하는 경우 
        if (file != undefined) {
            fileGuid = helper.generateUUID();
            const fileType = 'I';
            const fileName = file.originalname; //Web에서 보는 파일명
            const orgFileName = file.filename; //실제 디스크에 저장되는 파일명
            const filePath = file.path.replace(process.cwd(), '');
            const urlPath = file.path.replace(process.cwd() + '\\uploads', '');

            //첨부파일 등록
            params = [fileGuid, fileType, fileName, orgFileName, filePath, urlPath, userGuid];
            res = await pool.query('CALL CMN_FILE_MST_CREATE(?,?,?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);
            
            if (res[0][0].affectedRows >= 1 && res[0][1][0]["@RET_VAL"] != 'N') {
                console.log("오늘의 출장 상세 이미지 등록 성공");
                isSuccess = true;
                }
            else {
                console.log("오늘의 출장 상세 이미지 등록 실패");
                isSuccess = false;
            }            
        }
        //첨부파일이 없는 경우
        else{
            conn.rollback();
            isSuccess = true;            
            returnCode = 0;
            return returnCode
        }

        //오늘의 출장 상세 이미지 삭제
        if(isSuccess){
            res = await pool.query('CALL BIZ_TRIP_DTL_IMG_DELETE(?,@RET_VAL); select @RET_VAL;', tripDetailGuid);

            if (res[0][1][0]["@RET_VAL"] == 'D') {
                console.log("오늘의 출장 상세 아이템 삭제 성공");
                isSuccess = true;
            }
            else {
                console.log("오늘의 출장 상세 아이템 삭제 실패");
                isSuccess = false;
            }
        }

        //오늘의 출장 상세 이미지 등록
        if(isSuccess){
            let tripDetailImgGuid = helper.generateUUID();
            params = [tripDetailImgGuid, tripDetailGuid, fileGuid, 1, userGuid];
            res = await pool.query('CALL BIZ_TRIP_DTL_IMG_INSERT(?,?,?,?,@RET_VAL); select @RET_VAL;', params);

            if (res[0][1][0]["@RET_VAL"] == 'I') {
                console.log("오늘의 출장 상세 이미지 등록 성공");
            }
            else {
                console.log("오늘의 출장 상세 이미지 등록 실패");
                isSuccess = false;
            }
        }

        if (isSuccess == false) {
            conn.rollback();
            returnCode = -1;
        }
        else {
            await conn.commit();
            returnCode = 1;
        }

        return returnCode;
    } catch (err) {
        conn.rollback();
        console.log(err);
        throw Error(err);
    } finally {
        conn.release();
    }
};

//오늘의 출장 상세 삭제
exports.deleteTripDetail = async (tripDetailGuid, userGuid) => {
  let conn = await pool.getConnection();    
  try {        
      let params = [tripDetailGuid, userGuid];

      await conn.beginTransaction();
      const res = await pool.query('CALL BIZ_TRIP_DTL_UPDATE_YN(?,?,@RET_VAL); select @RET_VAL;', params);
      await conn.commit();

      if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] == 'Y'){
          console.log("오늘의 출장 상세 삭제 성공");
          return 1; //삭제 성공
      }
      else{
          console.log("오늘의 출장 상세 삭제 실패");
          return -1; //삭제 실패
      }
  } catch (err) {
      conn.rollback();
      console.log(err);
      throw Error(err);
  } finally {
      conn.release();
  }
};