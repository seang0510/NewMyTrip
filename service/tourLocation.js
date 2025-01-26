const pool = require('../db/pool');
const helper = require('../helper/helper');

//관광명소 조회(리스트)
exports.getTourLocationList = async (tourLocationGuid, tourLocationName) => {
    try {        
        const [rows, fields] = await pool.query('CALL BIZ_TOUR_LOC_MST_SELECT(?,?,?)', [tourLocationGuid, tourLocationName, 'N']);
        
        if(rows[0].length > 0){
            console.log("관광명소 조회 성공");
            return rows[0];            
        }
        else{
            console.log("관광명소 조회 실패");
            return null;
        }        
    } catch (err) {
        console.log(err);
        throw Error(err);
    }
};

//관광명소 조회(개별)
exports.getTourLocation = async (tourLocationGuid) => {
    let tourLocation;
    let res;
    let isSuccess = false;

    try {        
        
        res = await pool.query('CALL BIZ_TOUR_LOC_MST_SELECT(?,?,?)', [tourLocationGuid, '', 'N']);

        if(res[0][0].length > 0){
            console.log("관광명소 조회 성공");
            tourLocation = res[0][0][0];
            isSuccess = true;
        }
        else{
            console.log("관광명소 조회 실패");
            isSuccess = false;
        }

        if(isSuccess){
            res = await pool.query('CALL BIZ_TOUR_LOC_MST_IMG_SELECT(?,?,?)', [null, tourLocationGuid, 'N']);

            if(res[0][0].length > 0){
                console.log("관광명소 이미지 조회 성공");
                tourLocationImages = res[0][0];    
                tourLocation.IMGS = tourLocationImages;
                isSuccess = true;
            }
            else{
                tourLocationImages = "";    
                tourLocation.IMGS = tourLocationImages;
            }
        }

        if(isSuccess){
            return tourLocation;
        }
        else{
            return null;
        }        

    } catch (err) {
        console.log(err);
        throw Error(err);
    }
};

//관광명소 등록,수정
exports.setTourLocation = async (tourLocationGuid, tourLocationTypeCode, tourLocationName, address, latitude, longitude, urlLink, tel, title, contents, order, userGuid) => {
    order = (tourLocationGuid == null || tourLocationGuid == '') ? 0 : order; //GUID가 없으면 등록
    tourLocationGuid = (tourLocationGuid == null || tourLocationGuid == '') ? helper.generateUUID() : tourLocationGuid;
    let conn = await pool.getConnection();
    let params;
    let res;
    let returnCode = -1;
    let isSuccess = true;

    try {
        await conn.beginTransaction();

        params = [tourLocationGuid, tourLocationTypeCode, tourLocationName, address, latitude, longitude, urlLink, tel, title, contents, order, userGuid, 'N'];
        console.log(params);
        res = await pool.query('CALL BIZ_TOUR_LOC_MST_CREATE(?,?,?,?,?,?,?,?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);

        if (res[0][1][0]["@RET_VAL"] == 'C') {
            console.log("관광명소 등록 성공");
            isSuccess = true;
            returnCode = 1; //등록 성공          
        }
        else if (res[0][1][0]["@RET_VAL"] == 'U') {
            console.log("관광명소 수정 성공");
            isSuccess = true;
            returnCode = 0; //수정 성공
        }
        else {
            console.log("관광명소 등록 실패");
            isSuccess = false;
            returnCode = -1; //등록 실패
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

//관광명소 삭제(리스트)
exports.deleteTourLocationList = async (tourLocationGuidList, userGuid) => {
    let conn = await pool.getConnection();    
    let params;
    let res;
    let returnCode = -1;
    let isSuccess = false;

    try {        

        await conn.beginTransaction();

        for (var i = 0; i < tourLocationGuidList.length; i++) {
            tourLocationGuid = tourLocationGuidList[i];
            params = [tourLocationGuid, userGuid];
            
            res = await pool.query('CALL BIZ_TOUR_LOC_MST_UPDATE_YN(?,?,@RET_VAL); select @RET_VAL;', params);

            if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] == 'Y'){
                if (i == tourLocationGuidList.length - 1) {
                    console.log("관광명소 삭제 성공");
                    isSuccess = true;
                }
            }
            else{
                console.log("관광명소 삭제 실패");
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

//관광명소 이미지 등록
exports.setTourLocationImages = async (tourLocationGuid, files, userGuid) => {
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
                const filePath = '/tour_images/';
                const urlPath = '/tour_images/';

                //첨부파일 등록
                params = [fileGuid, fileType, fileName, orgFileName, filePath, urlPath, userGuid];
                res = await pool.query('CALL CMN_FILE_MST_CREATE(?,?,?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);
                
                if (res[0][0].affectedRows >= 1 && res[0][1][0]["@RET_VAL"] != 'N') {
                    if (i == arrFileGuid.length - 1) {
                        console.log("관광명소 첨부파일 등록 성공");
                        isSuccess = true;
                    }
                }
                else {
                    console.log("관광명소 첨부파일 등록 실패");
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

        //관광명소 이미지 등록
        if(isSuccess){
            for (var i = 0; i < arrFileGuid.length; i++) {
                let tourLocationImageGuid = helper.generateUUID();
                let fileGuid = arrFileGuid[i];
                params = [tourLocationImageGuid, tourLocationGuid, fileGuid];
                console.log(params);
                res = await pool.query('CALL BIZ_TOUR_LOC_MST_IMG_INSERT(?,?,?,@RET_VAL); select @RET_VAL;', params);
    
                if (res[0][1][0]["@RET_VAL"] != 'N') {
                    if (i == arrFileGuid.length - 1) {
                        console.log("관광명소 이미지 등록 성공");
                    }
                }
                else {
                    console.log("관광명소 이미지 등록 실패");
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

//관광명소 이미지 삭제
exports.deleteTourLocationImages = async (tourLocationImageGuid) => {
    let conn = await pool.getConnection();
    let params;
    let res;
    let returnCode = -1;

    try {
        await conn.beginTransaction();

        //관광명소 이미지 삭제
        params = [tourLocationImageGuid, 'N'];
        res = await pool.query('CALL BIZ_TOUR_LOC_MST_IMG_DELETE(?,@RET_VAL); select @RET_VAL;', params);

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