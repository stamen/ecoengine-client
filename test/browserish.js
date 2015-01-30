"use strict";

var assert = require("assert"),
    fs     = require("fs");

describe("Browser", function(){

  it('Loads in a browser', function(){

    var window = {};

    eval(fs.readFileSync("./dist/browsersugar.min.js", {"encoding":"utf8"}));

    assert.equal(typeof window.STPX.browsersugar.mix, "function", ["There is no 'mix' function"]);

  });

});
