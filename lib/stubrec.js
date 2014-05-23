var fs = require("fs");
var path = require("path");
var request = require('request');
var StringifyStream = require('str-stream');
var mkdirp = require('mkdirp');

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
  mkdirp(path.dirname(this.basepath + filepath), function(err) {
    if (err) {
      console.error(err);
      return;
    }
    var fsWriteStream = fs.createWriteStream(this.basepath + filepath);
    if (req.body && Object.keys(req.body).length > 0) {
      // express body parser is called..
      // req stream is already closed
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
  }.bind(this));
};

