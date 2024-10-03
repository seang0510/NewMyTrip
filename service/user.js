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

//사용자 조회[로그인]
exports.getUserForLogin = async (email, joinTypeCode, password, joinToken, deviceTypeCode, pushToken) => {
    let conn = await pool.getConnection();

    try {        
        //로그인
        const [results] = await pool.query('CALL SYS_USER_MST_LOGIN(?,?,?,?,?,?)', [email, joinTypeCode , password, joinToken, deviceTypeCode, 'N']);
        let user = null;

        if(results[0].length > 0){
            console.log("로그인 성공");
            user = results[0].length == 0 ? null : results[0][0];

            //만약에 기존 PUSH TOKEN이 없으며, 입력받은 pushToken이 존재하는 경우, 수정
            if(!(pushToken == null || pushToken == '')){
                let userGuid = user.USER_GUID;
                let returnValue = null;

                //PUSH TOKEN 갱신
                await conn.beginTransaction();
                const res = await conn.query('CALL SYS_USER_MST_UPDATE_PUSH_TOKEN(?,?,?,@RET_VAL); select @RET_VAL;', [userGuid, pushToken, userGuid]);        
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

//사용자 조회(리스트)
exports.getUserList = async (email, joinTypeCode, deviceTypeCode) => {
    try {        
        const [rows, fields] = await pool.query('CALL SYS_USER_MST_SELECT(?,?,?,?,?)', [null, email, joinTypeCode, deviceTypeCode, 'N']);
        
        if(rows[0].length > 0){
            console.log("조회 성공");
            return rows;            
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
    try {
        //사용자 조회
        const [results] = await pool.query('CALL SYS_USER_MST_SELECT(?,?,?,?,?)', [null, email, null, null, 'N']);
        if(results[0].length > 0){
            return 0; //이미 존재
        }
        else{
            //회원가입
            let params = [userGuid, email, joinTypeCode, authGroupCode, password, joinToken, deviceTypeCode, pushToken, userGuid];

            await conn.beginTransaction();
            const res = await conn.query('CALL SYS_USER_MST_CREATE(?,?,?,?,?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);
            await conn.commit();

            if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] != 'N'){
                console.log("사용자 등록 성공");
                return 1; //등록 성공
            }
            else{
                console.log("사용자 등록 실패");
                return -1; //등록 실패
            }
        }
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
    try {
        await conn.beginTransaction();
        const res = await conn.query('CALL SYS_USER_MST_UPDATE_PASSWORD(?,?,?,@RET_VAL); select @RET_VAL;', [userGuid, password, userGuid]);
        await conn.commit();

        if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] != 'N'){
            console.log("비밀번호 변경 성공");
            return 1; //성공
        }
        else{
            console.log("비밀번호 변경 실패");
            return -1; //실패
        }

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