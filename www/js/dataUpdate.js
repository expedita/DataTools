
function doCallUpdate(data, functSuccess) {

    $.ajax({
        url: wspath + "?token=" + Date.now().toString(),
        data: data,
        type: "POST",
        contentType: "application/xml",
        dataType: "xml",
        xhrFields: {
            withCredentials: true
        },
        error: function (xhr, ajaxOptions, errorThrown) {
            debugLog("error::" + xhr.status + "::" + xhr.responseText);
        },
        success: functSuccess
    });
}


function updateNode(id, title, text, hId, context) {
    document.getElementById("mainWindow").style.display = "none";
    document.getElementById("nodeEditForm").style.display = "none";
    clearAjax();
    doCallUpdate("<updateNode><Nodulo>" +
        "<NodeId>" + id + "</NodeId>" +
        "<Referencia>" + title + "</Referencia>" +
        "<Descricao>" + text + "</Descricao>" +
        "<HierarquiaId>" + hId + "</HierarquiaId>" +
        "<Context>" + context + "</Context>" +
      "</Nodulo></updateNode>", app.reload);
};

function addNode(title, text, hId, context) {
    document.getElementById("mainWindow").style.display = "none";
    document.getElementById("nodeEditForm").style.display = "none";
    clearAjax();
    doCallUpdate("<newNode><Nodulo>" +
        "<NodeId>0</NodeId>" +
        "<Referencia>" + title + "</Referencia>" +
        "<Descricao>" + text + "</Descricao>" +
        "<Seguranca>0</Seguranca>" +
        "<TipoId>906</TipoId>" +
        "<Tipoe>Outro</Tipoe>" +
        "<HierarquiaId>" + hId + "</HierarquiaId>" +
        "<Context>" + context + "</Context>" +
        "<IsRoot>false</IsRoot>" +
      "</Nodulo></newNode>", app.reload);
};

function clearForm() {
    document.getElementById('nodeTitle').value = "";
    document.getElementById('nodeDescription').value = "";
    document.getElementById('nodeContext').value = "";
    document.getElementById('nodeContext').style.display = "none";
}
