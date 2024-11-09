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
    if (!(document.getElementById("passwordBefore").validity.valid) &&
      (document.getElementById("passwordNew").validity.valid) &&
      (document.getElementById("passwordNewConfirm").validity.valid)) {
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
  alert('개발중입니다');
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