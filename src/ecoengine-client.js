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
        xmlHttp.send();
        return xmlHttp;
      } else {
        return false;
      }
    }

    var pages = [],
    thisPage, firstCallback, firstProgress;

    function requestRecursive(uri, callback, progress, options) {

      options = options || {};

      var id = options.appendTo || getUniqueId();

      if (callback) {
        firstCallback = callback;
      }

      if (progress) {
        firstProgress = progress;
      }

      recursiveRequests[id] = {
        "id"  : id,
        "xhr" : request(uri, function(e, r) {

          try {
            thisPage = JSON.parse(r.responseText);
          } catch (err) {
            firstCallback(null);
          }

          pages = pages.concat(thisPage.features || thisPage.response.features);

          if (thisPage.next && recursiveRequests[id]) { //Don't continue if this requst has been deleted from the recursiveRequests object

            firstProgress(pages);
            requestRecursive(thisPage.next, null, null, {"appendTo":id});

          } else {

            firstCallback(pages);
            delete recursiveRequests[id];
            pages = [];

          }

        }),
        "callback" : firstCallback
      };

      return recursiveRequests[id];

    }

    //
    // Stop recursive requests by aborting their current XHR and
    // removeing it's entry in the recursiveRequests object which
    // is checked before going on to fetch each page
    //
    function stopRecursiveRequest(id) {

      if (recursiveRequests[id] && recursiveRequests[id].xhr) {

        recursiveRequests[id].callback(null);

        recursiveRequests[id].xhr.abort();

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

  window.STMN.EcoengineClient = EcoengineClient;

  //
  // Make available to CommonJS
  //
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = STMN.EcoengineClient;

  // Make available to AMD module
  } else if (typeof define === "function" && define.amd) {
    define(STMN.EcoengineClient);
  }

}());
