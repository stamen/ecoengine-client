(function() {
  "use strict";

  function EcoengineClient() {

    var that = this;

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
        return xmlHttp.send();
      } else {
        return false;
      }
    }

    var pages = [],
    thisPage, firstCallback, firstProgress;

    function requestRecursive(uri, callback, progress, options) {

      options = options || {};

      if (callback) {
        firstCallback = callback;
      }

      if (progress) {
        firstProgress = progress;
      }

      request(uri, function(e, r) {

        thisPage = JSON.parse(r.responseText);

        pages = pages.concat(thisPage.features || thisPage.response.features);

        if (thisPage.next) {

          firstProgress(pages);
          requestRecursive(thisPage.next, null);

        } else {

          firstCallback(pages);
          pages = [];

        }

      });

    }

    //
    // Public interface
    //
    that.requestRecursive = requestRecursive;

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
