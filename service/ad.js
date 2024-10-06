const pool = require('../db/pool');
const helper = require('../helper/helper');

//광고 조회
exports.getAdList = async (adGuid, adName) => {
    try {        
        const [rows, fields] = await pool.query('CALL CMN_AD_MST_SELECT(?,?,?)', [adGuid, adName, 'N']);

        if(rows[0].length > 0){
            console.log("광고 조회 성공");
            return rows[0];            
        }
        else{
            console.log("광고 조회 실패");
            return null;
        }
    } catch (err) {
        console.log(err);
        throw Error(err);
    }
};

//광고 등록,수정
exports.setAd = async (adGuid, adName, file, urlLink, userGuid) => {
  adGuid = (adGuid == null || adGuid == '') ? helper.generateUUID() : adGuid;
    let conn = await pool.getConnection();        
    try {        
        let params;
        let res;
        let fileGuid = null;

        await conn.beginTransaction();

        //첨부파일이 존재하는 경우 
        if (file != undefined) {
            fileGuid = helper.generateUUID();
            const fileType = 'I';
            const fileName = file.originalname; //Web에서 보는 파일명
            const orgFileName = file.filename; //실제 디스크에 저장되는 파일명
            const filePath = file.path.replace(process.cwd(),'');
            const urlPath = file.path.replace(process.cwd() + '\\uploads','');

            //첨부파일 등록
            params = [fileGuid, fileType, fileName, orgFileName, filePath, urlPath, userGuid];
            res = await pool.query('CALL CMN_FILE_MST_CREATE(?,?,?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);  
            console.log("이미지 등록 성공");          
        }

        //광고 등록/수정
        params = [adGuid, adName, fileGuid, urlLink, userGuid];
        res = await pool.query('CALL CMN_AD_MST_CREATE(?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);

        await conn.commit();

        if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] == 'C'){
            console.log("광고 등록 성공");
            return 1; //등록 성공
        }
        else if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] == 'U'){
            console.log("광고 수정 성공");
            return 0; //수정 성공
        }
        else{
            console.log("광고 등록 실패");
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

//광고 삭제
exports.deleteAd = async (adGuid, userGuid) => {
    let conn = await pool.getConnection();    
    try {        
        let params = [adGuid, userGuid];

        await conn.beginTransaction();
        const res = await pool.query('CALL CMN_AD_MST_UPDATE_YN(?,?,@RET_VAL); select @RET_VAL;', params);
        await conn.commit();

        if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] == 'Y'){
            console.log("광고 삭제 성공");
            return 1; //삭제 성공
        }
        else{
            console.log("광고 삭제 실패");
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