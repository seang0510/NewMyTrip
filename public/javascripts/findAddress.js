function execDaumPostcode(url, tripDetailGuid, address, callback) {
  var width = 500;
  var height = 600;
  new daum.Postcode({
      width: width,
      height: height,
      oncomplete: function(data) {
          var address = '';       // 주소이며 결과값이 없을 경우 공백 
          var addressDetail = ''; // 상세주소
          var zoneCode = data.zonecode;

          // 도로명 주소를 선택
          if (data.userSelectedType === 'R') { 
            address = data.roadAddress;

            if(data.bname !== '' && /[동|로|가]$/g.test(data.bname)){
              addressDetail += data.bname;
            }
            if(data.buildingName !== '' && data.apartment === 'Y'){
              addressDetail += (addressDetail !== '' ? ', ' + data.buildingName : data.buildingName);
            }
            if(addressDetail !== ''){
              addressDetail = ' (' + addressDetail + ')';
            }            
          } 
          // 지번 주소를 선택
          else {
            address = data.jibunAddress;
            addressDetail = '';
          }

          $.ajax({
              url: url,
              method: 'POST',
              data: {
                tripDetailGuid: tripDetailGuid,
                address: address,
                addressDetail: addressDetail,
                zoneCode: zoneCode,
              },
              beforeSend: function (xhr) {
                setLoadingBar(true);
              },              
              success: function (data, status, xhr) {
                if(data.success){
                  if (callback !== undefined) {
                    callback(data.value, data.message);
                  }
                }
                else {
                  $("#modalAlert .modal-title").html("모두의 출장 상세(주소,위도,경도) 갱신/조회 실패");
                  $("#modalAlert .modal-body").html(err);
                  $("#modalAlert").modal('show');
                }
              },
              error: function (data, status, err) {
                $("#modalAlert .modal-title").html("모두의 출장 상세(주소,위도,경도) 갱신/조회 실패");
                $("#modalAlert .modal-body").html(err);
                $("#modalAlert").modal('show');
              },
              complete: function () {
                setLoadingBar(false);
              }
            });
      }
  }).open({
    q: address,
    left: (window.screen.width / 2) - (width / 2),
    top: (window.screen.height / 2) - (height / 2)
  });
}