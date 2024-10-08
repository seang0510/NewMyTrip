const pool = require('../db/pool');
const helper = require('../helper/helper');

//사용자 조회
exports.getUser = async(userGuid, email, deviceTypeCode) => {
    let user = null;

    try {        
        const [rows, fields] = await pool.query('CALL SYS_USER_MST_SELECT(?,?,?,?)', [userGuid, email, deviceTypeCode, 'N']);
        
        if(rows[0].length > 0){
            user = rows[0].length == 0 ? null : rows[0][0];
            console.log("조회 성공");
        }
        else{
            console.log("조회 실패");
        }
        return user;
    } catch (err) {
        console.log(err);
        throw Error(err);
    }
};

//사용자 조회[로그인]
exports.getUserForLogin = async (email, joinTypeCode, password, joinToken, deviceTypeCode, pushToken) => {
    let conn = await pool.getConnection();
    let user = null;
    let res;
    let userGuid;
    try {        
        //입력한 가입종류로 등록된 기록이 있는지 확인
        res = await pool.query('CALL SYS_USER_JOIN_TYP_SELECT(?,?,?,?)', ['', joinTypeCode, email, 'N']);

        if(res[0][0].length > 0){
            res = await pool.query('CALL SYS_USER_MST_LOGIN(?,?,?,?,?,?)', [email, joinTypeCode , password, joinToken, deviceTypeCode, 'N']);
        }
        else{
            //등록된 기록이 없는 경우
            const [rows, fields] = await pool.query('CALL SYS_USER_MST_SELECT(?,?,?,?)', ['', email, '', 'N']);
            if(!(rows[0].length == 0 || rows[0][0].USER_GUID == null || rows[0][0].USER_GUID == '')){
                userGuid = rows[0][0].USER_GUID;
            }
            res = await conn.query('CALL SYS_USER_JOIN_TYP_CREATE(?,?,?,@RET_VAL); select @RET_VAL;', [userGuid, joinTypeCode, joinToken]);

            if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] != 'N'){
                console.log("사용자 가입종류 등록 성공");
                res = await pool.query('CALL SYS_USER_MST_LOGIN(?,?,?,?,?,?)', [email, joinTypeCode , password, joinToken, deviceTypeCode, 'N']);
            }
            else{
                console.log("사용자 가입종류 등록 실패");
            }
        }

        if(res[0][0].length > 0){
            console.log("로그인 성공");
            user = res[0][0].length == 0 ? null : res[0][0][0];

            //만약에 기존 PUSH TOKEN이 없으며, 입력받은 pushToken이 존재하는 경우, 수정
            if(!(pushToken == null || pushToken == '')){
                userGuid = user.USER_GUID;

                //PUSH TOKEN 갱신
                res = await conn.query('CALL SYS_USER_MST_UPDATE_PUSH_TOKEN(?,?,?,@RET_VAL); select @RET_VAL;', [userGuid, pushToken, userGuid]);        
                await conn.commit();

                if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] != 'N'){
                    console.log("PUSH TOKEN 갱신 성공");
                }
                else{
                    console.log("PUSH TOKEN 갱신 실패");
                }
            }
            else{
                console.log("PUSH TOKEN 갱신 없음");
            }
        }
        else {
            console.log("로그인 실패");
            await conn.rollback();
        }

        return user;
    } catch (err) {
        conn.rollback();        
        console.log(err);
        throw Error(err);
    } finally {
        conn.release();
    }
};

//비밀번호 조회
exports.getPasswordByEmail = async (userEmail) => {
    var sql = 'CALL SYS_USER_MST_SELECT_PASSWORD(?)';
    try {        
        const [rows, fields] = await pool.query(sql, userEmail);
        let password = null;

        if(!(rows[0].length == 0 || rows[0][0].PASSWORD == null || rows[0][0].PASSWORD == '')){
            password = rows[0][0].PASSWORD;
        }
        return password;
    } catch (err) {
        console.log(err);
        throw Error(err);
    }
};

//사용자 등록,수정,회원가입
exports.createUser= async (userGuid, email, joinTypeCode, authGroupCode, password, joinToken, deviceTypeCode, pushToken) => {
    userGuid = (userGuid == null || userguid == '') ? helper.generateUUID() : userguid;
    let conn = await pool.getConnection();    
    let params;
    let res;
    let returnCode = -1;
    let isSuccess = false;

    try {
        await conn.beginTransaction();

        //사용자 조회
        const [results] = await pool.query('CALL SYS_USER_MST_SELECT(?,?,?,?)', [null, email, null, 'N']);
        if(results[0].length > 0){
            console.log("등록된 사용자 존재");            
            isSuccess = true;
            returnCode = 0; //이미 존재
        }
        else{            
            //회원가입
            params = [userGuid, email, authGroupCode, password, deviceTypeCode, pushToken, userGuid];
            res = await conn.query('CALL SYS_USER_MST_CREATE(?,?,?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);

            if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] != 'N'){
                console.log("사용자 등록 성공");
                isSuccess = true;
                returnCode = 1; //등록 성공  
            }
            else{
                console.log("사용자 등록 실패");
                isSuccess = false;
                returnCode = -1; //등록 실패
            }                  
        }

        if(isSuccess == true){    
            params = [userGuid, joinTypeCode, joinToken];
            res = await conn.query('CALL SYS_USER_JOIN_TYP_CREATE(?,?,?,@RET_VAL); select @RET_VAL;', params);   
            
            if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] != 'N'){
                console.log("사용자 가입 종류 등록,수정 성공");
                isSuccess = true;
            }
            else{
                console.log("사용자 가입 종류 등록 실패");
                isSuccess = false;
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

//비밀번호 변경
exports.setPassword= async (userGuid, password) => {
    let conn = await pool.getConnection();    
    let res;
    let returnCode = -1;
    let isSuccess = false;

    try {
        await conn.beginTransaction();
        res = await conn.query('CALL SYS_USER_MST_UPDATE_PASSWORD(?,?,?,@RET_VAL); select @RET_VAL;', [userGuid, password, userGuid]);

        if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] != 'N'){
            console.log("비밀번호 변경 성공");
            isSuccess = true;
            returnCode = 1; //등록 성공      
        }
        else{
            console.log("비밀번호 변경 실패");
            isSuccess = false;
            returnCode = -1; //등록 실패
        }

        //일반계정이 등록되었는지 확인 후 등록
        if(isSuccess == true){
            const [rows, fields] = await pool.query('CALL SYS_USER_JOIN_TYP_SELECT(?,?,?,?)', [userGuid, 'N', '', 'N']);     
            
            if(rows[0].length > 0){
                console.log("등록된 일반 계정 존재");
            }
            else{
                console.log("등록된 일반 계정 없음");
                res = await conn.query('CALL SYS_USER_JOIN_TYP_CREATE(?,?,?,@RET_VAL); select @RET_VAL;', [userGuid, 'N', '']);

                if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] != 'N'){
                    console.log("사용자 일반 계정 등록 성공");
                    isSuccess = true;
                    returnCode = 1; //등록 성공  
                }
                else{
                    console.log("사용자 일반 계정 등록 실패");
                    isSuccess = false;
                    returnCode = -1; //등록 실패
                }   
            }            
        }

        if(isSuccess == false){
            conn.rollback();
            returnCode = -1;
        }
        else{
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

//사용자 삭제
exports.deleteUser= async (delUserGuid, updtUserGuid) => {

    let conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const res = await conn.query('CALL SYS_USER_MST_UPDATE_YN(?,?,@RET_VAL); select @RET_VAL;', [userGuid, userGuid]);        
        await conn.commit();

        if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] != 'N'){            
            console.log("사용자 삭제 성공");            
            return 1; //삭제 성공
        }
        else{
            console.log("사용자 삭제 실패");
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