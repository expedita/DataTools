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
        //alert(message);
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

    search: function () {
        clearAjax();
        showSearchForm();
    },

    loadNode: function (id, hId) {
        lastId = currentId;
        lastHId = currentHId;
        currentId = id;
        currentHId = hId;

        $('html, body').animate({ scrollTop: 0 }, 'slow');
        try{ G.clear(); jsnx.draw(G,'#canvas'); } catch(e){ };
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
    },

    loadNodeRelations: function (id) {
        try { nodeRelationsCall.abort(); } catch (ex) { }

        loadList(id, 0, 'relations').then(function(doc) {
            //if(doc == null) throw('invalid cache');
            afterGetNodeRelations(doc, true);
        }).catch(function() {
            nodeRelationsCall=doCall("xml", "relationGraph", "&id="+id, afterGetNodeRelations);
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
    $(xml).find("Error").each(function () {
        $("#mainWindow").append("<div class='error-content'>");
        $("#mainWindow").append("<div class='error-description'>" + $(this).text() + "</div>");
        $("#mainWindow").append("</div>");
    });

    $(xml).find("Nodulo").each(function () {
        $("#mainWindow").append("<div class='node-content' id='nodeContent'>");
        $("#nodeContent").append("<span class='node-name'>" + $(this).children("Referencia").text() + "</span><br />");
        $("#nodeContent").append("<span class='node-type'>" + $(this).children("Tipoe").text() + "</span><br />");
        $("#nodeContent").append("<div class='node-description'>" + $(this).children("Descricao").text().replace(/(\r\n|\n|\r)/g, "<br />") + "</div>");

        if ($(this).children("HierarquiaId").text() != "-1") {
            $("#mainWindow").append("<div class='node-context'>" + $(this).children("Context").text().replace(/(\r\n|\n|\r)/g, "<br />") + "</div>");
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

        var newHTml = "<div class='node-children' ><div class='node-content-title'>within current context</div>";

        var itemAdded = false;
        $(xml).find("Nodulo").each(function () {
            if ($(this).attr("value") != id) {
                itemAdded = true;
                newHTml += "<div id='" + $(this).attr("value") + "::" + $(this).attr("hierarquiaId") + "' class='node-box' onclick='app.loadNode(" + $(this).attr("value") + "," + $(this).attr("hierarquiaId") + ");'>" + $(this).attr("label") + "</div>";
            }
        });
        if(!itemAdded) {
            newHTml += "<div class='call-notice'>no further context development</div>";
        }
        newHTml += "</div>";
        $("#mainWindow").append(newHTml);
    }
    app.loadNodeContexts(id);
}

function afterGetNodeContexts(xml, cached) {
    //store in local db
    if(cached != true) {
        storeList(currentId, 0, 'contexts' , xml);
    }

    //render interface
    var newHTml = "<div class='node-contexts'><div class='node-content-title'>all node contexts</div>";
    try {
        $(xml).find("RootNodulo").each(function () {
            newHTml += "<div id='" + $(this).attr("value") + "::" + $(this).attr("hierarquiaId") + "' class='node-box' onclick='app.loadNode(" + $(this).attr("value") + "," + $(this).attr("hierarquiaId") + ");'>" + $(this).attr("label") + "</div>";
        });
    } catch (e) { };
    newHTml += "</div>";
    $("#mainWindow").append(newHTml);

    app.loadNodeRelations(currentId);
}

var G;
function afterGetNodeRelations(xml, cached) {
    //store in local db
    if(cached != true) {
        storeList(currentId, 0, 'relations' , xml);
    }

    G = new jsnx.Graph();

    //var nodes = [];
    $(xml).find("Node").each(function () {
        //nodes.push($(this).attr("id"));
        G.addNodesFrom([$(this).attr("id")], {ref: $(this).attr("prop"), label: $(this).attr("ref"), id: $(this).attr("id")});
    });

    $(xml).find("Edge").each(function () {
        G.addEdgesFrom([[$(this).attr("fromID"), $(this).attr("toID")]]);
    });

    //G.addNodesFrom(['test',2,3,4], {group:0});
    //G.addNodesFrom([5,6,7], {group:1});
    //G.addNodesFrom([8,9,10,11], {group:2});

    //G.addPath(['test',2,5,6,7,8,11]);
    //G.addEdgesFrom([['test',3],['test',4],[3,4],[2,3],[2,4],[8,9],[8,10],[9,10],[11,10],[11,9]]);

    var color = d3.scale.category20();
    jsnx.draw(G, {
        element: '#canvas',
        layoutAttr: {
            friction: 0.8,
            charge: -90,
            linkDistance: 150,
            gravity: 0.01
        },
        nodeShape : 'ellipse',
        nodeAttr: {
            rx: 60,
            ry: 15,
            title: function(d) { return d.data.ref; },
            tag: function(d) { return d.data.id; },
            onclick: function (d) { return "app.loadNode(" + d.node + ",-1); "; }
        },
        nodeStyle: {
            fill: function(d) { 
                return color(d.data.group); 
            },
            stroke: 'none'
        },
        edgeStyle: {
            fill: '#999'
        },
        withLabels: true,
        labels: 'ref',
        labelStyle: { 'font-size': '10px' }
    });
}

//NODE SEARCH FUNCTIONS

function showSearchForm() {
    //clear the screen
    document.getElementById("nodeEditForm").style.display = "none";
    $("#mainWindow").empty();

    //add search form
    var txtHTML = "";
    txtHTML += "<div class='search-type-div'>";
    txtHTML += "<select size='4' class='search-select' id='nodeType'>" + "<option selected value='0'>All</option>"
                                + "<option selected value='7'>Folder</option>"
                                + "<option selected value='906'>Generic</option>"
                                + "<option selected value='1'>Entidade</option>"
                                + "</select>";
    //txtHTML += "<div>Reference&nbsp;";
    txtHTML += "<input type='text' value='' id='searchText'  placeholder='node name' class='search-input' />";
    txtHTML += "<input type='button' value='search' onclick='javscript:dosearch();' class='search-button' />";
    txtHTML += "</div>";
    txtHTML += "</div>";
    $("#mainWindow").append(txtHTML);
}

function dosearch() {
    var type = document.getElementById("nodeType").value;
    var text = document.getElementById("searchText").value;

    clearAjax();
    doCall("xml", "getNodesByRefAndType", "&ref="+text+"&type="+type, afterDoSearch);
}

function afterDoSearch(xml, cached) {
    $("#mainWindow").empty();

    //render interface
    $("#mainWindow").append("<div class='node-content-title'>results list</div>");
    $(xml).find("Nodulo").each(function () {
        $("#mainWindow").append("<div id='" + $(this).attr("Value") + "::" + $(this).attr("HierarquiaId") + "' class='node-box' onclick='app.loadNode(" + $(this).attr("Value") + "," + $(this).attr("HierarquiaId") + ");'>" + $(this).attr("Ref") + "</div>");
    });

}

//INTERFACE BEHAVIOUR
function nodeEditToggle() {
    var hidden = $("#nodeEditFormFields").css("display");
    if(hidden == "none") {
        $("#nodeEditFormFields").show();
    } else {
        $("#nodeEditFormFields").hide();
    }
}