//jQuery-ContextMenu (Layout)
$(function () {
  $.contextMenu({
    selector: '.context-menu-layout',
    trigger: 'left',
    callback: function (key, opt, e) {
      switch (key) {
        case "changePassword":
          openChangePassword(this, e);
          break;
        case "info":
          info(this, e);
          break;
        case "connectKakaoChaneel":
          connectKakaoChaneel(this, e);
          break;            
        case "deleteMyself":
          deleteMyself(this, e);
          break;                              
        case "logout":
          logout(this, e);
          break;
        case "email":
          break;
        default:
          var m = "clicked: " + key;
          window.console && console.log(m) || alert(m);
          break;
      }
    },
    items: {
      email: { name: userEmail, },
      sep1: "---------",
      changePassword: { name: "비밀번호 변경", icon: "fa-key" },
      info: { name: "약관", icon: "fa-info" },
      connectKakaoChaneel: { name: "문의: 카카오채널 연결", icon: "fa-plug" },
      deleteMyself: { name: "회원탈퇴", icon: "fa-times-circle" },
      sep2: "---------",
      logout: { name: "로그아웃", icon: "fa-sign-out" },
    }
  });
});

//비밀번호 변경
function openChangePassword(eThis, e){
  $("#modalChangePassword").modal('show');
};

//비밀번호 변경 저장
function changePassword(e){
    //HTML5 기본 Validation
    if (!((document.getElementById("passwordBefore").validity.valid) &&
      (document.getElementById("passwordNew").validity.valid) &&
      (document.getElementById("passwordNewConfirm").validity.valid))) {
      return false;
    }

    e.preventDefault(); //HTML5 기본 validation 밑에 위치 필수

    var data = { 
      'passwordBefore': $("#passwordBefore").val(),
      'passwordNew': $("#passwordNew").val(),
    };

    $.ajax({
      url: '/changePassword',
      method: 'POST',
      data: data,
      beforeSend: function (xhr) {
        setLoadingBar(true, 'modalChangePassword');
        $("#modalAlert .modal-title").html("비밀번호 변경");
      },
      success: function (data, status, xhr) {
        var message = data.message;
        $("#modalAlert .modal-body").html(message);
      },
      error: function (data, status, err) {
        $("#modalAlert .modal-body").html(err);
      },
      complete: function () {
        setLoadingBar(false, 'modalChangePassword');
        $("#modalChangePassword").modal('hide');
        $("#modalAlert").modal('show');
      }
    });    
};

//약관
function info(eThis, e){
  $("#modalPersonalInformation").modal('show');
};

//카카오채널 연결
function connectKakaoChaneel(eThis, e){
  var width = '700';
  var height ='800';
  
  //팝업을 가운데 위치시키기 위해 아래와 같이 값 구하기
  var left = Math.ceil((window.screen.width - width) / 2);
  var top = Math.ceil((window.screen.height - height) / 2);
  var url = 'https://pf.kakao.com/_QtYRn';

  window.open(url, '카카오 채널 연결', 'width='+ width +', height='+ height +', left=' + left + ', top='+ top + ',scrollbars=yes');  
};

//계정 삭제
function deleteMyself(eThis, e) {
  let message = '<p>계정을 삭제하시겠습니까?</p>';
  message += '<p>등록한 전체 데이터는 삭제되며 복구가 불가능합니다.';
  message += '<p>다시 한 번 확인해주시기 바랍니다.</p>';

  confirmModal(e, 'modalConfirm', '계정 삭제', message, function () {
    $.ajax({
      url: '/system/user/deleteUser',
      method: 'POST',
      beforeSend: function (xhr) {
        setLoadingBar(true);
      },
      success: function (data, status, xhr) {
        if(data.success){
          e.preventDefault();
          location.href = '/login';
        }
        else{
          $("#modalAlert .modal-title").html("계정삭제 실패");
          $("#modalAlert .modal-body").html(data.message);
          $("#modalAlert").modal('show');
        }
      },
      error: function (data, status, err) {
        $("#modalAlert .modal-title").html("계정삭제 오류");
        $("#modalAlert .modal-body").html(err);
        $("#modalAlert").modal('show');
      },
      complete: function () {
        $("#modalConfirm").modal('hide');
        setLoadingBar(false);
      }
    });
  });
};

//로그아웃
function logout(eThis, e) {
  confirmModal(e, 'modalConfirm', '로그아웃', '로그아웃 하시겠습니까?', function () {
    $.ajax({
      url: '/logout',
      method: 'POST',
      beforeSend: function (xhr) {
        setLoadingBar(true);
      },
      success: function (data, status, xhr) {
        e.preventDefault();
        location.href = '/login';
      },
      error: function (data, status, err) {
        $("#modalAlert .modal-title").html("로그아웃 오류");
        $("#modalAlert .modal-body").html(err);
        $("#modalAlert").modal('show');
      },
      complete: function () {
        $("#modalConfirm").modal('hide');
        setLoadingBar(false);
      }
    });
  });
};

//jQuery-ContextMenu (모두의 출장:엑셀 다운로드, 첨부파일 다운로드)
$(function () {
  $.contextMenu({
    selector: '.context-menu-tripDetail',
    trigger: 'left',
    callback: function (key, opt, e) {
      switch (key) {
        case "exportExcel":
          exportExcel(this, e);
          break;
        case "exportImage":
          exportImage(this, e);
          break;
        default:
          var m = "clicked: " + key;
          window.console && console.log(m) || alert(m);
          break;
      }
    },
    items: {
      exportExcel: {
        name: '엑셀 내보내기',
        icon: function(opt, $itemElement, itemKey, item){
          $itemElement.html('<img src="/images/download.png"><span>' + item.name + '</span>');
          return 'context-menu-icon-updated';
        }
      },
      exportImage: {
        name: "사진 내보내기",
        icon: function(opt, $itemElement, itemKey, item){
          $itemElement.html('<img src="/images/download.png"><span>' + item.name + '</span>');
          return 'context-menu-icon-updated';
        }
      },
    }
  });
});