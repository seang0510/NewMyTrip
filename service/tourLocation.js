const pool = require('../db/pool');
const helper = require('../helper/helper');


//공지사항 조회[리스트]
exports.getTourLocationList = async () => {
    var sql = 'CALL BIZ_TOUR_LOC_MST_SELECT_LIST()';
    try {        
        const [rows, fields] = await pool.query(sql, "");
        return rows;
    } catch (err) {
        console.log(err);
        throw Error(err);
    }
};