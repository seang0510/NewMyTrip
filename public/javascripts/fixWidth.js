//반응형 제거
$(document).ready(function () {
  $("body").css('min-width', '1200px');

  //메인보드
  $("body nav button:nth-child(1)").css('display', 'none');
  $("body nav #navbarNavDropdown").css('display', '');
  $("body nav #aNotice").css('margin-left', 'auto');

  $("a.navbar-right-none").css('display', '');
  $("button.navbar-right-none").css('display', '');

  $("body #sidebar-container").removeClass('d-none');
  //$("body #footer").css('min-width', '1200px');

  //숨김 버튼
  $(".navbar-toggler").css('display','none');
});