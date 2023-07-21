let xmlCaptureBaseURL = "";
let xmlValidationURL = "";
let xmlCaptureURL = "";

let xmlEditor;

$(window).on("load", () => {
    xmlCaptureBaseURL = baseURLs['xmlCaptureBaseURL'][0];
    xmlValidationURL = xmlCaptureBaseURL + "/validation";
    xmlCaptureURL = xmlCaptureBaseURL + "/capture";

    // codemirror
    xmlEditor = CodeMirror.fromTextArea(document.getElementById('xmlTextArea'), {
        matchBrackets: true,
        autoCloseBrackets: true,
        mode: "application/xml",
        lineNumbers: true,
        indentUnit: 4,
        theme: 'eclipse',

    });
    xmlEditor.setSize(null, 515);

    // Retrieve examples
    $.ajax({
        url: baseURL + "/capture/examples",
        crossOrigin: true
    }).done((result) => {
        
        let oddOrEven;
        let flag = 1;
        $.each(JSON.parse(result), (key, value) => {
            oddOrEven = (flag++) % 2 === 1 ? "odd" : "even";

            let tr = "<tr class=\"" + oddOrEven + "\"><td class=\"font-weight-bold h6\">" + key + "</td><td>";

            $.each(value, (subIdx, subVal) => {
                if(subVal != ""){
                    tr += "<button class=\"btn btn-outline-dark btn-sm mb-2\" id=\"/epcis/home/example/capture/" + key + "/" + subVal + "\" type=\"button\" onclick=\"loadExample(this)\">" + subVal + "</button><br>"
                }
            })

            tr += "</td></tr>";
            
            $("#exampleBody").append(tr);
        })
    })

    // Catch paste event
    xmlEditor.getWrapperElement().addEventListener('paste', function(e) {
        if (!e.clipboardData) return;
        isValid();
    });

})

function capture() {
    let captureXMLString = xmlEditor.getValue();

    $.ajax({
        type: "POST",
        url: xmlCaptureURL,
        data: captureXMLString,
        contentType: "application/xml; charset=utf-8",
        crossOrigin: true
    }).done((result) => {
        $("#resp").val("success with capture ID: " + result).hide().fadeIn('slow');
    }).fail((result) => {
        $("#resp").val("fail with capture ID: " + result.responseText).hide().fadeIn('slow');
    });
}

function loadExample(btn) {
    $('#xmlTextArea').load(btn.id, function() {
        xmlEditor.setValue($('#xmlTextArea').val());
        isValid();
    });

    $('#exampleModal').modal('hide');
}

function isValid() {
    $.ajax({
        type: "POST",
        url: xmlValidationURL,
        data: xmlEditor.getValue(),
        contentType: "application/xml; charset=utf-8",
        crossOrigin: true
    }).done((result) => {
        $("#docValResp")
            .val("Valid Document")
            .hide()
            .fadeIn('slow');
    }).fail((result) => {
        $("#docValResp")
            .val(result.responseText)
            .hide()
            .fadeIn('slow');
    });
}

