const pool = require('../db/pool');
const helper = require('../helper/helper');


//공지사항 조회[리스트]
exports.getNoticeList = async (boardTypeCode) => {
    console.log("## boardTypeCode ## " + boardTypeCode);

    var sql = 'CALL CMN_BOARD_MST_SELECT_LIST(?)';
    var params = [boardTypeCode];
    try {        
        const [rows, fields] = await pool.query(sql, params);
        return rows;
    } catch (err) {
        console.log(err);
        throw Error(err);
    }
};