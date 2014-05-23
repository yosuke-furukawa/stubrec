var Stubrec = require('../index');
var stubrec = new Stubrec({proxy : "http://localhost:3001", debug : true});
var http = require("http");
var fs = require("fs");
var getRawBody = require('raw-body');
var assert = require("power-assert");

describe('Stubrec hijack request body', function() {
  var front, back;
  before(function(done) {
    front = http.createServer(function(req, res){
      getRawBody(req, function(err, string) {
        req.body = string;
        stubrec.record("./test/jsonrpc_hijacked.json", req, res);
      });
    }).listen(3000);
    front.on("listening", function(){
      back = http.createServer(function(req, res){
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end('{"hello":"world"}');
      }).listen(3001);
      back.on("listening", done);
    });
  });
  after(function(done) {
    back.on("close", function(){
      front.on("close", done);
      front.close();
    });
    back.close();
  });
  it("should return hello.json", function(done){
    var opt = {
      hostname: 'localhost',
      port : 3000,
      path : '/jsonrpc',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json' 
      }
    };
    var req = http.request(opt, function(res){
      var data = '';
      res.on("data", function(chunk){
        data += chunk;
      });
      res.on("end", function(){
        assert.deepEqual(JSON.parse(data), JSON.parse('{"hello":"world"}'));
        fs.readFile("./test/jsonrpc_hijacked.json", function(err, d) {
          assert.deepEqual(JSON.parse(d), JSON.parse('{"hello":"world"}'));
          done();
        });
      });
    });
    var reqBody = {
      jsonrpc: 2.0,
      method: 'sum',
      id: 1,
      params: [123, 456]
    };
    req.write(JSON.stringify(reqBody));
    req.end();
  });
});


