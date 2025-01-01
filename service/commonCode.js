const pool = require('../db/pool');

//공통코드 상세 조회
exports.getCommonCodeDetailList = async (detailCode, classCode) => {
  try {        
      const [rows, fields] = await pool.query('CALL SYS_CMN_COD_DTL_SELECT(?,?,?)', [detailCode, classCode, 'N']);

      if(rows[0].length > 0){
          console.log("공통코드 상세 조회 성공");
          return rows[0];     
      }
      else{
          console.log("공통코드 상세 조회 실패");
          return null;
      }
  } catch (err) {
      console.log(err);
      throw Error(err);
  }
}; 