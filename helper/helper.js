//Controller -> ejs로 JSON 반환 모델
function createResponseModel(isSuccess, message, data){
    const resModel = {
        success : isSuccess,
        message : message,
        value: data
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
    if(value == undefined){
        return null;
    }
    else{
        return value;
    }
};

module.exports = {
    createResponseModel,
    generateUUID,
    setMessageForCookie,
    changeUndefiendToNull,
};