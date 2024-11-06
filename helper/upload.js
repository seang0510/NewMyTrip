const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

exports.upload = (folderName) => {
  //미들웨어 만들기
  return upload = multer({
    //multer 미들웨어 설정
    storage: multer.diskStorage({

      //경로 설정
      destination: function (req, file, cb) {
        const folerPath = path.join(__dirname, `../uploads/${folderName}/`);
        fs.mkdirSync(folerPath, { recursive: true });
        cb(null, folerPath);
      },

      // 파일 이름 변경 설정: 변경하지 않는 경우 originalname을 filename으로 설정하시오
      filename: function (req, file, cb) {
        console.log(file.originalname);
        console.log(file.mimetype);
        console.log(decodeURI( file.originalname ))

        const filename = Date.now() + "_" + decodeURI( file.originalname );

        //const filename = file.originalname;
        cb(null, filename);
      }
    }),
    limits: { fileSize: 10000000 },
    fileFilter: function (req, file, cb) {
      //이미지 파일인 경우
      if (file.mimetype == 'image/jpeg') {
        if (!file.originalname.match(/\.(jpg|JPG|webp|jpeg|JPEG|png|PNG|gif|GIF|jfif|JFIF)$/)) {
          var message = '이미지 파일만 업로드 가능합니다.';
          message += '(확장자:jpg,jpeg,png,gif,jfif)';
          req.fileValidationError = message;
          return cb(null, false);
        }
      }
      //엑셀 파일인 경우
      else if (file.mimetype == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        if (!file.originalname.match(/\.(xls|xlsx|)$/)) {
          var message = '엑셀 파일만 업로드 가능합니다';
          message += '(확장자:xls,xlsx)';          
          req.fileValidationError = message;
          return cb(null, false);
        }
      }
      cb(null, true);
    }
  });
};