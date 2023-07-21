const href = "http://127.0.0.1/epcis/home/index.html"; // 수정
let hrefArr = href.split("/");
let baseURL = hrefArr[0] + "//" + hrefArr[2] + "/epcis";

let baseURLs = {};

$(document).ready(() => {
  // Connection to the server
  $.ajax({
    url: baseURL + "/stats",
    crossOrigin: true,
  })
    .done((result) => {
      // [URL, (capture or query)]
      baseURLs.xmlCaptureBaseURL = [result.xmlCaptureBase, "capture"];
      baseURLs.soapQueryBaseURL = [result.soapQueryBase, "query"];
      baseURLs.soapSubscribeBaseURL = [result.soapSubscribeBase, "query"];
      baseURLs.jsonCaptureBaseURL = [result.jsonCaptureBase, "capture"];
      baseURLs.restQueryBaseURL = [result.restQueryBase, "query"];
      baseURLs.restSubscribeBaseURL = [result.restSubscribeBase, "query"];
      $("#eventsCount").html(result.eventCount);
      $("#vocabularyCount").html(result.vocabularyCount);

      for (const URL in baseURLs) {
        const regex = /(\w+)BaseURL/;
        let divId = URL.match(regex)[1];

        $.ajax({
          url: baseURLs[URL][0],
          crossOrigin: true,
        })
          .done(() => {
            $("#" + divId + "Resp").addClass("bg-success");
          })
          .fail(() => {
            $("#" + divId + "Resp").addClass("bg-danger");
          })
          .always(() => {
            $("#" + divId + "Endpoint").html(
              baseURLs[URL][0] + "/" + baseURLs[URL][1]
            );
          });
      }
    })
    .fail(() => {
      $(".rounded-circle").addClass("bg-danger");
    });
});

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
