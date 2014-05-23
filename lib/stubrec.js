var fs = require("fs");
var request = require('request');
var StringifyStream = require('str-stream');

module.exports = Stubrec;

function Stubrec(option) {
  var option = option || {};
  this.basepath = option.basepath || "";
  this.proxy = option.proxy || "http://localhost:3001";
  this.debug = option.debug || false;
}

Stubrec.prototype.fileFromRequest = function(requestUrl, filepath) {
  var url = requestUrl;
  var file = filepath;
  if (file) return file;
  var isSlash = url === "/";
  if (isSlash) {
    // / -> /index.json
    url += 'index.json';
  } else {
    var hasLastSlash = url.lastIndexOf("/") === (url.length-1);
    // /abc/test/ -> /abc/test
    if (hasLastSlash) url = url.substring(0, url.length-1);
    // /abc/test -> /abc/test.json
    url += '.json';
  }
  // /abc/:id.json -> /abc/id.json
  url = url.replace(/:/g, '');
  file = url;

  return file;
};

// request server
Stubrec.prototype.record = function (filepath, req, res) {
  if (res === undefined) {
    res = req;
    req = filepath,
    filepath = "";
  }
  if (this.debug) {
    console.log("\033[36m" + "[request header] = " + JSON.stringify(req.headers) +"\033[39m");
    console.log("\033[36m" + "[request url] = " + req.url +"\033[39m");
    console.log("\033[36m" + "[store filepath] = " + this.basepath + filepath +"\033[39m");
    console.log("\033[36m" + "[request proxy] = " + this.proxy +"\033[39m");
  }

  var ss = new StringifyStream();
  var reqstream;
  var filepath = this.fileFromRequest(req.url, filepath);
  var fsWriteStream = fs.createWriteStream(this.basepath + filepath);
  if (req.body) {
    // express body parser is called..
    reqstream = request({
      json : req.body,
      method : req.method,
      headers : req.headers,
      url: this.proxy + req.url
    });
  } else {
    reqstream = request(this.proxy + req.url);
    req.pipe(reqstream);
  }
  reqstream.pipe(ss).pipe(fsWriteStream);
  reqstream.pipe(res);
};

