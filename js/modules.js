const href = "http://127.0.0.1/epcis/home/index.html"; // 수정
let hrefArr = href.split("/");
let baseURL = hrefArr[0] + "//" + hrefArr[2] + "/epcis";

function capture() {
    let captureString = editor.getValue();

    $.ajax({
        type: "POST",
        url: captureURL,
        data: captureString,
        contentType: "application/" + format + "; charset=utf-8",
        crossOrigin: true
    }).done((result) => {
        $("#resp").val("success with capture ID: " + result).hide().fadeIn('slow');
    }).fail((result) => {
        $("#resp").val("fail with capture ID: " + result.responseText).hide().fadeIn('slow');
    });
}

function singleCapture() {
    let captureString = editor.getValue();

    $.ajax({
        type: "POST",
        url: captureURL,
        data: captureString,
        contentType: "application/" + format + "; charset=utf-8",
        crossOrigin: true
    }).done((result) => {
        $("#resp").val("Status: 200 OK" + result).hide().fadeIn('slow');
    }).fail((result) => {
        $("#resp").val(result.responseText).hide().fadeIn('slow');
    });
}

function loadExample(btn) {
    $('#textArea').load(btn.id, () => {
        editor.setValue($('#textArea').val());
        isValid();
    });

    $('#exampleModal').modal('hide');
}

function isValid() {
    $.ajax({
        type: "POST",
        url: validationURL,
        data: editor.getValue(),
        contentType: "application/" + format + "; charset=utf-8",
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

function initEditor(size = 515){
    let textAreaMode;
    if(format === "json")
        textAreaMode = "ld+json";
    else
        textAreaMode = format;

    let editor = CodeMirror.fromTextArea(document.getElementById('textArea'), {
        matchBrackets: true,
        autoCloseBrackets: true,
        mode: "application/" + textAreaMode,
        lineNumbers: true,
        indentUnit: 4,
        theme: 'eclipse',
    });
    editor.setSize(null, size);
    
    // Catch paste event
    editor.getWrapperElement().addEventListener('paste', function(e) {
        if (!e.clipboardData) return;
        isValid();
    });

    return editor
}

// Retrieve examples
function retrieveExamples(retrieveSubURL, exampleMiddleURL){
    $.ajax({
        url: baseURL + retrieveSubURL,
        crossOrigin: true
    }).done((result) => {
        $.each(JSON.parse(result), (key, value) => {
            let tr = "<tr><td class=\"font-weight-bold h6\">" + key + "</td><td>";
    
            $.each(value, (subIdx, subVal) => {
                if(subVal != ""){
                    tr += "<button class=\"btn btn-outline-dark btn-sm mb-2\" id=\"/epcis/home" + exampleMiddleURL + "/" + key + "/" + subVal + "\" type=\"button\" onclick=\"loadExample(this, editor)\">" + subVal + "</button><br>"
                }
            })
            tr += "</td></tr>";
        
            $("#exampleBody").append(tr);
        })
    })
}
