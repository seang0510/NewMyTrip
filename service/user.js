const pool = require('../db/pool');
const helper = require('../helper/helper');

//사용자 조회
exports.getUser = async(userGuid, email, joinTypeCode, deviceTypeCode) => {
    let user = null;

    try {        
        const [rows, fields] = await pool.query('CALL SYS_USER_MST_SELECT(?,?,?,?,?)', [userGuid, email, joinTypeCode, deviceTypeCode, 'N']);
        
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

//사용자 등록,수정 --> 회원가입과 따로 만들어야한다 (회원가입 할 때는 이미 등록된 경우 비밀번호가 수정되면 안됨)


//사용자 로그인[일반]
exports.getUserForLogin = async (email, password) => {
    let conn = await pool.getConnection();
    let user;
    let res;
    let isSuccess;
    try {        
        //로그인^
        res = await pool.query('CALL SYS_USER_MST_LOGIN(?,?,?,?)', [email, 'N', password, 'N']);
        if(res[0][0].length > 0){
            console.log('로그인 성공');            
            user = res[0][0][0];
            isSuccess = true;
        }   
        else{
            console.log('로그인 실패');
            isSuccess = false;
        }     
        
        if(isSuccess == true){
            const userGuid = user.USER_GUID;

            //입력한 가입종류로 등록된 기록이 있는지 확인
            res = await pool.query('CALL SYS_USER_JOIN_TYP_SELECT(?,?,?,?)', [userGuid, 'N', '', 'N']);

            if(!(res[0][0].length > 0)){
                res = await conn.query('CALL SYS_USER_JOIN_TYP_CREATE(?,?,?,@RET_VAL); select @RET_VAL;', [userGuid, 'N', null]);
    
                if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] != 'N'){
                    console.log("사용자 가입종류 등록 성공");
                }
                else{
                    console.log("사용자 가입종류 등록 실패");
                    isSuccess = false;
                }                       
            }
        }

        if(isSuccess){
            await conn.commit();
            console.log("로그인 최종 성공");
        }
        else{
            await conn.rollback();
            console.log("로그인 최종 실패");
            user = null;
        }

    } catch (err) {
        conn.rollback();        
        user = null;
        console.log(err);
        throw Error(err);
    } finally {
        conn.release();
        return user;
    }
};

//사용자 회원가입[일반]
exports.joinUser= async (email, joinTypeCode, authGroupCode, password, joinToken, deviceTypeCode, pushToken) => {    
    let conn = await pool.getConnection();    
    let params;
    let res;
    let userGuid;
    let returnCode = -1;
    let isSuccess = false;

    try {
        await conn.beginTransaction();

        //기존 사용자 조회
        res = await pool.query('CALL SYS_USER_MST_SELECT(?,?,?,?,?)', [null, email, null, null, 'N']);

        //존재하는 경우
        if(res[0][0].length > 0 && res[0][0][0].DEL_YN == 'N'){
            user = res[0][0][0];
            isSuccess = true;
            returnCode = 0;
        }
        //삭제되었거나 등록인 경우
        else{
            //삭제된 경우
            if(res[0][0].length > 0 && res[0][0][0].DEL_YN == 'Y'){
                user = res[0][0][0];
                userGuid = user.USER_GUID;
            }
            //등록인 경우
            else{
                userGuid = helper.generateUUID();
            }

            params = [userGuid, email, authGroupCode, password, deviceTypeCode, pushToken, userGuid];
            res = await conn.query('CALL SYS_USER_MST_CREATE(?,?,?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);

            if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] != 'N'){
                console.log("사용자 등록 성공");
                isSuccess = true;
                returnCode = 1; //등록/수정 성공  
            }
            else{
                console.log("사용자 등록 실패");
                isSuccess = false;
                returnCode = -1; //등록/수정 실패
            }   
        }

        //사용자 가입종류 등록
        if(isSuccess == true && returnCode != 0){    
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
    } catch (err) {
        conn.rollback();
        returnCode = -1;
        console.log(err);
        throw Error(err);
    } finally {
        conn.release();
        return returnCode;
    }
};

//사용자 로그인 및 회원가입 한 번에(소셜 로그인)
exports.setLoginWithSignUp= async (email, joinTypeCode, joinToken) => {    
    let conn = await pool.getConnection();    
    let params;
    let res;
    let user;
    let userGuid;
    let isSuccess = false;    

    try {
        await conn.beginTransaction();

        //기존 사용자 조회
        res = await pool.query('CALL SYS_USER_MST_SELECT(?,?,?,?,?)', [null, email, null, null, 'N']);

        //존재하는 경우
        if(res[0][0].length > 0 && res[0][0][0].DEL_YN == 'N'){
            user = res[0][0][0];
            userGuid = user.USER_GUID;
            isSuccess = true;
            user.IS_SUCCESS = 0;
        }
        //삭제되었거나 등록인 경우
        else{        
            //삭제된 경우
            if(res[0][0].length > 0 && res[0][0][0].DEL_YN == 'Y'){
                user = res[0][0][0];

                //복구
                userGuid = user.USER_GUID;
                params = [userGuid, 'N', userGuid];
                res = await conn.query('CALL SYS_USER_MST_UPDATE_YN(?,?,?,@RET_VAL); select @RET_VAL;', params);
            }
            //등록인 경우
            else{
                userGuid = helper.generateUUID();
                user = {
                    USER_GUID : userGuid,
                    EMAIL : email,
                    PWD : '',
                    AUTH_GRP_COD : 'N',
                    DEVICE_TYP_COD : '',
                    PUSH_TOKEN: '',
                    JOIN_TYP_COD : joinTypeCode,
                };
                params = [userGuid, email, 'N', null, null, null, userGuid];
                res = await conn.query('CALL SYS_USER_MST_CREATE(?,?,?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);
            }

            if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] != 'N'){
                console.log("사용자 등록 성공");
                isSuccess = true;
                user.IS_SUCCESS = 1; //등록/수정 성공  
            }
            else{
                console.log("사용자 등록 실패");
                isSuccess = false;
                user.IS_SUCCESS = -1; //등록/수정 실패
            }   
        }

        //가입 종류 등록 또는 수정(=토큰 갱신)
        if(isSuccess == true){
            res = await conn.query('CALL SYS_USER_JOIN_TYP_CREATE(?,?,?,@RET_VAL); select @RET_VAL;', [userGuid, joinTypeCode, joinToken]);
            if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] != 'N'){
                console.log("사용자 가입종류 등록 성공");
            }
            else{
                console.log("사용자 가입종류 등록 실패");
                isSuccess = false;
            }          
        }

        if (isSuccess == false) {
            conn.rollback();
            user = null;
        }
        else {
            await conn.commit();
        }    
                
    } catch (err) {
        conn.rollback();
        user = null;
        console.log(err);        
        throw Error(err);
    } finally {
        conn.release();
        return user;
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