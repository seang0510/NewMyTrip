//반응형 제거
$(document).ready(function () {
  $("body").css('min-width', '1200px');

  //로그인
  $("body #loginRow").removeClass('g-lg-5');
  $("body #loginRow").css('flex-wrap', 'nowrap');
  $("body #loginImage").removeClass('col-lg-7');
  $("body #loginImage").css('width', '631px');
  $("body #loginImage img").css('width', '100%');
  $("body #loginForm").removeClass('col-md-10 col-lg-5');
  $("body #loginForm").css('width', '400px');  

  //메인보드
  $("body nav button:nth-child(1)").css('display', 'none');
  $("body nav #navbarNavDropdown").css('display', '');
  $("body nav #aNotice").css('margin-left', 'auto');

  $("a.navbar-right-none").css('display', '');
  $("button.navbar-right-none").css('display', '');

  $("body #sidebar-container").removeClass('d-none');
  $("body #footer").css('min-width', '1200px');
});