let captureBaseURL = "";
let validationURL = "";
let captureURL = "";

// codemirror
let format = "xml";
let editor;

$(document).ready(() => {
    editor = initEditor();
    $.ajax({
        url: baseURL + "/stats",
        crossOrigin: true
    }).done((result) => {
        captureBaseURL = result.xmlCaptureBase;
        validationURL = captureBaseURL + "/validation";
        captureURL = captureBaseURL + "/capture";

        // Connection to the server
        $.ajax({
            url: captureBaseURL,
            crossOrigin: true
        }).done((result) => {
            $("#xmlCaptureResp").removeClass('bg-danger').addClass("bg-success");  
        }).always(() => {
            $("#xmlCaptureEndpoint").html(captureURL);
        });

        // Retrieve examples
        retrieveExamples(retrieveSubURL = "/capture/examples", exampleMiddleURL = "/example/capture");
    })
})