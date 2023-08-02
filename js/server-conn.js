const href = "http://127.0.0.1/epcis/home/index.html"; // @@@@@@@@@@@ 수정
let hrefArr = href.split("/");
let baseURL = hrefArr[0] + "//" + hrefArr[2] + "/epcis";

let eventCount, vocabularyCount;


$.ajax({
  url: baseURL + "/stats",
  crossOrigin: true,
}).done((result) => {
  xmlCaptureBaseURL = result.xmlCaptureBase.replace("dfpl.sejong.ac.kr", "127.0.0.1");  // @@@@@@@@@@@@@@@ 수정
  // baseURLs.soapQueryBaseURL = result.soapQueryBase;
  // baseURLs.soapSubscribeBaseURL = result.soapSubscribeBase;
  // baseURLs.jsonCaptureBaseURL = result.jsonCaptureBase;
  // baseURLs.restQueryBaseURL = result.restQueryBase;
  // baseURLs.restSubscribeBaseURL = result.restSubscribeBase;
  eventCount = result.eventCount;
  vocabularyCount = result.vocabularyCount;

  $(document).ready(() => {
    $("#eventsCount").html(eventCount);
    $("#vocabularyCount").html(vocabularyCount);

    // Connection to the server
    serverConn(xmlCaptureBaseURL);
    setInterval(serverConn, 2000, xmlCaptureBaseURL);

    // for (const URL in baseURLs) {
    //   const regex = /(\w+)BaseURL/;
    //   let divId = URL.match(regex)[1];

    //   $.ajax({
    //     url: baseURLs[URL][0],
    //     crossOrigin: true,
    //   })
    //     .done(() => {
    //       $("#" + divId + "Resp").removeClass('bg-danger').addClass("bg-success");
    //     })
    //     .always(() => {
    //       $("#" + divId + "Endpoint").html(
    //         baseURLs[URL][0] + "/" + baseURLs[URL][1]
    //       );
    //     });
    // }
  });
});






function serverConn(url){
  $.ajax({
    url: url,
    crossOrigin: true,
  }).done(() => {
    $("#mainServerResp").removeClass('bg-danger').addClass("bg-success");
    $("#mainServerEndpoint").html(url);
  }).fail(() => {
    $("#mainServerResp").removeClass('bg-success').addClass("bg-danger");
    $("#mainServerEndpoint").html("");
  });
}


function resetDB() {
  let responseToast = $("#responseToast");

  $.ajax({
    url: baseURL + "/reset",
    crossOrigin: true,
  })
    .done(function (result) {
      responseToast.find(".toast-body").html("200 OK");
    })
    .fail(function (result) {
      responseToast.find(".toast-body").html(result.responseText);
    })
    .always(function () {
      responseToast.toast("show");
    });
}
