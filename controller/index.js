const userService = require('../service/user');
const helper = require('../helper/helper');

//로그인(GET)
exports.getLogin = async (req, res, next) => {
    try {
        //로그인 되지 않은 경우
        if(!(req.session.valid == true)){
            return res.render('main/login', { title: 'Express', layout: false });
        }
        //현재 로그인 되어 있는 경우    
        else{
            return res.redirect('/');
        }        
    }
    catch (err) {
        return res.status(500).json(err);
    }
};


//로그인(POST)
exports.setMobileLogin = async (req, res, next) => {
    let resModel;
    const email = req.body.email;
    const password = req.body.password;
    const joinTyp = req.body.joinTyp;       //"N , K , G"
    const deviceType = req.body.deviceType; //ANDROID , IOS
    const pushToken = req.body.pushToken;   
    const joinToken = req.body.joinToken;   //KAKAO , GOOGLE TOEKN
    
    try {
        //사용자 조회
        let user = await userService.getUserForLogin(email, password, joinTyp, deviceType, pushToken);
        
        //로그인 실패한 경우
        if (user == null) {
            let retVal = await userService.createUserForSignUp(email, password , deviceType, joinTyp , joinToken); //1:등록, 0:이미 존재, -1:실패
            let resModel;

            //성공
            if (retVal == 1) {
                let userTemp = await userService.getUserForLogin(email, password, joinTyp, deviceType, pushToken);

                req.session.save(function(){ 
                    req.session.email = userTemp.EMAIL;
                    req.session.authGroupCode = userTemp.AUTH_GRP_COD;
                    req.session.isLogined = true;
                    req.session.valid = true;
    
                    resModel = helper.createResponseModel(true, '로그인 성공', userTemp);
                    return res.status(200).json(resModel);
                });
            }else{
                resModel = helper.createResponseModel(false, '로그인 실패하였습니다.', "");
                return res.status(200).json(resModel);
            }
        }
        //로그인 성공한 경우
        else {
            
            //세션 스토어가 이루어진 후 redirect를 해야함.
            req.session.save(function(){ 
                req.session.email = user.EMAIL;
                req.session.authGroupCode = user.AUTH_GRP_COD;
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

//로그인(POST)
exports.setLogin = async (req, res, next) => {
    let resModel;
    const email = req.body.email;
    const password = req.body.password;
    //validateParam(userEmail); //입력받은 값이 빈칸인 경우 체크 Try~Catch로
    //userEmail = XSSFilter(userEmail); //XSS필터 적용        

    try {
        //사용자 조회
        let user = await userService.getUserForLogin(email, password);

        //로그인 실패한 경우
        if (user == null) {
            resModel = helper.createResponseModel(false, '올바르지 않은 이메일 및 비밀번호입니다.', null);
            return res.status(200).json(resModel);
        }
        //로그인 성공한 경우
        else {
            //세션 스토어가 이루어진 후 redirect를 해야함.
            req.session.save(function(){ 
                req.session.email = user.EMAIL;
                req.session.authGroupCode = user.AUTH_GRP_COD;
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

//이메일로 패스워드 조회
exports.getPasswordByEmail = async (req, res, next) => {
    let resModel;
    const userEmail = req.query.email;

    //validateParam(userEmail); //입력받은 값이 빈칸인 경우 체크 Try~Catch로
    //userEmail = XSSFilter(userEmail); //XSS필터 적용        

    try {
        let password = await userService.getPasswordByEmail(userEmail);

        if (password == null) {
            resModel = helper.createResponseModel(false, '존재하지 않는 이메일입니다.', null);
        }
        else {
            //password = encryptPassword(password); //암호화 필요
            resModel = helper.createResponseModel(true, '비밀번호는 ' + password + ' 입니다.', null);
        }

        return res.status(200).json(resModel);
    }
    catch (err) {
        return res.status(500).json(err);
    }
};

//회원가입(POST)
exports.setSignUp = async (req, res, next) => {
    const userEmail = req.body.email;
    const userPassword = req.body.password;
    const deviceType = req.body.deviceType;
    const joinType = req.body.joinType;
    const joinToken = req.body.joinToken;
    //validateParam(userEmail, userPassword); //입력받은 값이 빈칸인 경우 체크 Try~Catch로
    //userEmail = XSSFilter(userEmail, userPassword); //XSS필터 적용        

    try {
        let retVal = await userService.createUserForSignUp(userEmail, userPassword , deviceType, joinType , joinToken); //1:등록, 0:이미 존재, -1:실패
        let resModel;

        console.log("retVal :: " + retVal);
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
            return res.render('main/index', { title: 'Express', userEmail: email, authCode: authGroupCode });
        }        
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
            resModel = helper.createResponseModel(true, '로그아웃에 성공하였습니다.', null);
            return res.status(200).json(resModel);            
        });                
    }
    catch (err) {
        resModel = helper.createResponseModel(false, '로그아웃에 실패하였습니다.', err);
        return res.status(500).json(resModel);
    }
};