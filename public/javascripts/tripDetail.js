  //상세 등록,수정창 초기화
  function InitModalTripDetail(){
    $("#tripDetailGuid").val('');
    $("#facilityName").val('');    
    $("#address").val('');    
    $("#addressDetail").val('');    
    $("#latitude").val('');    
    $("#longitude").val('');          

    //가변항목 제거
    $("#tripDetailForm").find(".dynamic-item").remove();
    //확인버튼 표시
    $("#btnConfirm").addClass('visually-hidden');

    //편집모드 제거 및 저장버튼 표시
    isReadStatus = true;
    editModalTripDetail(null, null);
    $("#btnEdit").addClass('visually-hidden');
    $("#btnSave").removeClass('visually-hidden');
  };
  
  //수정/보기 화면 변경
  function editModalTripDetail(eThis, e){
    isReadStatus = !isReadStatus;

    //읽기 모드
    if(isReadStatus){
      $("#btnEdit").text('편집');
      $("#btnEdit").removeClass('visually-hidden');
      $("#btnConfirm").removeClass('visually-hidden');
      $("#btnSave").addClass('visually-hidden');

      $('.edit-mode').addClass('hide');
      $('.read-mode').removeClass('hide');

      //등록,수정의 Input 값을 Label에 넣기
      $("#tripDetailForm").find('input[type="text"]').each(function(idx, el){        
        var value = $(el).val();
        $(el).siblings('label.form-control').text(value);        
      });
    }
    //편집 모드
    else{
      $("#btnEdit").text('보기');
      $("#btnEdit").removeClass('visually-hidden');
      $("#btnConfirm").addClass('visually-hidden');
      $("#btnSave").removeClass('visually-hidden');

      $('.edit-mode').removeClass('hide');
      $('.read-mode').addClass('hide');
    }
  };

  //개별 조회
  function getItem(tripDetailGuid){      
    $.ajax({
        url: '/business/trip/getTripDetail',
        method: 'post',
        data: {
          tripDetailGuid: tripDetailGuid,
          tripGuid: $("#tripGuid").val(),
        },
        beforeSend: function (xhr) {
          setLoadingBar(true);
          $("#modalAlert .modal-title").html("출장 상세");
          InitModalTripDetail();
        },        
        success: function(data){           
          if(data.success){            
            if(!(isEmpty(data) || isEmpty(data.value))){
              //이미지 슬라이드 초기화
              $("#carouselOuter .carousel-inner").empty();
              //이미지 연결
              if(!isEmpty(data.value.IMGS)){
                var tripDetailImages = data.value.IMGS;

                for(var i = 0; i < tripDetailImages.length;i++){
                  var imgGuid = tripDetailImages[i].TRIP_DTL_IMG_GUID;
                  var imgUrl = tripDetailImages[i].URL_PATH;  
                  if(!isEmpty(imgGuid)){
                    var imgHtmlCode = createCarouselItemCode(imgGuid, imgUrl);
                    $("#carouselOuter .carousel-inner").append(imgHtmlCode);
                    $("#carouselOuter .carousel-inner .carousel-item:first").addClass('active');
                  }              
                }
              }
              else{
                var imgHtmlCode = createCarouselItemCode('', '');
                $("#carouselOuter .carousel-inner").append(imgHtmlCode);     
                $("#carouselOuter .carousel-inner .carousel-item:first").addClass('active');           
              }

              //입력 항목
              $("#tripDetailGuid").val(tripDetailGuid);
              $("#facilityName").val(data.value.FCLT_NM);
              $("#address").val(data.value.ADDR);
              $("#addressDetail").val(data.value.ADDR_DTL);
              $("#latitude").val(data.value.LAT);
              $("#longitude").val(data.value.LNG); 
              $("#compYn").val(data.value.COMP_YN); 

              //확인버튼 표시
              $("#btnConfirm").removeClass('visually-hidden');

              if(data.value.COMP_YN == 'Y'){
                $("#btnConfirm").text('확인취소');
              }
              else{
                $("#btnConfirm").text('확인');
              }             
              
              //항목 연결
              if(data.value.ITMS != null){
                var tripDetailItems = data.value.ITMS;
                for(var i = 0; i < tripDetailItems.length;i++){
                  var itemName = tripDetailItems[i].ITM_NM;
                  var itemValue = isEmpty(tripDetailItems[i].ITM_VAL) ? '' : tripDetailItems[i].ITM_VAL;

                  //가변컬럼 HTML 그리기
                  var htmlCode = getItemHtmlCode(itemName, itemValue);                  
                  $("#tripDetailForm").append(htmlCode);
                }
              }          

              //편집모드 및 저장버튼 미표시
              isReadStatus = false;
              editModalTripDetail(null, null);        

              $("#modalTripDetail").modal('show');
            }
          }  
          else{
            var message = data.message;
            $("#modalAlert .modal-body").html(message);
          }  
        },
        complete: function(data){
          setLoadingBar(false);          
        },        
      });    
  };
  
  //가변 항목 바인딩
  function getItemHtmlCode(itemName, itemValue){
    var htmlCode = '';
    htmlCode += '<div class="input-group mb-3 dynamic-item">';
    htmlCode += '<span class="input-group-text"><i class="fa fa-cog"></i></span>';
    htmlCode += '<div class="form-floating has-validation">';
    htmlCode += '<input type="text" id="' + itemName + '" class="form-control edit-mode" placeholder="' + itemName + '" value="' + itemValue + '">';
    htmlCode += '<label class="form-control read-label read-mode hide"></label>';
    htmlCode += '<label for="' + itemName + '">' + itemName + '</label>';
    htmlCode += '</div>';
    htmlCode += '</div>';
    return htmlCode;
  };

  //이미지 바인딩
  function createCarouselItemCode(imgGuid, imgUrl){
    var htmlCode = "";

    if(imgGuid != ''){
      htmlCode += "<div class='carousel-item'>";
      htmlCode += "<img data-guid = '" + imgGuid + "' src='" + imgUrl + "' class='d-block w-100' onerror=this.src='/images/no_image.png'>";
      htmlCode += "<div>";
      htmlCode += "<button class='btn btn-sm btn-danger' onclick='deleteDetailImgae(this, event);'><i class='fa fa-times'></i></button>";
      htmlCode += "</div>";        
    }
    else{
      htmlCode += "<div class='carousel-item'>";
      htmlCode += "<img class='no-img' data-guid = '' src='' class='d-block w-100' onerror=this.src='/images/no_image.png'>";
    }

    htmlCode += "</div>";       
    return htmlCode;
  };

  //이미지 개별삭제
  function deleteDetailImgae(eThis, e){
    e.preventDefault();

    //이전 모달 z-index 변경
    $("#modalTripDetail").css('z-index', 1050);

    var tripDetailImageGuid = $(eThis).closest('div.carousel-item').find('img').data('guid');
    var tripDetailGuid = $("#tripDetailGuid").val()
    var data = {
      'tripDetailImageGuid': tripDetailImageGuid,
      'tripDetailGuid': tripDetailGuid,
    };

    confirmModal(e, 'modalConfirm', '모두의 출장 상세 이미지', '선택한 이미지를 삭제 하시겠습니까?', function () {   
      $.ajax({
        url: '/business/trip/deleteTripDetailImages',
        method: 'POST',
        data: data,
        beforeSend: function (xhr) {
          setLoadingBar(true);
          $("#modalConfirm").modal('hide');
          $("#modalAlert .modal-title").html("모두의 출장 상세 이미지");
        },
        success: function (data, status, xhr) {
          if(data.success){
            $("#modalAlert .modal-body").html('삭제되었습니다.');
            $("#modalAlert").modal('show');

            getItem(tripDetailGuid);
          }  
          else{
            var message = data.message;
            $("#modalAlert .modal-body").html(message);
            $("#modalAlert").modal('show');
          }  
        },
        error: function (data, status, err) {
          $("#modalAlert .modal-body").html(err);
          $("#modalAlert").modal('show');
        },
        complete: function () {
          setLoadingBar(false);

          //이전 모달 z-index 변경
          $('#modalAlert').on('hidden.bs.modal', function (e) {
            $("#modalTripDetail").css('z-index', 1055);
            $("#modalAlert").off('hidden.bs.modal');
          });       

          InitDataTableJS('tblMain', '/business/trip/getTripDetailList');  
        }
      });   
    }, function(){
      //이전 모달 z-index 변경
      $('#modalConfirm').on('hidden.bs.modal', function (e) {
        $("#modalTripDetail").css('z-index', 1055);
        $("#modalConfirm").off('hidden.bs.modal');
      });          
    });    
  };

  //아이템 항목 그리드
  function DataTableForItems(tblId, data){
    var table = new DataTable('#' + tblId, {
      columns: [
        {title: '항목', name: 'itemName', data : "itemName", width: '80px' },
        {title: '내용', name: 'itemValue', data : "itemValue", width: 'auto'},   
      ],
      columnDefs: [
        { targets: "_all", className: "header" },
        { targets: ['itemName:name', 'itemValue:name'], className: "row-left-align align-middle" },
      ],
      data: data,
      language : getLanguage(),
      paging: false,
      lengthChange: true,
      searching: false,
      ordering: false,
      info: false,   
      fixedColumns: true,
      scrollX: false,
      scrollY: '200px',
      //responsive: false,
      scrollCollapse: true,
      autoWidth: true,
      destroy: true,
      layout: {
        topStart: null,
        topEnd: null,
      },
    });

    return table;
  };

  //아이템 기본 모델
  function getDefaultItem(itemName, itemValue){
    var defItem = {
      itemName: "<span class='item-name'>" + itemName + "</span>",
      itemValue: "<input type=text class='item-value form-control w-100' placeholder='내용을 입력하세요.' value='" + itemValue + "' />",
    };
    return defItem;
  };
  
  //신규 등록
  function createItem(){
    InitModalTripDetail();

    //이미지 슬라이드 초기화 및 기본 이미지 추가
    $("#carouselOuter .carousel-inner").empty();

    var imgHtmlCode = createCarouselItemCode('', '');
    $("#carouselOuter .carousel-inner").append(imgHtmlCode);
    $("#carouselOuter .carousel-inner .carousel-item:first").addClass('active');

    //아이템 리스트 설정
    var itemNameList = JSON.parse($("#itemNameList").val());

    for(var i = 0; i < itemNameList.length;i++){
      //가변컬럼 HTML 그리기
      var itemName = itemNameList[i];
      var htmlCode = getItemHtmlCode(itemName, '');                  
      $("#tripDetailForm").append(htmlCode);       
    }

    $("#modalTripDetail").modal('show');
  };

  //저장
  function saveTripDetail(eThis, e, url){
    //HTML5 기본 Validation
    if (!((document.getElementById("facilityName").validity.valid) &&
      (document.getElementById("address").validity.valid))) {
      return false;
    }

    e.preventDefault();

    var tripDetailItems = [];
    $("#tripDetailForm").find('.dynamic-item').each(function (idx, el){
      var itemName = $(el).find('input').attr('id');
      var itemValue = $(el).find('input').val();

      tripDetailItems.push({
        itemName: itemName,
        itemValue: itemValue,
      });      
    });

    var data = {
      tripDetailGuid: $("#tripDetailGuid").val(),
      tripGuid: $("#tripGuid").val(),
      facilityName: $("#facilityName").val(),
      address: $("#address").val(),
      addressDetail: $("#address").val().trim() == '' ? '' : $("#addressDetail").val().trim(),
      latitude: $("#address").val().trim() == '' ? '' : $("#latitude").val(),
      longitude: $("#address").val().trim() == '' ? '' : $("#longitude").val(),
      tripDetailItems: tripDetailItems,
    };

    $.ajax({
        url: '/business/trip/setTripDetail',
        method: 'POST',
        data: JSON.stringify(data),
        datatype: "JSON",
        contentType: 'application/json; charset=utf-8',
        beforeSend: function (xhr) {
          setLoadingBar(true, 'modalTripDetail');
          $("#modalTripDetail").modal('hide');
          $("#modalAlert .modal-title").html("출장 상세");
        },
        success: function (data, status, xhr) {
          if(data.success){            
            location.href = url + '?tripGuid=' + $("#tripGuid").val() + '&tripDetailGuid=' + $("#tripDetailGuid").val();
          }
          else{
            var message = data.message;
            $("#modalAlert .modal-body").html(message);
            $("#modalAlert").modal('show');
          }
        },
        error: function (data, status, err) {
          $("#modalAlert .modal-body").html(err);
          $("#modalAlert").modal('show');
        },
        complete: function () {
          setLoadingBar(false, 'modalTripDetail');
        }
      }); 
  };

  //완료 및 완료취소
  function confirmTripDetail(eThis, e, url){
    //HTML5 기본 Validation
    if (!((document.getElementById("facilityName").validity.valid) &&
      (document.getElementById("address").validity.valid))) {
      return false;
    }

    e.preventDefault();    

    var compYn = $("#btnConfirm").text() == '확인' ? 'Y' : 'N';
    var data = {
      tripDetailGuid: $("#tripDetailGuid").val(),
      compYn: compYn,
    };

    $.ajax({
        url: '/business/trip/setTripDetailCompYN',
        method: 'POST',
        data: JSON.stringify(data),
        datatype: "JSON",
        contentType: 'application/json; charset=utf-8',
        beforeSend: function (xhr) {
          setLoadingBar(true, 'modalTripDetail');
          $("#modalTripDetail").modal('hide');
          $("#modalAlert .modal-title").html("출장 상세 확인");
        },
        success: function (data, status, xhr) {
          if(data.success){            
            location.href = url + '?tripGuid=' + $("#tripGuid").val() + '&tripDetailGuid=' + $("#tripDetailGuid").val();
          }
          else{
            var message = data.message;
            $("#modalAlert .modal-body").html(message);
            $("#modalAlert").modal('show');
          }
        },
        error: function (data, status, err) {
          $("#modalAlert .modal-body").html(err);
          $("#modalAlert").modal('show');
        },
        complete: function () {
          setLoadingBar(false, 'modalTripDetail');
        }
      });     
  };

  //엑셀 내보내기
  function exportExcel(eThis, e){    
    table.buttons('.buttons-excel').trigger();
  };

  //이미지 내보내기
  function exportImage(eThis, e){
    e.preventDefault();

    var data = {
      tripGuid : $("#tripGuid").val(),
    };
    
    confirmModal(e, 'modalConfirm', '모두의 출장 상세', '전체 이미지를 다운로드 하시겠습니까?', function () {   
      $.ajax({
        url: '/business/trip/exportTripDetailImage',
        method: 'POST',
        data: data,
        beforeSend: function (xhr) {
          setLoadingBar(true);
          $("#modalConfirm").modal('hide');
          $("#modalAlert .modal-title").html("모두의 출장 상세 이미지");
        },
        success: function (data, status, xhr) {
          if(data.success){
            location.href = data.value.URL;
          }

          var message = data.message;
          $("#modalAlert .modal-body").html(message);
          $("#modalAlert").modal('show');
        },
        error: function (data, status, err) {
          $("#modalAlert .modal-body").html(err);
          $("#modalAlert").modal('show');
        },
        complete: function () {
          setLoadingBar(false);
        }
      });         
    });        
  };

  //위도,경도 가져오기
  function openDaumMap(eThis, e){
    e.preventDefault();

    let tripDetailGuid = $("#tripDetailGuid").val();
    let address = $("#address").val();
    execDaumPostcode('/business/trip/getCoordinateByAddress', tripDetailGuid, address, function(data, message)
    {
      $("#address").val(data.address);
      $("#addressDetail").val(data.addressDetail);
      $("#latitude").val(data.latitude);
      $("#longitude").val(data.longitude);
    });
  };
  
  //위도,경도 가져오기
  function openKakaoMap(eThis, e, hasParentModalYN){
    e.preventDefault();
    e.stopPropagation();

    let tripDetailGuid;
    let address;
    let latitude;
    let longitude;

    if(hasParentModalYN === undefined){
      hasParentModalYN = 'N';
      const td = $(eThis).closest('td');
      const rowData = table.row(td).data();
      tripDetailGuid = rowData.TRIP_DTL_GUID;
      address = rowData.ADDR_ORG;
      latitude = rowData.LAT;
      longitude = rowData.LNG;
    }
    else{
      tripDetailGuid = $("#tripDetailGuid").val();
      address = $("#address").val();
      latitude = $("#latitude").val();
      longitude = $("#longitude").val();
    }

    var width = '700';
    var height ='800';
    
    //팝업을 가운데 위치시키기 위해 아래와 같이 값 구하기
    var left = Math.ceil((window.screen.width - width) / 2);
    var top = Math.ceil((window.screen.height - height) / 2);
    var param = '?tripDetailGuid=' + tripDetailGuid + '&address=' + address + '&hasParentModalYN=' + hasParentModalYN + '&latitude=' + latitude + '&longitude=' + longitude;
    var url = '/business/trip/findAddress' + param;

    window.open(url, '주소 찾기', 'width='+ width +', height='+ height +', left=' + left + ', top='+ top + ',scrollbars=yes');
  };

  //로드맵
  function openKakaoRoadMap(eThis, e, hasParentModalYN){
    e.preventDefault();
    e.stopPropagation();

    let address;

    if(hasParentModalYN === undefined){
      hasParentModalYN = 'N';
      const td = $(eThis).closest('td');
      const rowData = table.row(td).data();
      address = rowData.ADDR_ORG;      
    }
    else{
      address = $("#address").val();
    }

    if(address.trim() == ''){
      $("#modalAlert .modal-title").html("카카오 로드맵");
      $("#modalAlert .modal-body").html('주소가 없습니다.');
      $("#modalAlert").modal('show');      
      return;
    }

    var width = '700';
    var height ='800';
    
    //팝업을 가운데 위치시키기 위해 아래와 같이 값 구하기
    var left = Math.ceil((window.screen.width - width) / 2);
    var top = Math.ceil((window.screen.height - height) / 2);
    var param = '?address=' + address;
    var url = '/business/trip/roadMap' + param;

    window.open(url, '카카오 로드맵', 'width='+ width +', height='+ height +', left=' + left + ', top='+ top + ',scrollbars=yes');
  };

  //길찾기
  function openFindLocation(eThis, e, hasParentModalYN)  {
    e.preventDefault();
    e.stopPropagation();

    let srcAddress;
    let destAddress;
    let latitude;
    let longitude;
    let destLatitude;
    let destLongitude;

    if(hasParentModalYN === undefined){
      hasParentModalYN = 'N';
      const td = $(eThis).closest('td');
      const rowData = table.row(td).data();
      destAddress = rowData.ADDR_ORG;      
      destLatitude = rowData.LAT;      
      destLongitude = rowData.LNG;
    }
    else{
      destAddress = $("#address").val();
      destLatitude = $("#latitude").val();
      destLongitude = $("#longitude").val();
    }

    //목적지 주소가 없는 경우
    if(destAddress.trim() == ''){
      $("#modalAlert .modal-title").html("카카오 길찾기");
      $("#modalAlert .modal-body").html('목적지 주소가 없습니다.');
      $("#modalAlert").modal('show');      
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          // 현재 위치 좌표
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
    
          const width = 1400;
          const height = 800;
    
          // 팝업을 가운데 위치시키기 위해 계산
          const left = Math.ceil((window.screen.width - width) / 2);
          const top = Math.ceil((window.screen.height - height) / 2);
    
          const data = {
            latitude: latitude,
            longitude: longitude,
          };
    
          // 서버에 위치 정보 전송
          $.ajax({
            url: '/business/trip/getAddressByCoordinate',
            method: 'POST',
            data: data,
            beforeSend: function (xhr) {
              // 요청 전 작업
            },
            success: function (data, status, xhr) {
              if (data.success) {
                srcAddress  = data.value.address;

                // 카카오맵 앱 URL
                const kakaoMapUrl = `kakaomap://route?sp=${latitude},${longitude}&ep=${destLatitude},${destLongitude}&by=car`;
    
                // 앱 실행 시도
                window.location.href = kakaoMapUrl;
    
                // 일정 시간 후에도 반응이 없으면 웹으로 연결
                setTimeout(() => {
                  const param = `?sName=${srcAddress}&eName=${destAddress}`;
                  const url = 'https://map.kakao.com/' + param;
                  window.open(url, '카카오 길찾기', 'width='+ width +', height='+ height +', left=' + left + ', top='+ top + ',scrollbars=yes');
                }, 500);
              } else {
                console.error(data.message);
              }
            },
            error: function (data, status, err) {
              console.error('getAddressByCoordinate API 오류:', err);
            },
          });
        },
        function (error) {
          // 위치 접근 거부 또는 오류 처리
          if (error.code === error.PERMISSION_DENIED) {
            // 이전 모달 z-index 변경
            $('#modalTripDetail').css('z-index', 1050);
    
            // 모달 z-index 복구
            $('#modalAlert').on('hidden.bs.modal', function () {
              $('#modalTripDetail').css('z-index', 1055);
              $('#modalAlert').off('hidden.bs.modal');
            });
    
            // 사용자 경고 모달 표시
            $('#modalAlert .modal-title').html('카카오 길찾기');
            $('#modalAlert .modal-body').html(
              '위치 엑세스가 거부되었습니다. 해당 기능을 사용하시려면 주소표시줄 우측에서 위치 엑세스 버튼을 클릭해서 동의하시기 바랍니다.'
            );
            $('#modalAlert').modal('show');
          }
        }
      );
    } else {
      // GeoLocation을 지원하지 않는 브라우저
      $('#modalAlert .modal-title').html('카카오 길찾기');
      $('#modalAlert .modal-body').html(
        'HTML5를 사용하지 않는 브라우저는 GeoLocation 기능을 사용할 수 없습니다.'
      );
      $('#modalAlert').modal('show');
    }
    
  };