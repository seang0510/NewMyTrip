const pool = require('../db/pool');
const helper = require('../helper/helper');


//공지사항 조회
exports.getNoticeList = async (boardGuid, title, contents) => {
    try {        
        const [rows, fields] = await pool.query('CALL CMN_BOARD_MST_SELECT(?,?,?,?,?)', [boardGuid, 'N', title, contents, 'N']);

        if(rows[0].length > 0){
            console.log("공지사항 조회 성공");
            return rows[0];            
        }
        else{
            console.log("공지사항 조회 실패");
            return null;
        }
    } catch (err) {
        console.log(err);
        throw Error(err);
    }
};

//공지사항 등록,수정
exports.setNotice = async (boardGuid, title, contents, userGuid) => {
    boardGuid = (boardGuid == null || boardGuid == '') ? helper.generateUUID() : boardGuid;
    let conn = await pool.getConnection();    
    try {        
        let params = [boardGuid, 'N', title, contents, userGuid, 'N'];

        await conn.beginTransaction();
        const res = await pool.query('CALL CMN_BOARD_MST_CREATE(?,?,?,?,?,@RET_VAL); select @RET_VAL;', params);
        await conn.commit();

        if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] == 'C'){
            console.log("공지사항 등록 성공");
            return 1; //등록 성공
        }
        else if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] == 'U'){
            console.log("공지사항 수정 성공");
            return 0; //수정 성공
        }
        else{
            console.log("공지사항 등록 실패");
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

//공지사항 삭제
exports.deleteNotice = async (boardGuid, userGuid) => {
    let conn = await pool.getConnection();    
    try {        
        let params = [boardGuid, userGuid];

        await conn.beginTransaction();
        const res = await pool.query('CALL CMN_BOARD_MST_UPDATE_YN(?,?,@RET_VAL); select @RET_VAL;', params);
        await conn.commit();

        if(res[0][0].affectedRows == 1 && res[0][1][0]["@RET_VAL"] == 'Y'){
            console.log("공지사항 삭제 성공");
            return 1; //삭제 성공
        }
        else{
            console.log("공지사항 삭제 실패");
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