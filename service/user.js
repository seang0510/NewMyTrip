const pool = require('../db/pool');
const helper = require('../helper/helper');

//사용자 조회
exports.getUser = async() => {
    var sql = 'CALL SYS_USER_MST_SELECT(?)';
    try {        
        const [rows, fields] = await pool.query(sql, '');
        return rows;
    } catch (err) {
        console.log(err);
        throw Error(err);
    }
};


//사용자 조회[로그인]
exports.getUserForLogin = async (userEmail, userPassword, joinTyp, deviceType, pushToken) => {
    var sql = 'CALL SYS_USER_MST_LOGIN(?,?,?,?,?)';
    var params = [userEmail, userPassword, joinTyp, deviceType, pushToken];
    try {        
        const [results] = await pool.query(sql, params);
        console.log("## LOGIN START");
        let user = results[0].length == 0 ? null : results[0][0];
        return user;
    } catch (err) {
        console.log(err);
        throw Error(err);
    }
};

//사용자 조회[리스트]
exports.getUserList = async () => {
    var sql = 'CALL SYS_USER_MST_SELECT_LIST()';
    try {        
        const [rows, fields] = await pool.query(sql, '');
        return rows;
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
        let password = rows[0].length == 0 ? null : rows[0][0].PASSWORD;
        return password;
    } catch (err) {
        console.log(err);
        throw Error(err);
    }
};

//사용자 등록,수정
exports.createUser= async (delUserGuid, updtUserGuid) => {
    let conn = await pool.getConnection();
    try {
        // await conn.beginTransaction();

        // let del = await conn.query(BoardQuery.deleteComment, [commentId])
        // if (del[0].affectedRows == 1) {
        //     let upd = await conn.query(BoardQuery.minusCommentCnt, [boardId])
        // }
        // await conn.commit();

        // return del[0];
    } catch (err) {
        conn.rollback();
        console.log(err);
        throw Error(err);
    } finally {
        conn.release();
    }
};

//사용자 등록,수정[회원가입]
exports.createUserForSignUp = async (userEmail, userPassword, deviceType, joinType, joinToken) => {
    var sqlJoin = 'CALL SYS_USER_MST_JOIN(?,?,?,?,?,?)';
    var userGuid = helper.generateUUID();
    var params = [userEmail, userPassword, userGuid, deviceType, joinType , joinToken];
    let conn = await pool.getConnection();

    try {
        //사용자 조회
        const [results] = await pool.query('CALL SYS_USER_MST_LOGIN(?,?,?,?,?)', [userEmail, userPassword , joinType, deviceType, joinToken]);
        if(results[0].length > 0){
            return 0; //이미 존재
        }
        else{
            //회원가입
            await conn.beginTransaction();
            const res = await conn.query(sqlJoin, params);        
            await conn.commit();

            if(res[0].affectedRows == 1){
                console.log("등록 성공");
                return 1; //등록 성공
            }
            else{
                console.log("등록 실패");
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

//사용자 삭제
exports.deleteUser= async (delUserGuid, updtUserGuid) => {
    let conn = await pool.getConnection();
    try {
        // await conn.beginTransaction();

        // let del = await conn.query(BoardQuery.deleteComment, [commentId])
        // if (del[0].affectedRows == 1) {
        //     let upd = await conn.query(BoardQuery.minusCommentCnt, [boardId])
        // }
        // await conn.commit();

        // return del[0];
    } catch (err) {
        conn.rollback();
        console.log(err);
        throw Error(err);
    } finally {
        conn.release();
    }
};