(function() {
  "use strict";

  function EcoengineClient() {

    var that              = this,
        recursiveRequests = {};

    //
    // Create a unique id for layers
    // lifted from http://stackoverflow.com/a/8809472
    //
    function getUniqueId() {
        var d = new Date().getTime(),
            newId, r;

        newId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        });

        return newId;
    }

    function request(uri, callback) {
      if (window && window.XMLHttpRequest) {
        var xmlHttp = null;

        xmlHttp = new window.XMLHttpRequest();

        xmlHttp.onreadystatechange = function() {
          if ((xmlHttp.readyState | 0) === 4 /*Done*/) {
            if ((xmlHttp.status|0) === 200 ) {

              callback(null, xmlHttp);
            } else {
              callback(xmlHttp);
            }
          }
        };

        xmlHttp.open("GET", uri, true);
        xmlHttp.setRequestHeader('Accept', 'application/vnd.geo+json');
        xmlHttp.send();
        return xmlHttp;
      } else {
        return false;
      }
    }

    var thisPage, firstCallback, firstProgress;

    function requestRecursive(uri, callback, progress, options) {

      options = options || {};

      var id = options.appendTo || getUniqueId();

      if (!recursiveRequests[id]) {
        recursiveRequests[id] = [];
      }

      //console.log(id);

      recursiveRequests[id].push({
        "id"  : id,
        "uri" : uri,
        "xhr" : request(uri, function(err, r) {

          if (recursiveRequests[id][0] && recursiveRequests[id][0].callback) {
            if (err) {
              stopRecursiveRequest(id);
              return recursiveRequests[id][0].callback(err);
            }

            try {
              thisPage = JSON.parse(r.responseText);
            } catch (err) {
              stopRecursiveRequest(id);
              return recursiveRequests[id][0].callback(err);
            }

            if (!recursiveRequests[id].pages) {
              recursiveRequests[id].pages = [];
            }

            recursiveRequests[id].pages = recursiveRequests[id].pages.concat(thisPage.features || thisPage.response.features);

            that.fire("page-recieved", {
              "data"   : recursiveRequests[id].pages,
              "target" : recursiveRequests[id]
            });

            if (thisPage.next && thisPage.next !== "null" && recursiveRequests[id] && recursiveRequests[id][0]) { //Don't continue if this requst has been deleted from the recursiveRequests object

              recursiveRequests[id][0].progress(null, recursiveRequests[id].pages);

              setTimeout(function() {
                requestRecursive(thisPage.next, null, null, {"appendTo":id});
              }, 100);

            } else {

              recursiveRequests[id][0].callback(null, recursiveRequests[id].pages);
              delete recursiveRequests[id];

            }
          }

        }),
        "callback" : (callback || (recursiveRequests[id][0] ? recursiveRequests[id][0].callback : null)),
        "progress" : (progress || (recursiveRequests[id][0] ? recursiveRequests[id][0].progress : null))
      });

      //console.log(recursiveRequests[id]);

      return recursiveRequests[id];

    }

    //
    // Stop recursive requests by aborting their current XHR and
    // removeing it's entry in the recursiveRequests object which
    // is checked before going on to fetch each page
    //
    function stopRecursiveRequest(id) {

      if (recursiveRequests[id] && recursiveRequests[id][0].xhr) {

        recursiveRequests[id].forEach(function(req) {

          req.callback();

          req.xhr.abort();

          req = false;
        });

        recursiveRequests[id] = false;

      } else {
        return false;
      }

    }


    //
    // Public interface
    //
    that.requestRecursive     = requestRecursive;
    that.stopRecursiveRequest = stopRecursiveRequest;

    return that;

  }

  //
  // Make available to STMN namespace
  //
  if (typeof window.STMN !== "object") {
    window.STMN = {};
  }

  window.STMN.EcoengineClient = STPX.samesies.extend(EcoengineClient);

  //
  // Make available to CommonJS
  //
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = STMN.EcoengineClient;

  // Make available to AMD module
  } else if (typeof define === "function" && define.amd) {
    define(["samesies"], STMN.EcoengineClient);
  }

}());
