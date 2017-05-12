/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var lastId = 0;
var lastHId = 0;
var currentId = 0;
var currentHId = 0;

var nodeAjaxCall;
var nodeChildCall;
var nodeHierarchyCall;

function clearAjax() {
    try { nodeAjaxCall.abort(); } catch (ex) { };
    try { nodeChildCall.abort(); } catch (ex) { };
    try { nodeHierarchyCall.abort(); } catch (ex) { };
}

var debug = 0;
//var wspath = "http://localhost:57207/DataToolsHandler.aspx";
var wspath = "http://ws.inmadeira.com/gestools/Web.Handlers/DataTools/DataToolsHandler.aspx";


function debugLog(message) {
    try {
        console.log(message);
    }
    catch (ex) {
        alert(message);
    }
    
}

function doCall(datatype, method, params, functSuccess) {
    //alert(ws + "?method=" + method + params);
    var request = $.ajax({
        type: "GET",
        dataType: datatype,
        url: wspath + "?method=" + method + params,
        xhrFields: {
            withCredentials: true
        },
        error: function (xhr, ajaxOptions, errorThrown) {
            debugLog("error::" + xhr.status + "::" + xhr.responseText);
        },
        success: functSuccess
    });
    return request;
}

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');


    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    },

    login: function() {
        var organisation = document.getElementById('LgInEntity').value;
        var user = document.getElementById('LgInUser').value;
        var password = document.getElementById('LgInPassword').value;
        var kb = document.getElementById('LgInKb').value;
		
		if(kb == "") { kb = organisation; }

        window.localStorage.setItem("entity", organisation);
        window.localStorage.setItem("user", user);
		
        doCall("xml", "login", "&user=" + user + "&entity=" + organisation + "&pwd=" + password + "&kb=" + kb, afterLogin);
    },

    loadRoots: function () {
        document.getElementById("mainWindow").style.display = "";
        document.getElementById("nodeEditForm").style.display = "none";
        clearAjax();
        doCall("xml", "getRoots", "", afterGetRoots);
    },

    back: function () {
        clearAjax();
        if (lastId != 0) {
            app.loadNode(lastId, lastHId);
        } else {
            app.loadRoots();
        }
    },

    reload: function () {
        clearAjax();
        if (currentId != 0) {
            //remove nodes from pounchDB
            try {
                deleteNode(currentId, currentHId);
                deleteList(currentId, currentHId, 'child');
                deleteList(currentId, currentHId, 'contexts');
            } catch (ex) { };
            app.loadNode(currentId, currentHId);
        } else {
            app.loadRoots();
        }
    },

    loadNode: function (id, hId) {
        lastId = currentId;
        lastHId = currentHId;
        currentId = id;
        currentHId = hId;

        clearAjax();

        loadNode(id, hId).then(function(doc) {
            //if(doc == null) throw('invalid cache');
            if($(doc).find("Nodulo").length == 0) {
                nodeAjaxCall = doCall("xml", "getNode", "&nId=" + id + "&hId=" + hId, afterGetNode);
            } else {
                afterGetNode(doc, true);
            }
        }).catch(function() {
            nodeAjaxCall = doCall("xml", "getNode", "&nId=" + id + "&hId=" + hId, afterGetNode);
        });
    },

    loadChildNodes: function (id, hId) {
        try {
            nodeChildCall.abort();
        } catch (ex) { }

        loadList(id, hId, 'child').then(function(doc) {
            //if(doc == null) throw('invalid cache');
            afterGetChildNodes(doc, true);
        }).catch(function() {
            nodeChildCall=doCall("xml", "getChildNodes", "&id="+id+"&hId="+hId+"&depth=1", afterGetChildNodes);
        });
    },

    loadNodeContexts: function (id) {
        try { nodeHierarchyCall.abort(); } catch (ex) { }

        loadList(id, 0, 'contexts').then(function(doc) {
            //if(doc == null) throw('invalid cache');
            afterGetNodeContexts(doc, true);
        }).catch(function() {
            nodeHierarchyCall=doCall("xml", "getNodeHierarchies", "&nId="+id, afterGetNodeContexts);
        })
    }
};

function afterLogin(xml) {
    window.open("mainPage.html", "_self");
};

function afterGetRoots(xml) {
    $("#mainWindow").empty();
    $(xml).find("Nodulo").each(function () {
        $("#mainWindow").append("<div id='" + $(this).attr("Value") + "::" + $(this).attr("hId") + "' class='node-box' onclick='app.loadNode(" + $(this).attr("Value") + "," + $(this).attr("hId") + ");' >" + $(this).attr("Ref") + "</div>");
    });
}

function afterGetNode(xml, cached) {
    //store in local db
    if(cached != true) {
        storeNode(currentId, currentHId, xml);
        //if the node was loaded, force to load also the child list
        deleteList(currentId, currentHId, 'child');
    }

    //render the node
    $("#mainWindow").empty();
    $(xml).find("Nodulo").each(function () {
        $("#mainWindow").append("<div class='node-content'>");
        $("#mainWindow").append("<span class='node-name'>" + $(this).children("Referencia").text() + "</span><br />");
        $("#mainWindow").append("<span class='node-type'>" + $(this).children("Tipoe").text() + "</span><br />");
        $("#mainWindow").append("<div class='node-description'>" + $(this).children("Descricao").text().replace(/(\r\n|\n|\r)/g, "<br />") + "</div>");

        if ($(this).children("HierarquiaId").text() != "-1") {
            $("#mainWindow").append("<div class='node-context'>" + $(this).children("Context").text() + "</div>");
        }

        $("#mainWindow").append("</div>");

        //set up the editor form
        document.getElementById('nodeId').value = currentId;
        document.getElementById('nodeContextId').value = currentHId;
        document.getElementById('nodeTitle').value = $(this).children("Referencia").text();
        document.getElementById('nodeDescription').value = $(this).children("Descricao").text();
        document.getElementById('nodeContext').value = $(this).children("Context").text();

        document.getElementById("mainWindow").style.display = "";
        document.getElementById("nodeEditForm").style.display = "";

        app.loadChildNodes(currentId, currentHId);

    });
}

function afterGetChildNodes(xml, cached) {
    if ($(xml).find("Error").length > 0) {
        $("#mainWindow").append("<div class='call-error'>" + $($(xml).find("Error")[0]).text() + "</div>");
    } else {
        //store in local db
        if(cached != true) {
            storeList(currentId, currentHId, 'child' , xml);
            //id the child list was loaded, probably we also need to load the hierarchies
            deleteList(currentId, 0, 'contexts');
        }

        var id = 0;
        var hId = 0;
        //the node may be root or normal
        if ($(xml).find("RootNodulo").length == 0) {
            id = $($(xml).find("Nodulo")[0]).attr("value");
            hId = $($(xml).find("Nodulo")[0]).attr("hierarquiaId");
        } else {
            id = $($(xml).find("RootNodulo")[0]).attr("value");
            hId = $($(xml).find("RootNodulo")[0]).attr("hierarquiaId");
        }

        $("#mainWindow").append("<div class='node-content-title'>within current context</div>");

        var itemAdded = false;
        $(xml).find("Nodulo").each(function () {
            if ($(this).attr("value") != id) {
                itemAdded = true;
                $("#mainWindow").append("<div id='" + $(this).attr("value") + "::" + $(this).attr("hierarquiaId") + "' class='node-box' onclick='app.loadNode(" + $(this).attr("value") + "," + $(this).attr("hierarquiaId") + ");'>" + $(this).attr("label") + "</div>");
            }
        });
        if(!itemAdded) {
            $("#mainWindow").append("<div class='call-notice'>no further context development</div>");
        }

        app.loadNodeContexts(id);
    }
}

function afterGetNodeContexts(xml, cached) {
    //store in local db
    if(cached != true) {
        storeList(currentId, 0, 'contexts' , xml);
    }

    //render interface
    $("#mainWindow").append("<div class='node-content-title'>all node contexts</div>");
    $(xml).find("RootNodulo").each(function () {
        $("#mainWindow").append("<div id='" + $(this).attr("value") + "::" + $(this).attr("hierarquiaId") + "' class='node-box' onclick='app.loadNode(" + $(this).attr("value") + "," + $(this).attr("hierarquiaId") + ");'>" + $(this).attr("label") + "</div>");
    });

}