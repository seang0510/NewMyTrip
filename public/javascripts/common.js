//공용 초기 이벤트
$(document).ready(function () {
  //Bootstrap5 유효성 검사
  (() => {
    'use strict'

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation')

    // Loop over them and prevent submission
    Array.from(forms).forEach(form => {
      form.addEventListener('submit', event => {
        if (!form.checkValidity()) {
          event.preventDefault()
          event.stopPropagation()
        }

        form.classList.add('was-validated')
      }, false)
    })
  })();

  //Modal폼 닫을 때, FORM 내부 Clear
  $('.modal').on('hidden.bs.modal', function (e) {
    $(this).find('form').each(function () {
      this.reset();
    });
    //Form의 Validation Check 클래스 제거
    $(this).find('form').removeClass('was-validated');
  });
});

//엔터키 입력 시, targetId의 Click 이벤트 발생
function enterKey(event, targetId) {
  if (event.keyCode == 13) {
    $("#" + targetId).click();
  }
};

//로딩바 ON/OFF (특정 elemetId가 오면 해당 ID만 ON/OFF, 없는 경우는 전체)
function setLoadingBar(isOn, elemId) {
  if (isOn == true) {
    if (typeof elemId == 'undefined' || elemId == null || elemId == '') {
      $(".loadingBar:first").css('display', '');
    }
    else {
      $("#" + elemId + " .loadingBar:first").css('display', '');
    }
  }
  else {
    if (typeof elemId == 'undefined' || elemId == null || elemId == '') {
      $(".loadingBar:first").css('display', 'none');
    }
    else {
      $("#" + elemId + " .loadingBar:first").css('display', 'none');
    }
  }
};

//입력받은 파라미터가 동일하지 확인
function isEqualValue(elemId1, elemId2) {
  var value1 = $("#" + elemId1).val();
  var value2 = $("#" + elemId2).val();

  if (value1 == value2) {
    return true;
  }
  else {
    return false;
  }
};

//입력한 Element가 포함된 Form Submit
function confirmModal(e, modalId, title, text, callback, callbackCancel) {  
  e.preventDefault();
  modalConfirm(modalId, title, text, function (confirm) {
    if (confirm) {
      callback();
    }
    else{
      if (callbackCancel !== undefined) {
        callbackCancel();
      }
    }
  });
};

//Confirm 모달
function modalConfirm(id, title, html, callback) {
  if (!(title == null || title == '' || typeof(title) === undefined)) {
    $("#" + id + " .modal-title").text(title);
  }
  if (!(html == null || html == '' || typeof(html) === undefined)) {
    $("#" + id + " .modal-body").html(html);
  }
  $("#" + id).modal("show");
  $("#" + id + " #btnConfirmY").unbind("click");
  $("#" + id + " #btnConfirmY").on("click", function () {
    callback(true);
  });
  $("#" + id + " #btnConfirmN").unbind("click");
  $("#" + id + " #btnConfirmN").on("click", function () {
    callback(false);
  });
};

//쿠키에 Message가 있는 경우 Modal로 표시
function showMessageByCookie(modalId, key){
  //쿠키 가져오기
  var msg = $.cookie(key);
  
  if(!(typeof(msg) === 'undefined')){
    var msg = JSON.parse(msg);
    $("#" + modalId + " .modal-title").text(msg.title);
    $("#" + modalId + " .modal-body").text(msg.text);
    $("#" + modalId).modal('show');     
  }

  //쿠키 제거
  $.removeCookie(key);     
};

//body에 Form붙이고 Submit
function submitForm(method, action){
  var form = $('<form></form>'); 
  form.attr("method", method);
  form.attr("action", action);
  form.appendTo('body');
  form.submit();
};

//Object List에서 keyName과 key만 가져오기
function getValueList(rows, keyName){
  let newArr = [];

  for (i = 0; i < rows.length; i++) {
    let value = rows[i][keyName];
    newArr.push(value);
  }

  return newArr;
};

//입력받은 2개 비밀번호가 동일한지 확인
function passwordEqual(orgPassword, confirmPassword) {
  if (!isEqualValue(orgPassword, confirmPassword)) {
    $("#" + orgPassword).closest('form').addClass('was-validated');
    document.getElementById(confirmPassword).setCustomValidity('invalid');
  }
  else {
    document.getElementById(confirmPassword).setCustomValidity('');
  }
};

function dateFormat(date, isDateTime) {
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

  if(isDateTime){
    return date.getFullYear() + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
  }
  else{
    return date.getFullYear() + '-' + month + '-' + day;
  }  
};

//undefiend 및 null 체크
function isEmpty(value){
  if(typeof value == 'undefiend' || value == null || value == ''){
    return true;
  }
  else{
    return false;
  }
};

//DataTable.js에서 특정 조건에 맞는 Row 찾기
const searchFunction = function(dictSearch) {
  return function( idx, data, node ) {
      const keys = Object.keys( dictSearch );
      const n = keys.length;
      let k = 0;
      for (let i = 0; i <= keys.length; i++) {
          //intrinsically checks if the key exists
          if ( data[keys[i]] === dictSearch[keys[i]] ) {
              k++;
          } else {
              return false;
          }
          if (n === k) {
              return true;
          }
      }
      return false;
  }
};

//Window Open 화면
function openWindowPopup(title, url){
  var width = '1000';
  var height ='800';
  
  //팝업을 가운데 위치시키기 위해 아래와 같이 값 구하기
  var left = Math.ceil((window.screen.width - width) / 2);
  var top = Math.ceil((window.screen.height - height) / 2);

  window.open(url, title, 'width='+ width +', height='+ height +', left=' + left + ', top='+ top + ',scrollbars=yes');
};