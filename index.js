var fs = requrie("fs");

module.exports = Stubrec;

function Stubrec(option) {}

// record json file
Stubrec.prototype.record = function (filepath, json, cb) {
  if (json instanceof Buffer || json instanceof String) {
    fs.write(filepath, json, cb);
  } else {
    fs.write(filepath, JSON.strigify(json), cb);
  }
};
