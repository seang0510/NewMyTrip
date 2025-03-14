//Controller -> ejs로 JSON 반환 모델
function createResponseModel(isSuccess, message, data, columnNames){
    const resModel = {
        success : isSuccess,
        message : message,
        value: data,
        columnNames: columnNames,
    };
    return resModel;
};

//UUID 생성기
function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if(d > 0){//Use timestamp until depleted
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
};

function setMessageForCookie(title, text){
    var msg = {
        title : title,
        text : text,
    };
    return JSON.stringify(msg);
};

function changeUndefiendToNull(value){
    if(value == undefined || value == '' || value == null){
        return null;
    }
    else{
        return value;
    }
};

function changeUndefiendToZero(value){
    if(value == undefined || value == '' || value == null){
        return 0;
    }
    else{
        return value;
    }
};

function changeUndefiendToEmpty(value){
    if(value == undefined || value == '' || value == null){
        return '';
    }
    else{
        return value;
    }
};

//Session Value가 존재하는 경우, Session Value 설정, 없는 경우는 Request Value 설정
function getsessionValueOrRequsetValue(sessionValue, requestValue){
    if (!(sessionValue == undefined || sessionValue == null || sessionValue == '')) {
        return changeUndefiendToNull(sessionValue);
    }
    else {
        return changeUndefiendToNull(requestValue);
    }
};

//날짜 포맷
function dateFormat(date) {
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hour = date.getHours();
    let minute = date.getMinutes();
    let second = date.getSeconds();

    month = month >= 10 ? month : '0' + month;
    day = day >= 10 ? day : '0' + day;
    hour = hour >= 10 ? hour : '0' + hour;
    minute = minute >= 10 ? minute : '0' + minute;
    second = second >= 10 ? second : '0' + second;

    return date.getFullYear() + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
};

function dayFormat(date) {
    let month = date.getMonth() + 1;
    let day = date.getDate();

    month = month >= 10 ? month : '0' + month;
    day = day >= 10 ? day : '0' + day;

    return date.getFullYear() + '-' + month + '-' + day;
};

//세션 존재유무 확인
function existSessoin(sessionValue){
    if (!(sessionValue == undefined || sessionValue == null || sessionValue == '')) {
        return true;
    }
    else {
        return false;
    }
};

//컬럼명 배열로 반환
function getColumnNames(fields){
    let arrColNames = [];
    for (var i = 0; i < fields.length; i++) {
        arrColNames.push(fields[i].name);
    }   
    return arrColNames;
};

//SHA512 암호화
function createHashPassword(password, type){
    const crypto = require('crypto');
    var hashPassword = crypto.createHash(type).update(password).digest("base64");
    return hashPassword;
};

//임시 비밀번호 제작
function createRandomPassword(lenth) {
    let text = '';
    const possible =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`{}[]:;<>?,./|';
    for (let i = 0; i < lenth; i++)
        text += possible.charAt(
            Math.floor(Math.random() * possible.length),
        );
    return text;
};

module.exports = {
    createResponseModel,
    generateUUID,
    setMessageForCookie,
    changeUndefiendToNull,
    changeUndefiendToZero,
    changeUndefiendToEmpty,
    getsessionValueOrRequsetValue,
    dateFormat,
    dayFormat,
    existSessoin,
    getColumnNames,
    createHashPassword,
    createRandomPassword,
};