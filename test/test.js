var Stubrec = require('../index');
var stubrec = new Stubrec({target : "http://localhost:3001", debug : true});
var http = require("http");
var fs = require("fs");
var assert = require("power-assert");

describe('Stubrec request', function() {
  var front, back;
  before(function(done) {
    front = http.createServer(function(req, res){
      stubrec.record("./test/test.json", req, res);
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
    http.get("http://localhost:3000/", function(res){
      var data = '';
      res.on("data", function(chunk){
        data += chunk;
      });
      res.on("end", function(){
        assert.deepEqual(JSON.parse(data), JSON.parse('{"hello":"world"}'));
        fs.readFile("./test/test.json", function(err, d) {
          assert.deepEqual(JSON.parse(d), JSON.parse('{"hello":"world"}'));
          done();
        });
      });
    });
  });
});
