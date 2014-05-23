Stubrec
===============

Stubrec records json file and proxy request and response.

Usage
===============

```sh
$ npm install stubrec -S
```

```javascript
var Stubrec = require('stubrec');
var stubrec = new Stubrec({
  // proxy property specifies backend server
  proxy : "http://localhost:3001", 
  // debug print on
  debug : true
});
var http = require("http");

http.createServer(function(req, res){
    //record to ./test/test.json
    stubrec.record("./test/test.json", req, res);
}).listen(3000);

http.createServer(function(req, res){
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end('{"hello":"world"}');
}).listen(3001);

http.get("http://localhost:3000/", function(res){
    var data = '';
    res.on("data", function(chunk){
      data += chunk;
    });
    res.on("end", function(){
      // {"hello":"world"}
      console.log(data);
      done();
    });
});

```

