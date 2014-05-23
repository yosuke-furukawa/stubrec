var fs = require("fs");
var request = require('request');
var JSONStream = require('JSONStream');

module.exports = Stubrec;

function Stubrec(option) {
  var option = option || {};
  this.proxy = option.proxy || "http://localhost:3001";
  this.debug = option.debug || false;
}

// request server
Stubrec.prototype.record = function (filepath, req, res) {
  if (this.debug) {
    console.log("\033[36m" + "[request url] = " + req.url +"\033[39m");
    console.log("\033[36m" + "[store filepath] = " + filepath +"\033[39m");
    console.log("\033[36m" + "[request proxy] = " + this.proxy +"\033[39m");
  }

  var stringify = JSONStream.stringifyObject("", "\n,\n", "");
  var reqstream = request(this.proxy + req.url);
  var fsWriteStream = fs.createWriteStream(filepath);
  req.pipe(reqstream);
  //reqstream.pipe(stringify)
  reqstream.pipe(fsWriteStream);
  reqstream.pipe(res);
};
