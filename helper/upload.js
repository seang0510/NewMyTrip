const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

exports.upload = (folderName, encodeType) => {
  //미들웨어 만들기
  return upload = multer({
    //multer 미들웨어 설정
    storage: multer.diskStorage({

      //경로 설정
      destination: function (req, file, cb) {
        let folerPath = '';

        //관광명소인 경우
        if(folderName == 'public/tour_images'){
          folerPath = path.join(__dirname, `../public/tour_images/`);
        }
        else{
          folerPath = path.join(__dirname, `../uploads/${folderName}/`);
        }

        fs.mkdirSync(folerPath, { recursive: true });
        cb(null, folerPath);
      },

      // 파일 이름 변경 설정: 변경하지 않는 경우 originalname을 filename으로 설정하시오
      filename: function (req, file, cb) {
        console.log(file.originalname);
        console.log(file.mimetype);
        console.log(decodeURI( file.originalname ));

        let name = '';

        //JQuery Ajax 시, encodeType은 latin1이므로 아래 구문이 적용되어야함
        if(encodeType == 'latin1'){
          file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf-8');
          name = file.originalname;
        }
        else{
          file.originalname = decodeURI( file.originalname );

          name = file.originalname;
          console.log("#####");
  
          name = name.replace('+', " ");
          name = name.replace(/%2B/g, "+");
          console.log("#####1");
        }

        let filename = '';

        //관광명소인 경우
        if(folderName == 'public/tour_images'){
          filename = name;
        }
        else{
          filename = Date.now() + "_" + name;
        }

        //const filename = file.originalname;
        console.log("##### filename " + filename);

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