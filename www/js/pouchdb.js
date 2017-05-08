var db;

function preparePDB() {
  cleanPDB()
  db = new PouchDB("myKb", {adapter : 'websql'});
  console.log("okay, now we have our database");
}

function cleanPDB() {
    try {
        db.destroy();
    } catch(ex) { }
}

// The below, or something like it, is necessary 
// to use PouchDB functionality!
//document.addEventListener("deviceready", onDeviceReadyPDB, false);

//=======================  NODES ====================================

function storeNode(id, idH, xml) {
    var id = 'N' + id.toString() + ':' + idH.toString();

    db.get(id).then(function (doc) { 
        db.put({
          _id: id,
          _rev: doc._rev,
          xml: xml2str(xml)
        }).then(function (response) { console.log('node ' + id.toString() + ':' + idH.toString() + ' stored');
        }).catch(function (err) { console.log(err); });
    }).catch(function (err) { 
        db.put({
          _id: id,
          xml: xml2str(xml)
        }).then(function (response) { console.log('node ' + id.toString() + ':' + idH.toString() + ' stored');
        }).catch(function (err) { console.log(err); });
    });
}

function loadNode(id, idH) {
    return db.get('N' + id.toString() + ':' + idH.toString()).then(
        function (result) {
            return parseXml(result.xml); 
        });
    //db.get('N' + id.toString() + ':' + idH.toString()).then(function(doc) {
    //    console.log('node ' + id.toString() + ':' + idH.toString() + ' loaded')
    //    return doc.xml;
    //}).catch(function (err) {
    //  console.log(err);
    //});
}

function deleteNode(id, idH) {
    var id = 'N' + id.toString() + ':' + idH.toString();
    db.get(id).then(function (doc) { db.remove(id, doc._rev); });
}

function checkNodeDeleted(id, idH) {
    var id='N'+id.toString()+':'+idH.toString();

    db.get(id).then(function (doc) { return (doc._deleted == true); })
    .catch(function (doc) { return true; });
}

//===================  NODES LISTS  =================================

function storeList(index, idH, type, xml) {
    var id = 'lst'+index.toString()+':'+idH.toString()+':'+type;

    db.get(id).then(function (doc) { 
        db.put({
          _id: id,
          _rev: doc._rev,
          xml: xml2str(xml)
        }).then(function (response) { console.log('node ' + index.toString() + ':' + idH.toString() + ':' + type + ' stored');
        }).catch(function (err) { console.log(err); });
    }).catch(function (err) { 
        db.put({
          _id: id,
          xml: xml2str(xml)
        }).then(function (response) { console.log('node ' + index.toString() + ':' + idH.toString() + ':' + type + ' stored');
        }).catch(function (err) { console.log(err); });
    });

}

function loadList(index, idH, type) {
    return db.get('lst'+index.toString()+':'+idH.toString()+':'+type).then(
        function (result) { return parseXml(result.xml); 
        });
    //db.get('lst' + index.toString() + ':' + idH.toString() + ':' + type).then(function(doc) {
    //    console.log('node ' + index.toString() + ':' + idH.toString() + ':' + type + ' loaded')
    //    return doc.xml;
    //}).catch(function (err) {
    //  console.log(err);
    //});
}

function deleteList(index, idH, type) {
    var id = 'lst'+index.toString()+':'+idH.toString()+':'+type;
    db.get(id).then(function (doc) { db.remove(id, doc._rev); });
}


//====================== GENERIC SUPPORT FUNCTIONS ==============================

function xml2str(data){
  //data.xml check for IE
  var xmlstr = data.xml ? data.xml : (new XMLSerializer()).serializeToString(data);
  return xmlstr;
}

function parseXml(xml) {
   var dom = null;
   if (window.DOMParser) {
      try { 
         dom = (new DOMParser()).parseFromString(xml, "text/xml"); 
      } 
      catch (e) { dom = null; }
   }
   else if (window.ActiveXObject) {
      try {
         dom = new ActiveXObject('Microsoft.XMLDOM');
         dom.async = false;
         if (!dom.loadXML(xml)) // parse error ..

            console.log(dom.parseError.reason + dom.parseError.srcText);
      } 
      catch (e) { dom = null; }
   }
   else
      console.log("cannot parse xml string!");
   return dom;
}
