const href = "http://127.0.0.1/epcis/home/index.html"; // 수정
let hrefArr = href.split("/");
let baseURL = hrefArr[0] + "//" + hrefArr[2] + "/epcis";

let baseURLs = {};

$(document).ready(() => {
  $.ajax({
    url: baseURL + "/stats",
    crossOrigin: true,
  })
    .done((result) => {
      baseURLs.xmlCaptureBaseURL = result.xmlCaptureBase;
      baseURLs.soapQueryBaseURL = result.soapQueryBase;
      baseURLs.soapSubscribeBaseURL = result.soapSubscribeBase;
      baseURLs.jsonCaptureBaseURL = result.jsonCaptureBase;
      baseURLs.restQueryBaseURL = result.restQueryBase;
      baseURLs.restSubscribeBaseURL = result.restSubscribeBase;
      
    })
    .fail();
});
