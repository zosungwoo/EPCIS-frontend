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
                    a = result
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
var a;
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

        foldEventVoca(editor_resp, 'xml');
        
        if($(result).find("query\\:SubscribeResult").length){
            const parser = new DOMParser();
            const xml = parser.parseFromString(editor.getValue(), 'application/xml');
            subId = $(xml).find('subscriptionID').text();  // in soapSubscribe.html

            $("#subResultButton").removeClass('d-none');
        } else{
            // 변수 기본값으로 초기화
            $("#subResultButton").addClass('d-none');
        }
        
    }).fail((result) => {
        result = formatXml(result.responseText);
        $("#queryResp").val(result);
        editor_resp.setValue(result);

        $("#subResultButton").addClass('d-none');
    });
}

function getSubResult(){
    const clientServerHref = window.location.href.split('/');
    let clientServerHrefArr = href.split("/");
    let webSocketUrl = "ws://" + hrefArr[2] + "/epcis/sub";

    socket = new WebSocket(url);
        
////////// 이부분 수정 ///////////////

    socket.onopen = function(e) {
        $("#responseToast").find("strong").html("Connection established");
        $("#responseToast").find(".toast-body").html("Please wait for the server to send the data.");
        // responseToast.show();
    };

    socket.onmessage = function(event) {
        $("#responseToast").find("strong").html("Data received from server");
        $("#responseToast").find(".toast-body").html("Please check the editor");
        // responseToast.show();
        // jsonEditor.setValue(event.da1ta);
    };

    socket.onclose = function(event) {
        if (event.wasClean) {
            $("#responseToast").find("strong").html("Connection closed cleanly.");
            $("#responseToast").find(".toast-body").html(event.reason);
            // responseToast.show();
        } else {
            $("#responseToast").find("strong").html("Connection closed abruptly.");
            $("#responseToast").find(".toast-body").html("Connection died");
            // responseToast.show();
        }
        
        $("#pollParam").val("");
        $("button#subscribe-off-btn").removeClass("btn-info").addClass("btn-outline-info").prop("disabled", true);
        $("button#subscribe-on-btn").removeClass("btn-outline-info").addClass("btn-info").prop("disabled", false);
    };

    socket.onerror = function(error) {
        $("#errorToast").find("strong").html("An error occured");
        $("#errorToast").find(".toast-body").html("Please check the editor to see the error message");
        // errorToast.sho???zaZZZZZZZZZZZZZZZZZZZZZZZZw();
        // if(typeof event != `undefined`)
        //     jsonEditor.setValue(event.message);
        // else
        //     jsonEditor.setValue("Browser probably cannot establish connection with " + url);
        
        $("#pollParam").val("");
        $("button#subscribe-off-btn").removeClass("btn-info").addClass("btn-outline-info").prop("disabled", true);
        $("button#subscribe-on-btn").removeClass("btn-outline-info").addClass("btn-info").prop("disabled", false);
    };
}

// Retrieve examples
function retrieveExamples(retrieveSubURL, exampleMiddleURL, format){
    let retrieveURL = baseURL.replace(":8080", "") + retrieveSubURL;
    $.ajax({
        url: retrieveURL,
        crossOrigin: true
    }).done((result) => {
        $.each(JSON.parse(result), (key, value) => {
            let tr = "<tr><td class=\"font-weight-bold h6\">" + key + "</td><td>";
    
            $.each(value, (subIdx, subVal) => {
                if(subVal != ""){
                    tr += "<button class=\"btn btn-outline-dark btn-sm mb-2\" id=\"/epcis/home" + exampleMiddleURL + "/" + key + "/" + subVal + "\" type=\"button\" onclick=\"loadExample(this, \'" + format + "\')\">" + subVal + "</button><br>"
                }
            })
            tr += "</td></tr>";
        
            $("#exampleBody").append(tr);
        })
    })
}

function loadExample(btn, format) {
    $('#textArea').load(btn.id, () => {
        editor.setValue($('#textArea').val());
        foldEventVoca(editor, format);

        if(typeof validationURL !== 'undefined')  // Whether to validate
            isValid(format);
    });

    $('#exampleModal').modal('hide');
}

function initEditor(id, format, readonly = false, size = 535){
    let textAreaMode = format;
    if(format === "json")
        textAreaMode = "ld+json";

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

function foldEventVoca(editor, format){
    if(format === 'xml'){
        let strs = editor.getValue().split("\n");
        const re_event = /<([a-zA-Z]+Event)>/;
        const re_voca = /<VocabularyElementList>/;

        // Fold events and vocabularies
        for(let i=0;i<strs.length;i++){
            if(strs[i].search(re_event) !== -1 || strs[i].search(re_voca) !== -1)
                editor.foldCode(CodeMirror.Pos(i, 0));
        }
    }
    else{
        strs = editor.getValue().split("\n");

        // Fold events and vocabularies
        for(let i=0;i<strs.length;i++){
            if(strs[i].search("eventList") !== -1 || strs[i].search("vocabularyElementList") !== -1)
                editor.foldCode(CodeMirror.Pos(i, 0));
        }
    }
}