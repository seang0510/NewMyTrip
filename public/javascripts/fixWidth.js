//반응형 제거
$(document).ready(function () {
  //공용
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
  $("body").css('padding-top', '0');
  $("body nav").removeClass('fixed-top navbar-expand-md');
  $("body nav button:nth-child(1)").css('display', 'none');
  $("body nav #navbarNavDropdown").css('display', '');
  $("body nav a.navbar-right-none").css('margin-left', 'auto');

  $("a.navbar-right-none").css('display', '');
  $("button.navbar-right-none").css('display', '');

  $("body #sidebar-container").removeClass('d-none');
  $("body #sidebar-container").css('min-height', '100vh');

  $("body #body-row").removeClass('row');
  $("body #body-row").css('flex-wrap', 'nowrap');
  $("body #body-row").css('display', 'flex');  
  $("body #body-row ul").removeClass('sticky-top sticky-offset');
});