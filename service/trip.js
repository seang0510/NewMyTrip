const pool = require('../db/pool');
const helper = require('../helper/helper');
const exceljs = require('../helper/trip/excel');
const axios = require('axios');

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

//오늘의 출장 조회 + 오늘의 출장 상세 아이템(POST)
exports.getTripWithItems = async (tripGuid, regUserGuid) => {
    let resModel = [];
    let title = '';
    let tripDetailGuid = '';
    let tripDetailItems = [];
    let res;
    let isSuccess = false;

    try {        
        res = await pool.query('CALL BIZ_TRIP_MST_SELECT_WITH_DTL_ITM(?,?,?)', [tripGuid, regUserGuid, 'N']);

        if(res[0][0].length > 0){
            console.log("오늘의 출장 조회 성공");
            title = res[0][0][0].TTL;
            tripDetailGuid = res[0][0][0].TRIP_DTL_GUID;

            for (var i = 0; i < res[0][0].length; i++) {
                tripDetailItems.push({
                    ITM_NM: res[0][0][i].ITM_NM,
                    DATA_YN: res[0][0][i].DATA_YN,
                });
            }

            isSuccess = true;
        }
        else{
            console.log("오늘의 출장 조회 실패");
            isSuccess = false;
        }

        tripWithItems = {
            TRIP_MST_GUID: tripGuid,
            TRIP_DTL_GUID: tripDetailGuid,
            TTL: title,
            tripDetailItems: tripDetailItems,
        };

        if(isSuccess){            
            resModel = helper.createResponseModel(isSuccess, '오늘의 상세 조회 성공', tripWithItems);
        }
        else {            
            resModel = helper.createResponseModel(isSuccess, '오늘의 상세 조회 실패', tripWithItems);
        }

        return resModel;

    } catch (err) {
        console.log(err);
        throw Error(err);
    }
};

//오늘의 출장 등록,수정
exports.setTrip = async (tripGuid, title, startDate, markFacilityNameYn, markAddressYn, markItemYn, markItemName, markColor, userGuid) => {
    let isNew = (tripGuid == null || tripGuid == '') ? true : false;
    tripGuid = (tripGuid == null || tripGuid == '') ? helper.generateUUID() : tripGuid;
    let res;
    let isSuccess = true;
    let returnCode = -1;
    let conn = await pool.getConnection();    
    try {                

        await conn.beginTransaction();

        //오늘의 출장 등록할 수 있는지 여부 조사
        res = await pool.query('CALL BIZ_TRIP_MST_CREATE_CHECK(?);', userGuid);
        if(res[0][0].length > 0){
            let tripPossibleCreateYN = res[0][0][0].IS_POSSIBLE_CREATE_YN;
            if(isNew == true && tripPossibleCreateYN == 'N'){
                isSuccess = false;
                returnCode = -1;
            }
        }

        if(isSuccess == true){
            let params = [tripGuid, title, startDate, markFacilityNameYn, markAddressYn, markItemYn, markItemName, markColor, userGuid];
            res = await pool.query('CALL BIZ_TRIP_MST_CREATE(?,?,?,?,?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);

            if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] == 'C'){
                console.log("오늘의 출장 등록 성공");
                isSuccess = true;
                returnCode = 1; //등록 성공
            }
            else if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] == 'U'){
                console.log("오늘의 출장 수정 성공");
                isSuccess = true;
                returnCode = 0; //수정 성공
            }
            else{
                console.log("오늘의 출장 등록 실패");
                isSuccess = false;
                returnCode = -1; //등록 실패
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

//오늘의 출장 등록/수정 + 오늘의 출장 상세 아이템(POST)
exports.setTripWithItems = async (tripGuid, title, tripDetailItems, userGuid) => {
    let isNew = (tripGuid == null || tripGuid == '') ? true : false;
    tripGuid = (tripGuid == null || tripGuid == '') ? helper.generateUUID() : tripGuid;
    let tripDetailGuid;    
    let conn = await pool.getConnection();
    let params;
    let res;
    let returnCode = -1;
    let isSuccess = true;
    let nowDay = helper.dayFormat(new Date());

    try {        
        await conn.beginTransaction();

        //오늘의 출장 제한항목 갯수를 넘겼는지 확인
        res = await pool.query('CALL SYS_CMN_COD_DTL_SELECT(?,?,?)', ['', 'TRIP_LIMIT_CNT', 'N']);
        if(res[0][0].length > 0){
            let tripDetailItemMaxCount = Number(res[0][0].find(x => x.DTL_COD == 'COLUMN_CNT').REMARK);
            if(tripDetailItems != null && tripDetailItems.length > tripDetailItemMaxCount){
                isSuccess = false;
                returnCode = -1;                
            }
        }

        //오늘의 출장 등록할 수 있는지 여부 조사
        res = await pool.query('CALL BIZ_TRIP_MST_CREATE_CHECK(?);', userGuid);
        if(res[0][0].length > 0){
            let tripPossibleCreateYN = res[0][0][0].IS_POSSIBLE_CREATE_YN;
            if(isNew == true && tripPossibleCreateYN == 'N'){
                isSuccess = false;
                returnCode = -1;
            }
        }

        //오늘의 출장 등록
        if(isSuccess == true){            
            params = [tripGuid, title, nowDay, null, null, null, null, null, userGuid];
            res = await pool.query('CALL BIZ_TRIP_MST_CREATE(?,?,?,?,?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);

            if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] == 'C'){
                console.log("오늘의 출장 등록 성공");
                isSuccess = true;
                returnCode = 1; //등록 성공
            }
            else if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] == 'U'){
                console.log("오늘의 출장 수정 성공");
                isSuccess = true;
                returnCode = 0; //수정 성공
            }
            else{
                console.log("오늘의 출장 등록 실패");
                isSuccess = false;
                returnCode = -1; //등록 실패
            }
        }

        //오늘의 출장 상세 등록,수정
        if (isSuccess == true) {
            res = await pool.query("SELECT TRIP_DTL_GUID FROM BIZ_TRIP_DTL WHERE DEL_YN='N' AND ODR = 0 AND TRIP_MST_GUID = ?", tripGuid);

            if(res[0].length > 0){
                tripDetailGuid = res[0][0].TRIP_DTL_GUID;    
            }
            else{
                tripDetailGuid = helper.generateUUID();
            }

            params = [tripDetailGuid, tripGuid, '기본', null, null, 0, 0, 'N', -1, userGuid, 'N'];
            console.log(params);
            res = await pool.query('CALL BIZ_TRIP_DTL_CREATE(?,?,?,?,?,?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);

            if (res[0][1][0]["@RET_VAL"] == 'C') {
                console.log("오늘의 출장 상세 등록 성공");
                isSuccess = true;    
            }
            else if (res[0][1][0]["@RET_VAL"] == 'U') {
                console.log("오늘의 출장 상세 수정 성공");
                isSuccess = true;
            }
            else {
                console.log("오늘의 출장 상세 등록 실패");
                isSuccess = false;
                returnCode = -1; //등록 실패
            }
        }

        //오늘의 출장 상세 아이템 삭제
        if(isSuccess == true && tripDetailItems != null && tripDetailItems.length > 0){
            res = await pool.query('CALL BIZ_TRIP_DTL_ITM_DELETE(?,@RET_VAL); select @RET_VAL;', tripDetailGuid);

            if (res[0][1][0]["@RET_VAL"] == 'D') {
                console.log("오늘의 출장 상세 아이템 삭제 성공");
                isSuccess = true;
            }
            else {
                console.log("오늘의 출장 상세 아이템 삭제 실패");
                isSuccess = false;
            }
        }

        //오늘의 출장 상세 아이템 등록
        if (isSuccess == true && tripDetailItems != null && tripDetailItems.length > 0) {            
            for (var i = 0; i < tripDetailItems.length; i++) {
                let tripDetailItemGuid = helper.generateUUID();
                let itemName = tripDetailItems[i].itemName;
                let itemValue = tripDetailItems[i].itemValue;

                params = [tripDetailItemGuid, tripDetailGuid, itemName, itemValue, 'N'];
                res = await pool.query('CALL BIZ_TRIP_DTL_ITM_INSERT(?,?,?,?,@RET_VAL); select @RET_VAL;', params);

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

//오늘의 출장 일괄등록
exports.importTrip = async (file, userGuid) => {

    //엑셀 파일 읽기
    let resModel = await exceljs.getTripDataFromExcel(file, userGuid);
    if(resModel.success == false){
        return resModel;
    }

    //DB 업로드
    let params;
    let isSuccess = false;
    let message = '';
    let sql = '';
    let tripDetailGuidForOrderZero;
    let conn = await pool.getConnection();    
    
    try {
        await conn.beginTransaction();

        let recordCount = 0;
        let columnCount = 0;
    
        params = [null, 'TRIP_LIMIT_CNT', "N"];
        res = await pool.query('CALL SYS_CMN_COD_DTL_SELECT(?,?,?); select @RET_VAL;', params);        

        if(res[0][0].length > 0){
            console.log("공통코드 조회 성공");
            recordCount = res[0][0].find(x => x.DTL_COD == 'RECORD_CNT').REMARK;
            columnCount = res[0][0].find(x => x.DTL_COD == 'COLUMN_CNT').REMARK;
            isSuccess = true;
        }
        else{
            console.log("공통코드 조회 실패");
            isSuccess = false;
            resModel.success = isSuccess;
            resModel.message = '레코드 갯수, 컬럼 갯수 공통코드가 등록되지 않았습니다.';     
        }

        if(isSuccess == true){
            //레코드가 100개가 넘는 경우
            if(resModel.data.tripDetails.length > recordCount){
                isSuccess = false;
                resModel.success = isSuccess;
                resModel.message = '등록 가능한 레코드 최대 갯수는 ' + recordCount + '개 입니다.';
            }
            //가변컬럼이 50개가 넘는 경우
            else if(resModel.data.tripDetails.length > 0 && resModel.data.tripDetailItems.length / resModel.data.tripDetails.length > columnCount){
                isSuccess = false;
                resModel.success = isSuccess;
                resModel.message = '등록 가능한 컬럼 최대 갯수는 ' + columnCount + '개 입니다.';            
            }
        }

        //출장 등록이 더 가능한지 확인
        if(isSuccess == true){
            let isPossibleCreateYN = 10;
            let maxCount = 10;
            params = [userGuid];
            res = await pool.query('CALL BIZ_TRIP_MST_CREATE_CHECK(?);', params);

            if(res[0][0].length > 0){
                console.log("출장 추가 가능");
                isPossibleCreateYN = res[0][0][0].IS_POSSIBLE_CREATE_YN;
                maxCount = res[0][0][0].TRIP_MAX_CNT;

                //등록된 출장이 최대 카운트를 넘긴 경우
                if(isPossibleCreateYN == 'N'){
                    isSuccess = false;
                    resModel.success = isSuccess;
                    resModel.message = '오늘의 출장은 최대 ' + maxCount + '개까지 등록할 수 있습니다.'; 
                }
            }
            else{
                console.log("출장 추가 불가능");
                isSuccess = false;
                resModel.success = isSuccess;
                resModel.message = '오늘의 출장은 최대 10개까지 등록할 수 있습니다.';     
            }            
        }

        //오늘의 출장 등록
        if(isSuccess == true){
            const trip = resModel.data.trip;
            params = [trip.tripGuid, trip.title, trip.startDate, null, "Y", null, null, null, userGuid];        
            res = await pool.query('CALL BIZ_TRIP_MST_CREATE(?,?,?,?,?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);
            if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] != 'N'){
                console.log("오늘의 출장 등록 성공하였습니다.");
                isSuccess = true;
            }
            else{
                message = "오늘의 출장 등록에 실패하였습니다.";
                console.log(message);
                isSuccess = false;
                resModel.success = isSuccess;
                resModel.message = message;
            }
        }

        //오늘의 출장 상세 등록(ODR=0)
        if (isSuccess == true) {
            let tripGuid = resModel.data.trip.tripGuid;
            tripDetailGuidForOrderZero = helper.generateUUID();

            params = [tripDetailGuidForOrderZero, tripGuid, '기본', null, null, 0, 0, 'N', -1, userGuid, 'N'];
            res = await pool.query('CALL BIZ_TRIP_DTL_CREATE(?,?,?,?,?,?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);

            if (res[0][1][0]["@RET_VAL"] == 'C') {
                console.log("오늘의 출장 상세 등록 성공");
                isSuccess = true;    
            }
            else {
                console.log("오늘의 출장 상세 등록 실패");
                isSuccess = false;
                resModel.success = isSuccess;
                resModel.message = message;
            }
        }

        //오늘의 출장 상세 등록        
        if (isSuccess == true && resModel.data.tripDetails != null && resModel.data.tripDetails.length > 0) {      
            //BULK Insert
            const tripDetails = resModel.data.tripDetails;
            
            for await (let tempData of tripDetails) {
                var latitude;
                var longitude;
                console.log(tempData);
                console.log("xxxx :: "+ tempData[5].x);
                console.log("address :: "+ tempData[3]);
                if(tempData[3] == null || tempData[3] == ""){
                    console.log("#### kakako 위경도로 주소 찾기 : " + tempData[5].x + "/" + tempData[5].y);
                    const response = await axios({
                        method: "GET",
                        url: `https://dapi.kakao.com/v2/local/geo/coord2address.json?y=`+ tempData[5].x + '&x=' + tempData[5].y,
                        headers: {
                        Authorization: `KakaoAK 7a4bd3c4549c64dcaa5835db39f72108`,
                        },
                    });

                    try {       
                        console.log("## response :: " + JSON.stringify(response.data)); 
                        if(response.data.documents[0].address.address_name === undefined){
                            
                        }else{
                            console.log("## address_name :: " + response.data.documents[0].address.address_name); 
                            tempData[3] = response.data.documents[0].address.address_name;
                        }
                    }
                    catch (err) {
                        console.log("## err :: " + err.stack); 
                        latitude = 0;
                        longitude = 0;
                    } 
                }
                else if(tempData[5].x == 0){
                    console.log("#### kakako 주소로 위도 찾기 : " + tempData[3]);
                    
                    const encodedAddress = encodeURIComponent(tempData[3]);
                    //const encodedAddress = encodeURIComponent("원종동 283-17");
                    
                    const response = await axios({
                        method: "GET",
                        url: `https://dapi.kakao.com/v2/local/search/address.json?analyze_type=similar&query=${encodedAddress}`,
                        headers: {
                        Authorization: `KakaoAK 7a4bd3c4549c64dcaa5835db39f72108`,
                        },
                    });

                    try {        
                        if(response.data.documents[0].address.y === undefined){
                            tempData[5].x = 0;
                            tempData[5].y = 0;
                            latitude = 0;
                            longitude = 0;
                        }else{
                            console.log("data ::: " + response.data.documents[0].address.x);
                            //tempData[5].x = new Point(response.data.documents[0].address.y,response.data.documents[0].address.x);
                            tempData[5].x = response.data.documents[0].address.y;
                            tempData[5].y = response.data.documents[0].address.x;
                            //tempData[5].x = 0;
                            //tempData[5].y = 0;
                        }
                        console.log("위도경도 가져오기 완료2::" + response.data.documents[0].address.x);                 
                    }
                    catch (err) {
                        console.log("## err :: " + err.stack); 
                        latitude = 0;
                        longitude = 0;
                    }            
                }
                //console.log('모든 api 통신 완료' + latitude + "/"  +longitude);
            }


            console.log("### tripDetails::" + JSON.stringify(tripDetails));  
            console.log("### tripDetails1::" + tripDetails[0][5].x);  
            sql = 'INSERT INTO BIZ_TRIP_DTL (TRIP_DTL_GUID, TRIP_MST_GUID, FCLT_NM, ADDR, ADDR_DTL, LOC_POS, COMP_YN, ODR, REG_USER_GUID, REG_DT, UPDT_USER_GUID, UPDT_DT) VALUES ?';
            res = await pool.query(sql, [tripDetails]);

            if(res[0].affectedRows >= 1){
                console.log("오늘의 출장 상세 등록 총 " + res[0].affectedRows + "개 성공하였습니다.");
                isSuccess = true;          
            }
            else{
                message = "오늘의 출장 상세 등록 실패하였습니다.";
                console.log(message);
                isSuccess = false;
                resModel.success = isSuccess;
                resModel.message = message;
            }        
        }

        //오늘의 출장 상세 아이템 등록(ODR=0)
        if(isSuccess && resModel.data.variableColumns.length > 0){
            const variableColumns = resModel.data.variableColumns;
            for (var i = 0; i < variableColumns.length; i++) {
                let tripDetailItemGuid = helper.generateUUID();
                let itemName = variableColumns[i];
                let itemValue = '';

                params = [tripDetailItemGuid, tripDetailGuidForOrderZero, itemName, itemValue, 'N'];
                res = await pool.query('CALL BIZ_TRIP_DTL_ITM_INSERT(?,?,?,?,@RET_VAL); select @RET_VAL;', params);

                if (res[0][0].affectedRows >= 1 && res[0][1][0]["@RET_VAL"] == 'I') {
                    if (i == variableColumns.length - 1) {
                        console.log("오늘의 출장 상세 아이템 등록 성공");
                        isSuccess = true;
                    }
                }
                else {
                    console.log("오늘의 출장 상세 아이템 등록 실패");
                    isSuccess = false;
                    resModel.success = isSuccess;
                    resModel.message = message;
                    break;
                }
            }
        }

        // //오늘의 출장 상세 아이템 등록        
        if (isSuccess == true && resModel.data.tripDetails != null && resModel.data.tripDetailItems.length > 0) {
            const tripDetailItems = resModel.data.tripDetailItems;
            sql = 'INSERT INTO BIZ_TRIP_DTL_ITM (TRIP_DTL_ITM_GUID, TRIP_DTL_GUID, ITM_NM, ITM_VAL, ODR) VALUES ?';
            res = await pool.query(sql, [tripDetailItems]);
            console.log("tripDetailItems :: " + tripDetailItems);

            if(res[0].affectedRows >= 1){
                console.log("오늘의 출장 상세 아이템 등록 총 " + res[0].affectedRows + "개 성공하였습니다.");
                isSuccess = true;          
            }
            else{
                message = "오늘의 출장 상세 아이템 등록 실패하였습니다.";
                console.log(message);
                isSuccess = false;
                resModel.success = isSuccess;
                resModel.message = message;
            }            
        }

        if (isSuccess == false) {
            conn.rollback();             
        }
        else {
            await conn.commit();
            resModel.success = true;
            resModel.message = "업로드 완료!!!!";            
        }        
        
    } catch (err) {
        conn.rollback();
        console.log(err);
        resModel.success = false;
        resModel.message = err;
        throw Error(err);
    } finally {
        conn.release();
        console.log("업로드 완료!!!!");
        return resModel;
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

//오늘의 출장 삭제(리스트)
exports.deleteTripList = async (tripGuidList, userGuid) => {
    let conn = await pool.getConnection();    
    let params;
    let res;
    let returnCode = -1;
    let isSuccess = false;

    try {        

        await conn.beginTransaction();

        for (var i = 0; i < tripGuidList.length; i++) {
            tripGuid = tripGuidList[i];
            params = [tripGuid, userGuid];
            
            res = await pool.query('CALL BIZ_TRIP_MST_UPDATE_YN(?,?,@RET_VAL); select @RET_VAL;', params);

            if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] == 'Y'){
                if (i == tripGuidList.length - 1) {
                    console.log("오늘의 출장 삭제 성공");
                    isSuccess = true;
                }
            }
            else{
                console.log("오늘의 출장 삭제 실패");
                isSuccess = false;
                break;
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
            isSuccess = true;
        }
        else{
            console.log("오늘의 출장 상세 조회 실패");
            isSuccess = false;
        }

        if(isSuccess){
            res = await pool.query('CALL BIZ_TRIP_DTL_ITM_SELECT(?,?,?)', [tripDetailGuid, tripGuid, 'N']);

            if(res[0][0].length > 0){
                console.log("오늘의 출장 상세 아이템 조회 성공");
                tripDetailItems = res[0][0];    
                tripDetail.ITMS = tripDetailItems;
                isSuccess = true;
            }
            else{
                console.log("오늘의 출장 상세 조회 실패");
                tripDetailItems = null;    
                tripDetail.ITMS = tripDetailItems;
            }
        }

        if(isSuccess){
            res = await pool.query('CALL BIZ_TRIP_DTL_IMG_SELECT(?,?,?)', [null, tripDetailGuid, 'N']);

            if(res[0][0].length > 0){
                console.log("오늘의 출장 상세 이미지 조회 성공");
                tripDetailImages = res[0][0];    
                tripDetail.IMGS = tripDetailImages;
                isSuccess = true;
            }
            else{
                tripDetailImages = "";    
                tripDetail.IMGS = tripDetailImages;
            }
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
exports.getTripDetailWaterMark = async (tripGuid) => {
    console.log("tripGuid :: "  + tripGuid);
    try {        
        var queryString = "SELECT tripMst.TRIP_MST_GUID , tripMst.WMK_FCLT_NM_YN";
		queryString += ", tripMst.WMK_ADDR_YN";
		queryString += ", tripMst.WMK_ITM_YN";
		queryString += ", tripMst.WMK_ITM_NM";
		queryString += ", tripMst.WMK_COLOR";
		queryString += " FROM BIZ_TRIP_MST tripMst";
		queryString += " WHERE tripMst.DEL_YN = 'N'";
        queryString += " AND tripMst.TRIP_MST_GUID = '" + tripGuid + "'";
        console.log("queryString :: "  + queryString);

        const [rows, fields] = await pool.query(queryString, []);
        console.log(rows);
        if(rows.length > 0){
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
          return [rows, fields];         
      }
      else{
          console.log("오늘의 출장 상세 조회 실패");
          return [rows, fields];
      }
  } catch (err) {
      console.log(err);
      throw Error(err);
  }
}; 

//오늘의 출장 상세 아이템 조회(개별)
exports.getItem = async (tripGuid) => {
    
    try {        
        const [rows, fields] = await pool.query('SELECT ITM_NM, ITM_VAL, ODR FROM BIZ_TRIP_DTL_ITM WHERE TRIP_DTL_GUID = (SELECT TRIP_DTL_GUID FROM BIZ_TRIP_DTL WHERE TRIP_MST_GUID = ? AND ODR = 0 LIMIT 1) order by ODR ASC', [tripGuid]);
        console.log(rows);
        return rows;

    } catch (err) {
        console.log(err);
        throw Error(err);
    }
    
}; 

//오늘의 출장 상세 조회(리스트):핀 목록
exports.getTripDetailListForPin = async (tripGuid, regUserGuid) => {
    let tripDetailList = [];
    let tripDetailListForIntegrate = [];
    let isSuccess = false;

    try {        
        const [rows, fields] = await pool.query('CALL BIZ_TRIP_DTL_SELECT_LIST_FOR_PIN_MST(?,?,?)', [tripGuid, regUserGuid, 'N']);
  
        if(rows[0].length > 0){
            console.log("오늘의 출장 상세 조회(핀 목록) 성공");
            tripDetailList = rows[0];
            isSuccess = true;
        }
        else{
            console.log("오늘의 출장 상세 조회(핀 목록) 실패");
            tripDetailList = null;
            isSuccess = false;
        }

        //오늘의 출장 상세 조회(핀 목록:상세)
        if(isSuccess){
            const [rows, fields] = await pool.query('CALL BIZ_TRIP_DTL_SELECT_LIST_FOR_PIN_DTL(?,?,?)', [tripGuid, regUserGuid, 'N']);
  
            if(rows[0].length > 0){
                console.log("오늘의 출장 상세 조회(핀 목록:상세) 성공");
                tripDetailListForIntegrate = rows[0];

                for (var i = 0; i < tripDetailListForIntegrate.length; i++) {

                    let parentLatitude = tripDetailListForIntegrate[i].LAT;                    
                    let parentLogitude = tripDetailListForIntegrate[i].LNG;      
                    let index = tripDetailList.findIndex((item) => item.LAT === parentLatitude && item.LNG === parentLogitude);

                    //Null인 경우 Obejct 선언
                    if(tripDetailList[index].TRIP_DTL_LIST == null){
                        tripDetailList[index].TRIP_DTL_LIST = [];
                    }

                    //Detail List에 Detail List 추가(통합)
                    tripDetailList[index].TRIP_DTL_LIST.push(tripDetailListForIntegrate[i]);
                }
            }
            else{
                console.log("오늘의 출장 상세 조회(핀 목록:상세) 실패");
            }        
        }

        return tripDetailList;

    } catch (err) {
        console.log(err);
        throw Error(err);
    }
}; 

//오늘의 출장 상세 조회(리스트):이미지 전체 다운로드
exports.getTripDetailListForImage = async (tripGuid, regUserGuid) => {
    try {        
        const [rows, fields] = await pool.query('CALL BIZ_TRIP_DTL_SELECT_FOR_IMG(?,?,?)', [tripGuid, regUserGuid, 'N']);

        if(rows[0].length > 0){
            console.log("오늘의 출장 상세 조회(이미지 다운로드) 성공");
            return rows[0];            
        }
        else{
            console.log("오늘의 출장 상세 조회(이미지 다운로드) 실패");
            return null;
        }
    } catch (err) {
        console.log(err);
        throw Error(err);
    }
}; 

//오늘의 출장 상세 조회(리스트):이미지 전체 다운로드 + 오늘의 출장 제목 포함
exports.getTripDetailListForImageWithTitle = async (tripGuid, regUserGuid) => {
    let resModel = [];
    let tripWithImages = [];
    let title = '';
    let tripDetailImages = [];
    let res;
    let isSuccess = false;

    try {        
        res = await pool.query('CALL BIZ_TRIP_MST_SELECT(?,?,?,?)', [tripGuid, null, regUserGuid, 'N']);
        
        if(res[0][0].length > 0){
            console.log("오늘의 출장 조회 성공");
            title = res[0][0][0].TTL;
            isSuccess = true;
        }
        else{
            console.log("오늘의 출장 조회 실패");
            isSuccess = false;
        }

        if(isSuccess){
            res = await pool.query('CALL BIZ_TRIP_DTL_SELECT_FOR_IMG(?,?,?)', [tripGuid, regUserGuid, 'N']);

            if(res[0][0].length > 0){
                console.log("오늘의 출장 상세 조회(이미지 다운로드) 성공");
                tripDetailImages = res[0][0];
            }
            else{
                console.log("오늘의 출장 상세 조회(이미지 다운로드) 실패");
            }
        }

        tripWithImages = {
            TTL: title,
            tripDetailImages: tripDetailImages,
        };

        if(isSuccess){            
            resModel = helper.createResponseModel(isSuccess, '오늘의 출장 이미지 다운로드 성공', tripWithImages);
        }
        else {            
            resModel = helper.createResponseModel(isSuccess, '오늘의 출장에 등록된 이미지가 존재하지 않습니다.', tripWithImages);
        }

        return resModel;

    } catch (err) {
        console.log(err);
        throw Error(err);
    }
}; 

//오늘의 출장 상세 내보내기(리스트)
exports.exportTrip = async (tripGuid, regUserGuid) => {
    let resModel = [];
    let isSuccess = false;
    let [rows, fields] = [];

    try {
        //오늘의 출장: Title 가져오기
        [rows, fields] = await pool.query('CALL BIZ_TRIP_MST_SELECT(?,?,?,?)', [tripGuid, null, regUserGuid, 'N']);
        if(rows[0].length > 0){
            console.log("오늘의 출장 조회 성공");
            isSuccess = true;        
            resModel.title = rows[0][0].TTL;
        }
        else{
            console.log("오늘의 출장 조회 실패");
            isSuccess = false;
        }        

        //오늘의 출장 상세: Data 가져오기
        if(isSuccess){            
            [rows, fields] = await pool.query('CALL BIZ_TRIP_DTL_SELECT_LIST(?,?,?,?,?,?)', [null, tripGuid, null, null, regUserGuid, 'N']);
            if (rows[0].length > 0) {
                console.log("오늘의 출장 상세 조회 성공");

                //컬럼 제거
                for await (let obj of rows[0]) {
                    delete obj.TRIP_MST_GUID;
                    //delete obj.TRIP_DTL_GUID;
                    delete obj.COMP_YN;
                    delete obj.IMG_CNT;
                    delete obj.TRIP_DTL_GUID_IN_ITM;
                    delete obj.REG_EMAIL;
                    delete obj.REG_DT;
                    delete obj.UPDT_EMAIL;

                    
                    obj.확인 = obj.COMP_DT;
                    delete obj.UPDT_DT;
                    delete obj.COMP_DT;
                    delete obj.IMGS;

                    //console.log("obj.TRIP_DTL_GUID :: " + obj.TRIP_DTL_GUID);
                    res = await pool.query('CALL BIZ_TRIP_DTL_IMG_SELECT(?,?,?)', [null, obj.TRIP_DTL_GUID, 'N']);

                    if(res[0][0].length > 0){
                        console.log("오늘의 출장 상세 이미지 조회 성공");
                        tripDetailImages = res[0][0];
                        var files = "";
                        for await (let img of tripDetailImages) {
                            //console.log("tripDetailImages : " + JSON.stringify(tripDetailImages));
                            if(files == ""){
                                files = decodeURI( img.FILE_NM );
                            }else{
                                files = files + "," + decodeURI( img.FILE_NM );
                            }
                            
                        }
                        //console.log("files :: " + files);
                        obj.이미지 = files;
                    }
                    else{
                        tripDetailImages = "";    
                        obj.이미지 = tripDetailImages;
                    }
                    delete obj.TRIP_DTL_GUID;
                }
                

                resModel.tripDetails = rows[0];
            }       
            else {
                console.log("오늘의 출장 상세 조회 실패");
            }
        }

        return resModel;

    } catch (err) {
        console.log(err);
        throw Error(err);
    }
}; 

//오늘의 출장 상세 등록,수정
exports.setTripDetail = async (tripDetailGuid, tripGuid, facilityName, address, addressDetail, latitude, longitude, compYn, order, tripDetailItems, userGuid) => {
    let isNew = (tripDetailGuid == null || tripDetailGuid == '') ? true : false;
    order = (tripDetailGuid == null || tripDetailGuid == '') ? 0 : order; //DetailGUID가 없으면 등록
    tripDetailGuid = (tripDetailGuid == null || tripDetailGuid == '') ? helper.generateUUID() : tripDetailGuid;
    compYn = compYn == null ? 'N' : compYn;
    let conn = await pool.getConnection();
    let params;
    let res;
    let returnCode = -1;
    let isSuccess = true;

    try {
        await conn.beginTransaction();

        //오늘의 출장 상세 등록할 수 있는지 여부 조사
        params = [tripGuid, tripDetailGuid];
        res = await pool.query('CALL BIZ_TRIP_DTL_CREATE_CHECK(?,?);', params);
        if(res[0][0].length > 0){
            let tripDetailPossibleCreateYN = res[0][0][0].IS_POSSIBLE_CREATE_YN;
            if(isNew == true && tripDetailPossibleCreateYN == 'N'){
                isSuccess = false;
                returnCode = -1;
            }
        }

        if(isSuccess == true){
            //오늘의 출장 상세 아이템 삭제
            if(tripDetailItems != null && tripDetailItems.length > 0){            
                res = await pool.query('CALL BIZ_TRIP_DTL_ITM_DELETE(?,@RET_VAL); select @RET_VAL;', tripDetailGuid);
                if (res[0][1][0]["@RET_VAL"] == 'D') {
                    console.log("오늘의 출장 상세 아이템 삭제 성공");
                    isSuccess = true;
                }
                else {
                    console.log("오늘의 출장 상세 아이템 삭제 실패");
                    isSuccess = false;
                }
            }
            else{
                isSuccess = true;
            }
        }

        //오늘의 출장 상세 등록,수정
        if (isSuccess == true) {
            params = [tripDetailGuid, tripGuid, facilityName, address, addressDetail, latitude, longitude, compYn, order, userGuid, 'N'];
            console.log(params);
            res = await pool.query('CALL BIZ_TRIP_DTL_CREATE(?,?,?,?,?,?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);

            if (res[0][1][0]["@RET_VAL"] == 'C') {
                console.log("오늘의 출장 상세 등록 성공");
                isSuccess = true;
                returnCode = 1; //등록 성공          
            }
            else if (res[0][1][0]["@RET_VAL"] == 'U') {
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
        if (isSuccess == true && tripDetailItems != null && tripDetailItems.length > 0) {
            for (var i = 0; i < tripDetailItems.length; i++) {
                let tripDetailItemGuid = helper.generateUUID();
                let itemName = tripDetailItems[i].itemName;
                let itemValue = tripDetailItems[i].itemValue;

                params = [tripDetailItemGuid, tripDetailGuid, itemName, itemValue, 'N'];
                res = await pool.query('CALL BIZ_TRIP_DTL_ITM_INSERT(?,?,?,?,@RET_VAL); select @RET_VAL;', params);

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

//오늘의 출장 시작일자 수정
exports.setTripStartDay = async (tripMstGuid , userGuid) => {
    let conn = await pool.getConnection();
    let res;
    let returnCode = -1;
    let isSuccess = false;

    try {
        await conn.beginTransaction();

        //오늘의 출장 상세 아이템 확정
        res = await pool.query("UPDATE BIZ_TRIP_MST SET START_DT = DATE_FORMAT(NOW(), '%Y-%m-%d') WHERE REG_USER_GUID = ? AND TRIP_MST_GUID = ?",[userGuid , tripMstGuid]);

        if (res[0].affectedRows >= 1) {          
            isSuccess = true;
        }
        else {
            isSuccess = false;
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

//오늘의 출장 상세 확정
exports.setTripDetailCompYN = async (tripDetailGuid, compYn, userGuid) => {
    let conn = await pool.getConnection();
    let res;
    let returnCode = -1;
    let isSuccess = false;

    try {
        await conn.beginTransaction();

        //오늘의 출장 상세 아이템 확정
        res = await pool.query("UPDATE BIZ_TRIP_DTL SET COMP_YN = ?, COMP_DT = NOW(), UPDT_USER_GUID = ?, UPDT_DT = NOW() WHERE DEL_YN = 'N' AND TRIP_DTL_GUID = ?",[compYn, userGuid, tripDetailGuid]);

        if (res[0].affectedRows >= 1) {
            if(compYn == 'Y'){
                console.log("오늘의 출장 상세 확정 성공");
            }
            else{
                console.log("오늘의 출장 상세 확정 롤백 성공");
            }
            
            isSuccess = true;
        }
        else {
            if(compYn == 'Y'){
                console.log("오늘의 출장 상세 확정 실패");
            }
            else{
                console.log("오늘의 출장 상세 확정 롤백 실패");
            }
            isSuccess = false;
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

//오늘의 출장 상세 이미지 등록
exports.setTripDetailImages = async (tripDetailGuid, files, userGuid) => {
    let conn = await pool.getConnection();
    let params;
    let res;
    let returnCode = -1;
    let isSuccess = false;
    let arrFileGuid = [];

    try {
        await conn.beginTransaction();

        //첨부파일이 존재하는 경우 
        if (files != undefined) {
            for (var i = 0; i < files.length; i++) {
                let file = files[i];
                let fileGuid = helper.generateUUID();
                arrFileGuid.push(fileGuid);
                const fileType = 'I';
                const fileName = file.originalname; //Web에서 보는 파일명
                const orgFileName = file.filename; //실제 디스크에 저장되는 파일명
                const filePath = file.path.replace(process.cwd(), '');
                const urlPath = '/business/trip/' + orgFileName;

                //첨부파일 등록
                params = [fileGuid, fileType, fileName, orgFileName, filePath, urlPath, userGuid];
                res = await pool.query('CALL CMN_FILE_MST_CREATE(?,?,?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);
                
                if (res[0][0].affectedRows >= 1 && res[0][1][0]["@RET_VAL"] != 'N') {
                    if (i == arrFileGuid.length - 1) {
                        console.log("오늘의 출장 상세 첨부파일 등록 성공");
                        isSuccess = true;
                    }
                }
                else {
                    console.log("오늘의 출장 상세 첨부파일 등록 실패");
                    isSuccess = false;
                    break;
                }     
            }
        }
        //첨부파일이 없는 경우
        else{
            conn.rollback();
            isSuccess = true;            
            returnCode = 0;
            return returnCode
        }

        //오늘의 출장 상세 이미지 등록
        if(isSuccess){
            for (var i = 0; i < arrFileGuid.length; i++) {
                let tripDetailImgGuid = helper.generateUUID();
                let fileGuid = arrFileGuid[i];
                params = [tripDetailImgGuid, tripDetailGuid, fileGuid, 0, userGuid];
                console.log(params);
                res = await pool.query('CALL BIZ_TRIP_DTL_IMG_CREATE(?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);
    
                if (res[0][1][0]["@RET_VAL"] != 'N') {
                    if (i == arrFileGuid.length - 1) {
                        console.log("오늘의 출장 상세 이미지 등록 성공");
                    }
                }
                else {
                    console.log("오늘의 출장 상세 이미지 등록 실패");
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

//오늘의 출장 상세 등록/수정(이미지 포함)
exports.setTripDetailWithImages = async (tripDetailGuid, tripGuid, facilityName, address, addressDetail, latitude, longitude, compYn, order, tripDetailItems, files, userGuid) => {
    order = (tripDetailGuid == null || tripDetailGuid == '') ? 0 : order;
    tripDetailGuid = (tripDetailGuid == null || tripDetailGuid == '') ? helper.generateUUID() : tripDetailGuid;
    let conn = await pool.getConnection();
    let params;
    let res;
    let returnCode = -1;
    let isSuccess = false;
    let arrFileGuid = [];

    try {
        await conn.beginTransaction();

        //오늘의 출장 상세 아이템 삭제
        if(tripDetailItems != null && tripDetailItems.length > 0){
            
            res = await pool.query('CALL BIZ_TRIP_DTL_ITM_DELETE(?,@RET_VAL); select @RET_VAL;', tripDetailGuid);

            if (res[0][1][0]["@RET_VAL"] == 'D') {
                console.log("오늘의 출장 상세 아이템 삭제 성공");
                isSuccess = true;
            }
            else {
                console.log("오늘의 출장 상세 아이템 삭제 실패");
                isSuccess = false;
            }
        }
        else{
            isSuccess = true;
        }

        //오늘의 출장 상세 등록,수정
        if (isSuccess == true) {
            params = [tripDetailGuid, tripGuid, facilityName, address, addressDetail, latitude, longitude, compYn, order, userGuid, 'N'];
            console.log(params);
            res = await pool.query('CALL BIZ_TRIP_DTL_CREATE(?,?,?,?,?,?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);

            if (res[0][1][0]["@RET_VAL"] == 'C') {
                console.log("오늘의 출장 상세 등록 성공");
                isSuccess = true;
                returnCode = 1; //등록 성공          
            }
            else if (res[0][1][0]["@RET_VAL"] == 'U') {
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
        if (isSuccess == true && tripDetailItems != null && tripDetailItems.length > 0) {
            for (var i = 0; i < tripDetailItems.length; i++) {
                let tripDetailItemGuid = helper.generateUUID();
                let itemName = tripDetailItems[i].itemName;
                let itemValue = tripDetailItems[i].itemValue;

                params = [tripDetailItemGuid, tripDetailGuid, itemName, itemValue, 'N'];
                res = await pool.query('CALL BIZ_TRIP_DTL_ITM_INSERT(?,?,?,?,@RET_VAL); select @RET_VAL;', params);

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

        //첨부파일이 존재하는 경우 
        if (isSuccess == true && files != undefined) {
            for (var i = 0; i < files.length; i++) {
                let file = files[i];
                let fileGuid = helper.generateUUID();
                arrFileGuid.push(fileGuid);
                const fileType = 'I';
                const fileName = file.originalname; //Web에서 보는 파일명
                const orgFileName = file.filename; //실제 디스크에 저장되는 파일명
                const filePath = file.path.replace(process.cwd(), '');
                const urlPath = '/business/trip/' + orgFileName;

                //첨부파일 등록
                params = [fileGuid, fileType, fileName, orgFileName, filePath, urlPath, userGuid];
                res = await pool.query('CALL CMN_FILE_MST_CREATE(?,?,?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);
                
                if (res[0][0].affectedRows >= 1 && res[0][1][0]["@RET_VAL"] != 'N') {
                    if (i == files.length - 1) {
                        console.log("오늘의 출장 상세 첨부파일 등록 성공");
                        isSuccess = true;
                    }
                }
                else {
                    console.log("오늘의 출장 상세 첨부파일 등록 실패");
                    isSuccess = false;
                    break;
                }     
            }
        }

        //오늘의 출장 상세 이미지 삭제
        if(isSuccess && arrFileGuid.length > 0){
            params = ['', tripDetailGuid, userGuid, 'N'];
            res = await pool.query('CALL BIZ_TRIP_DTL_IMG_UPDATE_YN(?,?,?,?,@RET_VAL); select @RET_VAL;', params);

            if (res[0][1][0]["@RET_VAL"] == 'D') {
                console.log("오늘의 출장 상세 이미지 삭제 성공");
                isSuccess = true;
            }
            else {
                console.log("오늘의 출장 상세 이미지 삭제 실패");
                isSuccess = false;
            }
        }

        //오늘의 출장 상세 이미지 등록
        if(isSuccess && arrFileGuid.length > 0){
            for (var i = 0; i < arrFileGuid.length; i++) {
                let tripDetailImgGuid = helper.generateUUID();
                let fileGuid = arrFileGuid[i];
                params = [tripDetailImgGuid, tripDetailGuid, fileGuid, 0, userGuid];
                res = await pool.query('CALL BIZ_TRIP_DTL_IMG_CREATE(?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);
    
                if (res[0][1][0]["@RET_VAL"] != 'N') {
                    if (i == arrFileGuid.length - 1) {
                        console.log("오늘의 출장 상세 이미지 등록 성공");
                    }
                }
                else {
                    console.log("오늘의 출장 상세 이미지 등록 실패");
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

//오늘의 출장 상세 삭제(리스트)
exports.deleteTripDetailList = async (tripDetailGuidList, userGuid) => {
    let conn = await pool.getConnection();    
    let params;
    let res;
    let returnCode = -1;
    let isSuccess = false;

    try {        

        await conn.beginTransaction();

        for (var i = 0; i < tripDetailGuidList.length; i++) {
            tripDetailGuid = tripDetailGuidList[i];
            params = [tripDetailGuid, userGuid];
            
            res = await pool.query('CALL BIZ_TRIP_DTL_UPDATE_YN(?,?,@RET_VAL); select @RET_VAL;', params);

            if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] == 'Y'){
                if (i == tripDetailGuidList.length - 1) {
                    console.log("오늘의 출장 상세 삭제 성공");
                    isSuccess = true;
                }
            }
            else{
                console.log("오늘의 출장 상세 삭제 실패");
                isSuccess = false;
                break;
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

//오늘의 출장 상세 이미지 삭제
exports.deleteTripDetailImages = async (tripDetailImageGuid, tripDetailGuid, userGuid) => {
    let conn = await pool.getConnection();
    let params;
    let res;
    let returnCode = -1;

    try {
        await conn.beginTransaction();

        //오늘의 출장 상세 이미지 삭제
        params = [tripDetailImageGuid, tripDetailGuid, userGuid, 'N'];
        res = await pool.query('CALL BIZ_TRIP_DTL_IMG_UPDATE_YN(?,?,?,?,@RET_VAL); select @RET_VAL;', params);

        if (res[0][1][0]["@RET_VAL"] == 'D') {
            await conn.commit();
            returnCode = 1;
        }
        else {
            conn.rollback();
            returnCode = -1;
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

//오늘의 출장 등록할 수 있는지 여부 조사
exports.validatePossibleCreateYN = async (userGuid) => {    
    try {        
        const [rows, fields] = await pool.query('CALL BIZ_TRIP_MST_CREATE_CHECK(?);', userGuid);

        if(rows[0].length > 0){
            console.log("등록 가능");
            return rows[0][0];     
        }
        else{
            console.log("등록 불가");
            return null;
        }

    } catch (err) {
        console.log(err);
        throw Error(err);
    }    
}; 

//오늘의 출장 상세 등록할 수 있는지 여부 조사
exports.detailValidatePossibleCreateYN = async (tripGuid) => {    
    try {        
        let params = [tripGuid, ''];
        const [rows, fields] = await pool.query('CALL BIZ_TRIP_DTL_CREATE_CHECK(?,?);', params);

        if(rows[0].length > 0){
            console.log("등록 가능");
            return rows[0][0];     
        }
        else{
            console.log("등록 불가");
            return null;
        }

    } catch (err) {
        console.log(err);
        throw Error(err);
    }    
}; 