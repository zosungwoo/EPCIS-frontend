const href = window.location.href;
let hrefArr = href.split("/");
let baseURL = hrefArr[0] + "//" + hrefArr[2] + ":8080/epcis";

let validationURL;
let captureURL;
let queryURL;

// Server connection check and Show status
function serverConn(url){
    $.ajax({
        url: url,
        crossOrigin: true,
    }).done(() => {
        $("#serverResp").removeClass('bg-danger').addClass("bg-success");
        $("#serverEndpoint").html(url);
    }).fail(() => {
        $("#serverResp").removeClass('bg-success').addClass("bg-danger");
        $("#serverEndpoint").html("");
    });
}


// Reset database resourses
function resetDB() {
    let responseToast = $("#responseToast");
    let toastText;
    $("#resetIcon").addClass("fa-spin");  // icon spins
  
    $.ajax({
        type: "DELETE",
        url: baseURL,
        crossOrigin: true,
    }).done((result) => {
        toastText = "200 OK";
    }).fail((result) => {
        toastText = result.responseText;
    })

    // show the repository status in 5 seconds (because the server resourses are updated every 5 sec)
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
        $("#resetIcon").removeClass("fa-spin"); // stop spinning
    }, 5000);
}


// Validate editor contents
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


// Capture
function capture(format) {
    // capture (POST request)
    $.ajax({  
        type: "POST",
        url: captureURL,
        data: editor.getValue(),
        contentType: "application/" + format + "; charset=utf-8",
        crossOrigin: true,
        beforeSend: function (xhr) {  // add required headers
            xhr.setRequestHeader("GS1-EPCIS-Version", "2.0.0");
            xhr.setRequestHeader("GS1-CBV-Version", "2.0.0");
            xhr.setRequestHeader("GS1-EPCIS-Capture-Error-Behaviour", "rollback");
        }
    }).done((data, textStatus, request) => {
        let loc = request.getResponseHeader('Location')  // get 'Location' header
        if(!loc)
        {
            $("#resp").val("Success").hide().fadeIn('slow');
            return;
        }
        let id = loc.split("/").pop();  // get capture ID from 'Location' header
        $("#resp").val("Success with capture ID: " + id).hide().fadeIn('slow');
        $("#status").removeClass("text-secondary text-success text-danger").addClass("text-warning Blink");

        let cmp;  // for comparing the response with the previous response
        setTimeout(() => {
            let interval = setInterval(() => {
                // capture detail (GET request)
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

                    if(xmlString === cmp)  // 같은 응답 내용일 경우, 모달창 업데이트 및 성공 여부 검사 건너뜀
                        return;

                    cmp = xmlString;
                    // update editor contents
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
                        
                        clearInterval(interval);  // stop 'setInterval'
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
        // update editor contents
        editor_details.setValue(result);
        $('#detailsModal').on('shown.bs.modal', function() {
            editor_details.refresh();
        });
    });
}


// Single Capture 
function singleCapture(format) {
    // single capture (POST request)
    $.ajax({
        type: "POST",
        url: captureURL,
        data: editor.getValue(),
        contentType: "application/" + format + "; charset=utf-8",
        crossOrigin: true,
        beforeSend: function (xhr) {  // add required headers
            xhr.setRequestHeader("GS1-EPCIS-Version", "2.0.0");
            xhr.setRequestHeader("GS1-CBV-Version", "2.0.0");
        }
    }).done((result) => {
        $("#resp").val("Status: 200 OK" + result).hide().fadeIn('slow');
    }).fail((result) => {
        $("#resp").val(result.responseText).hide().fadeIn('slow');
    });
}


// Query
function query(){
    // query (POST request)
    $.ajax({
        type: "POST",
        url: queryURL,
        data: editor.getValue(),
        contentType: "application/xml; charset=utf-8",
        crossOrigin: true
    }).done((result) => {
        // result formatting
        let xmlString = formatXml(new XMLSerializer().serializeToString(result));
        // update editor contents
        editor_resp.setValue(xmlString);
        // 'fold' editor conetnts
        foldEventVoca(editor_resp, 'xml');
        
        if($(result).find("query\\:SubscribeResult").length){
            const parser = new DOMParser();
            const xml = parser.parseFromString(editor.getValue(), 'application/xml');
            subId = $(xml).find('subscriptionID').text();  // in soapSubscribe.html

            $("#subResultButton").removeClass('d-none');
        } else{
            $("#subResultButton").addClass('d-none');
        }
        
    }).fail((result) => {
        // result formatting
        result = formatXml(result.responseText);
        editor_resp.setValue(result);

        $("#subResultButton").addClass('d-none');
    });
}

// Get subscription result from web client server
function getSubResult(subId){
    const clientServerHref = window.location.href;
    let clientServerHrefArr = href.split("/");
    let webSocketUrl = "ws://" + hrefArr[2] + "/epcis/sub" + "?subId=" + subId;

    // clear editor contents
    editor_subResultResp.setValue("");
    $('#subResultModal').on('shown.bs.modal', function() {
        editor_subResultResp.refresh();
    });

    // open new websocket
    if(socket)
        socket.close();
    socket = new WebSocket(webSocketUrl);
    
    let responseToast = $("#subResponseToast")
    let responseToastHeader = responseToast.find("strong");
    let responseToastBody = responseToast.find(".toast-body");
    
    socket.onopen = function(event) {
        $("#subResultIcon").addClass("fa-spin");
        responseToastHeader.html("Connection established");
        responseToastBody.html("Please wait for the server to send the data");
        responseToast.toast("show");
    };

    socket.onmessage = function(event) {
        // only when modal is open
        if ($('#subResultModal').hasClass('show')) {   
            // update editor contents
            editor_subResultResp.setValue(formatXml(event.data));
            
            responseToastHeader.html("Data received from server");
            responseToastBody.html("Please check the editor");
            responseToast.toast("show");
        }   
    };

    socket.onclose = function(event) {
        $("#subResultIcon").removeClass("fa-spin");

        if (event.wasClean) {
            responseToastHeader.html("Connection closed cleanly.");
            responseToastBody.html(event.reason);
            responseToast.toast("show");
        } else {
            responseToastHeader.html("Connection closed abruptly.");
            responseToastBody.html("Connection died");
            responseToast.toast("show");
        }
    };

    socket.onerror = function(error) {
        $("#subResultIcon").removeClass("fa-spin");
        
        responseToastHeader.html("An error occured");
        responseToastBody.html("Please check the editor to see the error message");
        responseToast.toast("show");
        if(typeof event != `undefined`)
            editor_subResultResp.setValue(event.message);
        else
            editor_subResultResp.setValue("Browser probably cannot establish connection with " + url);
    };
}

// Retrieve examples
function retrieveExamples(retrieveSubURL, exampleMiddleURL, format){
    let retrieveURL = baseURL.replace(":8080", "") + retrieveSubURL;  // from web client server
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

// Load examples
function loadExample(btn, format) {
    $('#textArea').load(btn.id, () => {
        editor.setValue($('#textArea').val());  // update editor contents
        foldEventVoca(editor, format);  // 'fold' editor contents

        if(validationURL !== undefined)  // Whether to validate
            isValid(format);
    });

    $('#exampleModal').modal('hide');
}

// Initialize a new editor
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

// Format xml code
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

// Apply 'folding' to editor
function foldEventVoca(editor, format){
    // xml
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
    // json
    else{
        strs = editor.getValue().split("\n");

        // Fold events and vocabularies
        for(let i=0;i<strs.length;i++){
            if(strs[i].search("eventList") !== -1 || strs[i].search("vocabularyElementList") !== -1)
                editor.foldCode(CodeMirror.Pos(i, 0));
        }
    }
}