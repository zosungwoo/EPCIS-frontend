const href = "http://127.0.0.1/epcis/home/index.html"; // 수정
let hrefArr = href.split("/");
let baseURL = hrefArr[0] + "//" + hrefArr[2] + ":8080/epcis";

function serverConn(url, subUrl = ""){
    $.ajax({
        url: url,
        crossOrigin: true,
    }).done(() => {
        $("#serverResp").removeClass('bg-danger').addClass("bg-success");
        $("#serverEndpoint").html(url + subUrl);
    }).fail(() => {
        $("#serverResp").removeClass('bg-success').addClass("bg-danger");
        $("#serverEndpoint").html("");
    });
}

function resetDB() {
    let responseToast = $("#responseToast");
    let toastText;
    $("#resetIcon").addClass("fa-spin");
  
    $.ajax({
        type: "DELETE",
        url: baseURL,
        crossOrigin: true,
    }).done((result) => {
        toastText = "200 OK";
    }).fail((result) => {
        toastText = result.responseText;
    })

    setTimeout(() => {
        responseToast.find(".toast-body").html(toastText);
        responseToast.toast("show");

        $.ajax({
            url: baseURL + "/statistics",
            crossOrigin: true,
        }).done((result) => {
            $("#numOfEvents").html(result.numOfEvents);
            $("#numOfVocabularies").html(result.numOfVocabularies);
            $("#epcs").html(result.epcs);
            $("#bizSteps").html(result.bizSteps);
            $("#bizLocations").html(result.bizLocations);
            $("#readPoints").html(result.readPoints);
            $("#dispositions").html(result.dispositions);
            $("#eventTypes").html(result.eventTypes);
        })
        $("#resetIcon").removeClass("fa-spin");
    }, 5000);

    

    
  }

function capture(format) {
    $.ajax({
        type: "POST",
        url: captureURL,
        data: editor.getValue(),
        contentType: "application/" + format + "; charset=utf-8",
        crossOrigin: true,
        beforeSend: function (xhr) {
            xhr.setRequestHeader("GS1-EPCIS-Version", "2.0.0");
            xhr.setRequestHeader("GS1-CBV-Version", "2.0.0");
            xhr.setRequestHeader("GS1-EPCIS-Capture-Error-Behaviour", "rollback");
        }
    }).done((data, textStatus, request) => {
        let loc = request.getResponseHeader('Location')
        if(!loc)
        {
            $("#resp").val("Success").hide().fadeIn('slow');
            return;
        }
        let id = loc.split("/").pop();
        $("#resp").val("Success with capture ID: " + id).hide().fadeIn('slow');
        $("#status").removeClass("text-secondary text-success text-danger").addClass("text-warning Blink");

        let cmp;
        setTimeout(() => {
            let interval = setInterval(() => {
                $.ajax({
                    url: captureURL + "/" + id,
                    contentType: "application/" + format + "; charset=utf-8",
                    dataType: "xml",
                    crossOrigin: true,
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("GS1-EPCIS-Min", "1.0.1");
                        xhr.setRequestHeader("GS1-EPCIS-Max", "2.0.0");
                    }
                }).done((result) => {
                    let xmlString = formatXml(new XMLSerializer().serializeToString(result));
                    let running = $(result).find("ns2\\:epcisCaptureJobType").attr("running");

                    if(xmlString === cmp)  // 같은 응답 내용일 경우 모달창 업데이트 및 성공 여부 검사 건너뜀
                        return;

                    cmp = xmlString;
                    $("#details").val(xmlString);
                    editor_details.setValue(xmlString);
                    $('#detailsModal').on('shown.bs.modal', function() {
                        editor_details.refresh();
                    });
                    
                    if(running === "false"){
                        let success = $(result).find("ns2\\:epcisCaptureJobType").attr("success");  
                        if(success === "true")
                            $("#status").removeClass("text-warning Blink").addClass("text-success");
                        else
                            $("#status").removeClass("text-warning Blink").addClass("text-danger");
                        
                        clearInterval(interval);
                    }
                }).fail((result) => {
                    $("#status").removeClass("text-warning Blink").addClass("text-danger");
                    clearInterval(interval);
                });
            }, 1000);
        }, 500);
    }).fail((result) => {
        result = formatXml(result.responseText);
        $("#resp").val("Fail with " + result).hide().fadeIn('slow');
        $("#status").removeClass("text-success text-warning text-danger").addClass("text-secondary");
        $("#details").val(formatXml(result));
        editor_details.setValue(result);
        $('#detailsModal').on('shown.bs.modal', function() {
            editor_details.refresh();
        });
    });
}

function singleCapture(format) {
    $.ajax({
        type: "POST",
        url: captureURL,
        data: editor.getValue(),
        contentType: "application/" + format + "; charset=utf-8",
        crossOrigin: true,
        beforeSend: function (xhr) {
            xhr.setRequestHeader("GS1-EPCIS-Version", "2.0.0");
            xhr.setRequestHeader("GS1-CBV-Version", "2.0.0");
        }
    }).done((result) => {
        $("#resp").val("Status: 200 OK" + result).hide().fadeIn('slow');
    }).fail((result) => {
        $("#resp").val(result.responseText).hide().fadeIn('slow');
    });
}

function query(){
    $.ajax({
        type: "POST",
        url: queryURL,
        data: editor.getValue(),
        contentType: "application/xml; charset=utf-8",
        crossOrigin: true
    }).done((result) => {
        let xmlString = formatXml(new XMLSerializer().serializeToString(result));
        $("#queryResp").val(xmlString);
        editor_resp.setValue(xmlString);
    }).fail((result) => {
        result = formatXml(result.responseText);
        $("#queryResp").val(result);
        editor_resp.setValue(result);
    });
}

function loadExample(btn, format, valid=true) {
    $('#textArea').load(btn.id, () => {
        editor.setValue($('#textArea').val());
        if(format === 'xml'){
            strs = editor.getValue().split("\n");
            re = /<([a-zA-Z]+Event)>/g;

            // Fold events and vocabularies
            for(let i=0;i<strs.length;i++){
                if(strs[i].search(re) != -1 || strs[i].search("<VocabularyElementList>") != -1)
                    editor.foldCode(CodeMirror.Pos(i, 0));
            }
        }
        else{
            strs = editor.getValue().split("\n");

            // Fold events and vocabularies
            for(let i=0;i<strs.length;i++){
                if(strs[i].search("eventList") != -1 || strs[i].search("vocabularyElementList") != -1)
                    editor.foldCode(CodeMirror.Pos(i, 0));
            }
        }
        if(valid)
            isValid(format);
    });

    $('#exampleModal').modal('hide');
}

function isValid(format) {
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
    }).always((result) => {
        $("#status").removeClass("text-warning text-success text-danger Blink").addClass("text-secondary");
    });
}

function initEditor(id, format, readonly = false, size = 535){
    let textAreaMode;
    if(format === "json")
        textAreaMode = "ld+json";
    else
        textAreaMode = format;

    let editor = CodeMirror.fromTextArea(document.getElementById(id), {
        matchBrackets: true,
        autoCloseBrackets: true,
        mode: "application/" + textAreaMode,
        lineNumbers: true,
        indentUnit: 4,
        theme: 'eclipse',
        foldGutter: true,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        readOnly: readonly
    });
    editor.setSize(null, size);
    return editor;
}

// Retrieve examples
function retrieveExamples(retrieveSubURL, exampleMiddleURL, format, valid=true){
    let retrieveURL = baseURL.replace(":8080", "") + retrieveSubURL;
    $.ajax({
        url: retrieveURL,
        crossOrigin: true
    }).done((result) => {
        $.each(JSON.parse(result), (key, value) => {
            let tr = "<tr><td class=\"font-weight-bold h6\">" + key + "</td><td>";
    
            $.each(value, (subIdx, subVal) => {
                if(subVal != ""){
                    tr += "<button class=\"btn btn-outline-dark btn-sm mb-2\" id=\"/epcis/home" + exampleMiddleURL + "/" + key + "/" + subVal + "\" type=\"button\" onclick=\"loadExample(this, \'" + format + "\', " + valid + ")\">" + subVal + "</button><br>"
                }
            })
            tr += "</td></tr>";
        
            $("#exampleBody").append(tr);
        })
    })
}

function formatXml(xml) {
    var formatted = '';
    var reg = /(>)(<)(\/*)/g;
    xml = xml.replace(reg, '$1\r\n$2$3');
    var pad = 0;
    jQuery.each(xml.split('\r\n'), function(index, node) {
        var indent = 0;
        if (node.match(/.+<\/\w[^>]*>$/)) {
            indent = 0;
        } else if (node.match(/^<\/\w/)) {
            if (pad != 0) {
                pad -= 1;
            }
        } else if (node.match(/^<\w([^>]*[^\/])?>.*$/)) {
            indent = 1;
        } else {
            indent = 0;
        }

        var padding = '';
        for (var i = 0; i < pad; i++) {
            padding += '  ';
        }

        formatted += padding + node + '\r\n';
        pad += indent;
    });

    return formatted;
}