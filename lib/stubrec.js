var fs = require("fs");
var path = require("path");
var http = require("http");
var StringifyStream = require('str-stream');
var mkdirp = require('mkdirp');

module.exports = Stubrec;

function Stubrec(option) {
  var option = option || {};
  this.basepath = option.basepath || "";
  this.target = option.target || "http://localhost:3001";
  this.debug = option.debug || false;
  this.proxy = typeof option.proxy !== "undefined" ? option.proxy : process.env.http_proxy;
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
    console.log("\033[36m" + "[request target] = " + this.target +"\033[39m");
  }

  var ss = new StringifyStream();
  var reqstream;
  var filepath = this.fileFromRequest(req.url, filepath);
  mkdirp(path.dirname(this.basepath + filepath))
    .catch(function(err) {
      console.error(err);
      return;
    })
    .then(function() {
      var fsWriteStream = fs.createWriteStream(this.basepath + filepath);
      delete req.headers['accept-encoding'];
      if (req.body && Object.keys(req.body).length > 0) {
        reqstream = http.request(this.target + req.url, {
          method : req.method,
          headers : req.headers
          // TODO old request module handled proxy
          //proxy: this.proxy
        }, function(response) {
          response.pipe(ss).pipe(fsWriteStream);
          response.pipe(res);
        });
        reqstream.end(JSON.stringify(req.body))
      } else {
        reqstream = http.request(this.target + req.url, {
          // TODO old request module handled proxy
          //proxy: this.proxy
        }, function(response) {
          response.pipe(ss).pipe(fsWriteStream);
          response.pipe(res);
        });
        req.pipe(reqstream);
      }
    }.bind(this));
};
