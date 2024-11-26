const userService = require('../service/user');
const helper = require('../helper/helper');
const axios = require("axios");
const mail = require('../helper/mail'); // 모듈 import
const qs = require('qs'); // 모듈 Query String
var fs = require("fs");
var zip = new require('node-zip')();
const path = require('path');

//로그인(GET)
exports.getLogin = async (req, res, next) => {
    try {
        //로그인 되지 않은 경우
        if(!(req.session.valid == true)){
            return res.render('main/login', { title: 'Express', layout: false });
        }
        //현재 로그인 되어 있는 경우    
        else{
            res.clearCookie('MSG');
            return res.redirect('/');
        }        
    }
    catch (err) {
        return res.status(500).json(err);
    }
};

//메인화면(GET)
exports.getIndex = async (req, res, next) => {
    try {
        //로그인 되지 않은 경우
        if(!(req.session.valid == true)){
            var msg = helper.setMessageForCookie('로그인 오류', '로그인 하시길 바랍니다.');
            res.cookie('MSG', msg, { httpOnly: false, secure: false });
            return res.redirect('/login');
        }
        //현재 로그인 되어 있는 경우    
        else{
            var email = req.session.email;
            var authGroupCode = req.session.authGroupCode;
            res.clearCookie('MSG');
            // return res.render('main/index', { title: '메인화면', userEmail: email, authCode: authGroupCode });
            return res.redirect('/business/trip');
        }        
    }
    catch (err) {
        return res.status(500).json(err);
    }
};

//일반 로그인(POST)
exports.setLogin = async (req, res, next) => {
    console.log("setLogin");
    let resModel;
    const email = req.body.email;
    const password = helper.changeUndefiendToNull(req.body.password);
    //password = descryptoPassword(password); //복호화(추후 작업)    
    const deviceTypeCode = helper.changeUndefiendToNull(req.body.deviceTypeCode);           //ANDROID, IOS
    const pushToken = helper.changeUndefiendToNull(req.body.pushToken);    

    try {
        //사용자 조회
        let user = await userService.getUserForLogin(email, password, deviceTypeCode, pushToken);

        //로그인 실패한 경우
        if (user == null) {
            resModel = helper.createResponseModel(false, '올바르지 않은 이메일 및 비밀번호입니다.', "");
            return res.status(200).json(resModel);
        }
        //로그인 성공한 경우
        else {
            //세션 스토어가 이루어진 후 redirect를 해야함.
            req.session.save(function(){ 
                req.session.email = user.EMAIL;
                req.session.joinTypeCode = user.JOIN_TYP_COD;
                req.session.authGroupCode = user.AUTH_GRP_COD;
                req.session.userGuid = user.USER_GUID;
                req.session.isLogined = true;
                req.session.valid = true;

                resModel = helper.createResponseModel(true, '로그인 성공', user);
                return res.status(200).json(resModel);
            });
        }
    }
    catch (err) {
        return res.status(500).json(err);
    }
}; 

//로그인:카카오(GET)
exports.getLoginKakao = async (req, res, next) => {
    console.log("카카오 로그인 화면");
    let clientId = process.env.KAKAO_REST_API_KEY;
    let redirectUri = process.env.KAKAO_REDIRECT_URI;

    //인가코드 받기, 카카오톡에서 자동 로그인
    const kakaoLoginURL = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&prompt=login`;
    res.redirect(kakaoLoginURL);
}; 

//로그인:카카오 콜백(GET)
exports.getLoginKakaoCallback = async (req, res, next) => {
    console.log("카카오 로그인 콜백");    
    let clientId = process.env.KAKAO_REST_API_KEY;
    let redirectUri = process.env.KAKAO_REDIRECT_URI;
    let token;
    let resModel;
    let email;
    
    //Access Token 가져오기
    try {
      const url = 'https://kauth.kakao.com/oauth/token';
      const body = qs.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        redirectUri: redirectUri,
        code: req.query.code,
      });
      const header = { 'content-type': 'application/x-www-form-urlencoded' };
      const response = await axios.post(url, body, header);
      token = response.data.access_token;
      console.log("카카오 Access Token 가져오기 성공");
    } 
    catch (err) {
        console.log(err);
        resModel = helper.createResponseModel(true, '카카오 소셜 로그인: Access Token 가져오기에 실패하였습니다.', "");
        return res.redirect('/login/kakao');
    }
  
    //사용자 이메일 가져오기
    try {
        const url = 'https://kapi.kakao.com/v2/user/me';
        const Header = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        const response = await axios.get(url, Header);
        email = response.data.kakao_account.email;
        console.log("카카오 사용자 Email 가져오기 성공");
      }
    catch (err) {
        console.log(err);
        resModel = helper.createResponseModel(true, '카카오 소셜 로그인: 사용자 Email 가져오기에 실패하였습니다.', "");
        return res.redirect('/login/kakao');
    }    

    try {
        //사용자 조회
        let user = await userService.getUser(null, email, null);
        
        if (user != null) {
            //세션 스토어가 이루어진 후 redirect를 해야함.
            req.session.save(function(){ 
                req.session.email = user.EMAIL;
                req.session.joinTypeCode = user.JOIN_TYP_COD;
                req.session.authGroupCode = user.AUTH_GRP_COD;
                req.session.userGuid = user.USER_GUID;
                req.session.isLogined = true;
                req.session.valid = true;

                console.log("로그인 성공");
                return res.redirect('/');
            });
        } 
        else {
            return res.render('main/signup', { title: 'Express', layout: false, email: email, joinTypeCode: 'K', joinToken: token });
        }
    }
    catch (err) {
        return res.redirect('/login/kakao');
    }
}; 

//이메일로 패스워드 조회(POST) With 이메일 발송
exports.getPasswordByEmail = async (req, res, next) => {
    console.log("## sendMailSample");
    const userEmail = helper.changeUndefiendToNull(req.body.email);

    try {
        const password = await userService.getPasswordByEmail(userEmail);

        if (password == null) {
            resModel = helper.createResponseModel(false, '존재하지 않는 이메일이거나 소셜 로그인 계정입니다.', '');
        }
        else{
            const mailOptions = {
                from: 'gobiztrip@gmail.com', // 작성자
                to: userEmail, // 수신자
                subject: '(모두의 출장) 비밀번호 찾기', // 메일 제목
                text: '비밀번호는 ' + password + ' 입니다.' // 메일 내용
            };

            let resp= await mail.wrapedSendMail(mailOptions);
            if (!resp) {
                resModel = helper.createResponseModel(false, '메일 발송에 오류가 발생하였습니다.', '');
            }
            else {
                resModel = helper.createResponseModel(true, userEmail + ' 로 메일이 발송되었습니다.', '');
            }

            return res.status(200).json(resModel);
        }                 
    }
    catch (err) {
        return res.status(500).json(err);
    }
};

//일반,모바일 회원가입(POST)
exports.setSignUp = async (req, res, next) => {
    let resModel;
    const email = req.body.email;
    const joinTypeCode = req.body.joinTypeCode == undefined ? 'N' : req.body.joinTypeCode;  //"N , K , G"
    const password = helper.changeUndefiendToNull(req.body.password);
    //password = descryptoPassword(password); //복호화(추후 작업)
    const joinToken = helper.changeUndefiendToNull(req.body.joinToken);                     //KAKAO, GOOGLE TOKEN
    const deviceTypeCode = helper.changeUndefiendToNull(req.body.deviceTypeCode);           //ANDROID, IOS
    const pushToken = helper.changeUndefiendToNull(req.body.pushToken);
    
    console.log("joinTypeCode :: " + joinTypeCode);
    try {
        //회원가입(1:등록, 0:이미 존재, -1:실패)
        let returnModel = await userService.joinUser(email, joinTypeCode , 'N', password, joinToken , deviceTypeCode, pushToken);
        retVal = returnModel.retVal;

        //성공
        if (retVal == 1) {
            resModel = helper.createResponseModel(true, '회원가입에 성공하셨습니다.', "");
        }
        //실패
        else if (retVal == -1) {
            resModel = helper.createResponseModel(false, '회원가입에 실패하였습니다.', "");
        }
        //이미 존재
        else{
            resModel = helper.createResponseModel(false, '이미 등록된 이메일입니다.', "");
        }        

        return res.status(200).json(resModel);
    }
    catch (err) {
        return res.status(500).json(err);
    }
};

//웹 소셜 회원가입(POST)
exports.setSignUpWithSocial = async (req, res, next) => {
    const email = req.body.email;
    const joinTypeCode = req.body.joinTypeCode == undefined ? 'N' : req.body.joinTypeCode;  //"N , K , G"
    const password = helper.changeUndefiendToNull(req.body.password);
    //password = descryptoPassword(password); //복호화(추후 작업)
    const joinToken = helper.changeUndefiendToNull(req.body.joinToken);                     //KAKAO, GOOGLE TOKEN
    const deviceTypeCode = helper.changeUndefiendToNull(req.body.deviceTypeCode);           //ANDROID, IOS
    const pushToken = helper.changeUndefiendToNull(req.body.pushToken);

    try {
        //회원가입(1:등록, 0:이미 존재, -1:실패)
        let returnModel = await userService.joinUser(email, joinTypeCode , 'N', password, joinToken , deviceTypeCode, pushToken);
        retVal = returnModel.retVal;

        //성공
        if (retVal == 1) {
            //세션 스토어가 이루어진 후 redirect를 해야함.
            req.session.save(function(){ 
                req.session.email = email;
                req.session.joinTypeCode = joinTypeCode;
                req.session.userGuid = returnModel.userGuid;
                req.session.authGroupCode = 'N';
                req.session.isLogined = true;
                req.session.valid = true;

                console.log('로그인 성공');
                return res.redirect('/');       
            });                
        }
        //실패 또는 이미 존재
        else{
            console.log('로그인 실패');
            return res.redirect('/login');
        }        
    }
    catch (err) {
        return res.status(500).json(err);
    }
};

//비밀번호 변경(POST) -- 구버전
exports.setPassword = async (req, res, next) => {
    let resModel;
    const userGuid = helper.getsessionValueOrRequsetValue(req.session.userGuid, req.body.userGuid);
    const password = helper.changeUndefiendToNull(req.body.password);
    //password = descryptoPassword(password); //복호화(추후 작업)

    //어떤 사용자인지 모르는 경우
    if (userGuid == null) {
        resModel = helper.createResponseModel(false, '사용자를 입력하셔야 합니다.', "");
        return res.status(200).json(resModel);
    }

    try {
        //비밀번호 변경(1:성공, -1:실패)
        let retVal = await userService.setPassword(userGuid, password);

        //성공
        if (retVal == 1) {
            resModel = helper.createResponseModel(true, '비밀번호 변경에 성공하셨습니다.', "");
        }
        //실패
        else{
            resModel = helper.createResponseModel(false, '비밀번호 변경에 실패하였습니다.', "");
        }

        return res.status(200).json(resModel);
    }
    catch (err) {
        return res.status(500).json(err);
    }
};

//비밀번호 변경(POST)
exports.changePassword = async (req, res, next) => {
    let resModel;
    const userGuid = helper.getsessionValueOrRequsetValue(req.session.userGuid, req.body.userGuid);
    const passwordBefore = helper.changeUndefiendToNull(req.body.passwordBefore);
    const passwordNew = helper.changeUndefiendToNull(req.body.passwordNew);
    //password = descryptoPassword(password); //복호화(추후 작업)

    //어떤 사용자인지 모르는 경우
    if (userGuid == null) {
        resModel = helper.createResponseModel(false, '사용자를 입력하셔야 합니다.', "");
        return res.status(200).json(resModel);
    }

    try {
        //비밀번호 변경(1:성공, -1:실패)
        let retVal = await userService.changePassword(userGuid, passwordBefore, passwordNew);

        //성공
        if (retVal == 1) {
            resModel = helper.createResponseModel(true, '비밀번호 변경에 성공하셨습니다.', "");
        }
        //기존 비밀번호 틀림
        else if(retVal == 0){
            resModel = helper.createResponseModel(false, '입력하신 비밀번호와 기존 비밀번호가 동일하지 않습니다.', "");
        }
        //실패
        else{
            resModel = helper.createResponseModel(false, '비밀번호 변경에 실패하였습니다.', "");
        }

        return res.status(200).json(resModel);
    }
    catch (err) {
        return res.status(500).json(err);
    }
};

//로그아웃(POST)
exports.setLogout = async (req, res, next) => {
    let resModel;

    try {        
        //세션 제거
        req.session.destroy(() => {
            res
            .clearCookie();
            resModel = helper.createResponseModel(true, '로그아웃에 성공하였습니다.', '');
            return res.status(200).json(resModel);            
        });                
    }
    catch (err) {
        resModel = helper.createResponseModel(false, '로그아웃에 실패하였습니다.', err);
        return res.status(500).json(resModel);
    }
};

//사용자 조회(POST)
exports.getUserCheck = async (req, res, next) => {
    let resModel;
    const email = req.body.email;
    const joinTypeCode = req.body.joinTypeCode == undefined ? 'N' : req.body.joinTypeCode;  //"N , K , G"
    const password = helper.changeUndefiendToNull(req.body.password);
    //password = descryptoPassword(password); //복호화(추후 작업)
    const joinToken = helper.changeUndefiendToNull(req.body.joinToken);                     //KAKAO, GOOGLE TOKEN
    const deviceTypeCode = helper.changeUndefiendToNull(req.body.deviceType);                   //ANDROID, IOS
    const pushToken = helper.changeUndefiendToNull(req.body.pushToken);
    
    try {
        //사용자 조회
        let user = await userService.getUser(null, email, null);
        
        if (user != null) {
            resModel = helper.createResponseModel(true, '아이디 존재 합니다.', user);
        } else {
            resModel = helper.createResponseModel(true, '아이디가 존재 하지 않습니다.', '');
        }
        return res.status(200).json(resModel);
    }
    catch (err) {
        return res.status(500).json(err);
    }
}; 

////////////////////////////////////////////////////
////////////////모바일 소셜 로그인///////////////////   
////////////////////////////////////////////////////



////////////////////////////////////////////////////
//////////////추후 위치 변경 또는 제거////////////////
////////////////////////////////////////////////////

//모바일 로그인(POST) 로그인 및 회원가입 한 번에  --> 추후 삭제 예정
exports.setMobileLogin = async (req, res, next) => {
    let resModel;
    const email = req.body.email;
    const joinTypeCode = req.body.joinTypeCode == undefined ? 'N' : req.body.joinTypeCode;  //"N , K , G"
    const password = helper.changeUndefiendToNull(req.body.password);
    //password = descryptoPassword(password); //복호화(추후 작업)
    const joinToken = helper.changeUndefiendToNull(req.body.joinToken);                     //KAKAO, GOOGLE TOKEN
    const deviceTypeCode = helper.changeUndefiendToNull(req.body.deviceType);                   //ANDROID, IOS
    const pushToken = helper.changeUndefiendToNull(req.body.pushToken);
    
    try {
        //사용자 조회
        let user = await userService.getUser(null, email, null);
        
        //로그인 실패한 경우
        if (user == null) {
            //회원가입(1:등록, 0:이미 존재, -1:실패)
            let retVal = await userService.joinUser(email, joinTypeCode , 'N', password, joinToken, deviceTypeCode, pushToken);            
            retVal = returnModel.retVal;

            //성공
            if (retVal == 1) {
                let userTemp = await userService.getUserForLogin(email, password, deviceTypeCode, pushToken);

                req.session.save(function(){ 
                    req.session.email = userTemp.EMAIL;
                    req.session.joinTypeCode = userTemp.JOIN_TYP_COD;
                    req.session.authGroupCode = userTemp.AUTH_GRP_COD;
                    req.session.userGuid = userTemp.USER_GUID;
                    req.session.isLogined = true;
                    req.session.valid = true;
    
                    resModel = helper.createResponseModel(true, '로그인 성공', userTemp);
                    return res.status(200).json(resModel);
                });
            }
            else{
                resModel = helper.createResponseModel(false, '로그인 실패', "");
                return res.status(200).json(resModel);
            }
        }
        //로그인 성공한 경우
        else {
            
            //세션 스토어가 이루어진 후 redirect를 해야함.
            req.session.save(function(){ 
                req.session.email = user.EMAIL;
                req.session.joinTypeCode = user.JOIN_TYP_COD;
                req.session.authGroupCode = user.AUTH_GRP_COD;
                req.session.userGuid = user.USER_GUID;
                req.session.isLogined = true;
                req.session.valid = true;                

                resModel = helper.createResponseModel(true, '로그인 성공', user);
                return res.status(200).json(resModel);
            });
        }
    }
    catch (err) {
        return res.status(500).json(err);
    }
}; 

////////////////////////////////////////////////////
///////////////분석 후 위치 변경 필요////////////////
////////////////////////////////////////////////////

exports.getAddress2 = async (req, res, next) => {
    let resModel;
    const latitude = req.body.latitude;
    const longitude = req.body.longitude;
    console.log("## latitude :: " + latitude);
    console.log("## longitude :: " + longitude);
    try {        
                
        const response = await axios({
            method: "GET",
            url: `https://dapi.kakao.com/v2/local/geo/coord2address.json?y=`+ latitude + '&x=' + longitude,
            headers: {
              Authorization: process.env.KAKAO_FIND_ADDR,
            },
          });
          

        console.log(response.data.documents); // * //
        console.log(response.data.documents.length); // * //

        var returnData = new Object();
        if(response.data.documents.length > 0){
            returnData.address = response.data.documents[0].address.address_name;
            returnData.latitude = latitude;
            returnData.longitude = longitude;
            resModel = helper.createResponseModel(true, '주소 정상 조회되었습니다.', returnData);
        }else{
            resModel = helper.createResponseModel(false, '주소 조회에 실패하였습니다.', '');
        }

        return res.status(200).json(resModel);                      
    }
    catch (err) {
        resModel = helper.createResponseModel(false, '로그아웃에 실패하였습니다.', err);
        return res.status(500).json(resModel);
    }
};
//TEST(주소 -> 위도,경도 변환)
exports.getAddress = async (req, res, next) => {
    let resModel;
    const address = req.body.address;
    console.log("## address :: " + address);
    try {        
        console.log(address);
        const encodedAddress = encodeURIComponent(address); // * //
        console.log(encodedAddress);
        
        const response = await axios({
            method: "GET",
            url: `https://dapi.kakao.com/v2/local/search/address.json?analyze_type=similar&query=${encodedAddress}`,
            headers: {
              Authorization: process.env.KAKAO_FIND_ADDR,
            },
          });
          

        console.log(response.data.documents); // * //
        console.log(response.data.documents.length); // * //

        var returnData = new Object();
        if(response.data.documents.length > 0){
            returnData.address = response.data.documents[0].address_name;
            returnData.latitude = response.data.documents[0].y;
            returnData.longitude = response.data.documents[0].x;
            resModel = helper.createResponseModel(true, '주소 정상 조회되었습니다.', returnData);
        }else{
            resModel = helper.createResponseModel(false, '주소 조회에 실패하였습니다.', '');
        }

        return res.status(200).json(resModel);                      
    }
    catch (err) {
        resModel = helper.createResponseModel(false, '로그아웃에 실패하였습니다.', err);
        return res.status(500).json(resModel);
    }
};

//TEST 다음 지도 띄우기
exports.daumAddress = async (req, res, next) => {
    try {
        return res.render('daum/findAddress', { title: 'Express', layout: false });      
    }
    catch (err) {
        return res.status(500).json(err);
    }
};

//TEST zip 파일 만들기
exports.testZip = async (req, res, next) => {
    console.log("## testZip");
    var folderNm = "imageTest";
    var images = ["1729701920999_라면.jpg" , "1729701941956_라면.jpg"];
    
    try {
        var createFolder = "../uploads/zip/" + folderNm;
        fs.mkdir(path.join(__dirname, '../uploads/zip', folderNm),{}, (err) => {
            // zip.file(createFolder+'/common.js', path.join(__dirname, '..', 'common.js'));
            // var data = zip.generate({base64:false, compression:'DEFLATE'});
            // fs.writeFileSync(folderNm+'.zip', data, 'binary');
            
            if (err) throw err;
        });

        

        return res.status(200).json("");                      
    }
    catch (err) {
        return res.status(500).json(err);
    }
};

//TEST(파일 업로드 / mutipart)
exports.setFileUpload = async (req, res, next) => {

    //파일타입이 올바르지 않은 경우
    if(req.fileValidationError != undefined){
        console.log(req.fileValidationError);
    }

    console.log(req.file)// 업로드 파일 정보
    console.log(req.body)// 요청 데이터
    res.send("ok")
}