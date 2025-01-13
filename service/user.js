const pool = require('../db/pool');
const helper = require('../helper/helper');

//사용자 조회(개별)
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

//사용자 조회(리스트)
exports.getUserList = async(userGuid, email, joinTypeCode, deviceTypeCode) => {
    try {        
        const [rows, fields] = await pool.query('CALL SYS_USER_MST_SELECT(?,?,?,?,?)', [userGuid, email, joinTypeCode, deviceTypeCode, 'N']);
        
        if(rows[0].length > 0){
            return rows[0];
        }
        else{
            console.log("조회 실패");
            return null;
        }
    } catch (err) {
        console.log(err);
        throw Error(err);
    }
};

//사용자 등록,수정 --> 회원가입과 따로 만들어야한다 (회원가입 할 때는 이미 등록된 경우 비밀번호가 수정되면 안됨)

//사용자 로그인[일반]
exports.getUserForLogin = async (email, password, deviceTypeCode, pushToken) => {
    let conn = await pool.getConnection();
    let user;
    let res;
    let isSuccess;
    let userGuid;

    //패스워드 암호화(SHA512)
    password = helper.createHashPassword(password, "sha512");

    try {        
        await conn.beginTransaction();

        //로그인
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
        
        //가입종류 존재 확인 후 등록/수정
        if(isSuccess == true){
            userGuid = user.USER_GUID;

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

        //PUSH_TOKEN 및 Device Type Code 갱신
        if(isSuccess == true){
            userGuid = user.USER_GUID;

            params = [userGuid, null, null, null, deviceTypeCode, pushToken, userGuid];
            res = await conn.query('CALL SYS_USER_MST_CREATE(?,?,?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);

            if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] != 'N'){
                console.log("PUSH TOKEN 수정 성공");
            }
            else{
                console.log("PUSH TOKEN 수정 실패");
                isSuccess = false;
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

//사용자 회원가입[일반,모바일]
exports.joinUser= async (email, joinTypeCode, authGroupCode, password, joinToken, deviceTypeCode, pushToken) => {    
    let conn = await pool.getConnection();    
    let params;
    let res;
    let userGuid;
    let returnCode = -1;
    let isSuccess = false;
    let returnModel;

    //패스워드 암호화(SHA512)
    password = helper.createHashPassword(password, "sha512");

    try {
        await conn.beginTransaction();

        //기존 사용자 조회
        res = await pool.query('CALL SYS_USER_MST_SELECT(?,?,?,?,?)', [null, email, null, null, 'N']);

        //존재하는 경우
        if(res[0][0].length > 0 && res[0][0][0].DEL_YN == 'N'){
            user = res[0][0][0];
            userGuid = user.USER_GUID;

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

        //소셜 또는 모바일에서 회원가입하는 경우, 일반 가입종류가 없으면 등록
        if(isSuccess == true){         
            //이미 등록된 계정인 경우
            params = [userGuid, null, null];
            res = await conn.query('CALL SYS_USER_JOIN_TYP_SELECT(?,?,?,@RET_VAL); select @RET_VAL;', params);

            //존재하는 경우
            if(res[0][0].length > 0){
                const userJoinType = res[0][0][0];
                const joinTypeCodeN = userJoinType.JOIN_TYP_COD;

                //일반 로그인이 등록되지 않은 경우
                if(joinTypeCodeN.indexOf('N') == -1){
                    params = [userGuid, 'N', null];
                    res = await conn.query('CALL SYS_USER_JOIN_TYP_CREATE(?,?,?,@RET_VAL); select @RET_VAL;', params);   

                    if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] != 'N'){
                        console.log("일반 사용자 가입 종류 등록 성공");
                        isSuccess = true;
                    }
                    else{
                        console.log("일반 사용자 가입 종류 등록 실패");
                        isSuccess = false;
                    }                      
                }
                //소셜 로그인 타입을 등록해야 하는 경우
                else{
                    if(res[0][0].find(x => x.JOIN_TYP_COD == joinTypeCode) === undefined){
                        params = [userGuid, joinTypeCode, null];
                        res = await conn.query('CALL SYS_USER_JOIN_TYP_CREATE(?,?,?,@RET_VAL); select @RET_VAL;', params);        
                        
                        if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] != 'N'){
                            console.log("소셜 사용자 가입 종류 등록 성공");
                            isSuccess = true;
                        }
                        else{
                            console.log("소셜 사용자 가입 종류 등록 실패");
                            isSuccess = false;
                        }                                
                    }
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
    } catch (err) {
        conn.rollback();
        returnCode = -1;
        console.log(err);
        throw Error(err);
    } finally {
        conn.release();
        returnModel = {
            retVal: returnCode,
            userGuid: userGuid,
        };
        return returnModel;
    }
};

//비밀번호 조회
exports.getPasswordByEmail = async (userEmail) => {
    let conn = await pool.getConnection();    
    let changePassword = helper.createRandomPassword(12);
    let res;
    let isSuccess = false;

    try {        
        await conn.beginTransaction();

        var sql = 'CALL SYS_USER_MST_SELECT_PASSWORD(?)';
        const [rows, fields] = await pool.query(sql, userEmail);
        let password = null;

        if(!(rows[0].length == 0 || rows[0][0].PASSWORD == null || rows[0][0].PASSWORD == '')){
            //기존 비밀번호 확인이 된 경우
            password = rows[0][0].PASSWORD;

            //비밀번호 변경
            password = helper.createHashPassword(changePassword, "sha512");
            res = await pool.query("UPDATE SYS_USER_MST SET PWD=?, UPDT_DT=NOW() WHERE EMAIL=? AND DEL_YN='N'", [password, userEmail]);

            if (res[0].affectedRows >= 1) {          
                isSuccess = true;
            }            
        }
        else{
            changePassword = null;
        }

        if (isSuccess == false) {
            conn.rollback();
        }
        else {
            await conn.commit();
        }

        return changePassword;
    } catch (err) {
        console.log(err);
        throw Error(err);
    }
};

//비밀번호 변경 -- 구버전
exports.setPassword= async (userGuid, password) => {
    let conn = await pool.getConnection();    
    let res;
    let returnCode = -1;
    let isSuccess = false;

    //패스워드 암호화(SHA512)
    password = helper.createHashPassword(password, "sha512");

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

//비밀번호 변경
exports.changePassword= async (userGuid, passwordBefore, passwordNew) => {
    let conn = await pool.getConnection();    
    let res;
    let returnCode = -1;
    let isSuccess = false;

    //패스워드 암호화(SHA512)
    passwordBefore = helper.createHashPassword(passwordBefore, "sha512");

    //패스워드 암호화(SHA512)
    passwordNew = helper.createHashPassword(passwordNew, "sha512");

    try {
        await conn.beginTransaction();
        const [rows, fields] = await pool.query('CALL SYS_USER_MST_SELECT(?,?,?,?,?)', [userGuid, null, null, null, 'N']);
        
        if(rows[0].length > 0){
            user = rows[0].length == 0 ? null : rows[0][0];
            console.log("사용자 조회 성공");

            if(user.PWD == passwordBefore){
                console.log('사용자 (구)비밀번호 동일');
                isSuccess = true;
            }
            else{
                console.log('사용자 (구)비밀번호 틀림');
                isSuccess = false;
                returnCode = 0;
            }            
        }
        else{
            console.log("사용자 조회 실패");
            isSuccess = false;
            returnCode = -1;
        }

        if(isSuccess){
            res = await conn.query('CALL SYS_USER_MST_UPDATE_PASSWORD(?,?,?,@RET_VAL); select @RET_VAL;', [userGuid, passwordNew, userGuid]);

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
            console.log("계정 삭제 성공");            
            return 1; //삭제 성공
        }
        else{
            console.log("계정 삭제 실패");
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

//사용자 삭제(리스트)
exports.deleteUserList = async (userGuidList, delYn, regUserGuid) => {
    let conn = await pool.getConnection();    
    let params;
    let res;
    let returnCode = -1;
    let isSuccess = false;

    try {        

        await conn.beginTransaction();

        for (var i = 0; i < userGuidList.length; i++) {
            let userGuid = userGuidList[i];
            params = [userGuid, delYn, regUserGuid];
            
            res = await pool.query('CALL SP_ALL_UPDATE_YN(?,?,?,@RET_VAL); select @RET_VAL;', params);

            if(res[0][1][0]["@RET_VAL"] == 'Y'){
                if (i == userGuidList.length - 1) {
                    console.log("계정 삭제 성공");
                    isSuccess = true;
                }
            }
            else{
                console.log("계정 삭제 실패");
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

//사용자 정지(리스트)
exports.stopUserList = async (userGuidList, useYn, regUserGuid) => {
    let conn = await pool.getConnection();    
    let params;
    let res;
    let returnCode = -1;
    let isSuccess = false;

    try {        

        await conn.beginTransaction();

        for (var i = 0; i < userGuidList.length; i++) {
            let userGuid = userGuidList[i];
            params = [userGuid, useYn, regUserGuid];
            
            res = await pool.query('CALL SYS_USER_MST_UPDATE_USE_YN(?,?,?,@RET_VAL); select @RET_VAL;', params);

            if(res[0][1][0]["@RET_VAL"] == 'Y'){
                if (i == userGuidList.length - 1) {
                    console.log("계정 사용유무 변경 성공");
                    isSuccess = true;
                }
            }
            else{
                console.log("계정 사용유무 변경 실패");
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