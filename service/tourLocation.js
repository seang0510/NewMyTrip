const pool = require('../db/pool');
const helper = require('../helper/helper');

//관광명소 조회
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