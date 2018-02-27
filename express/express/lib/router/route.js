var Layer = require('./layer.js');
var http = require('http');

var Route = function(path) {
    this.path = path;
    this.stack = [];

    this.methods = {};
};
Route.prototype.has_handles_method = function(method) {
  var name = method.toLowerCase();
  return Boolean(this.methods[name]);
};

Route.prototype.dispatch = function(req, res) {
  var self = this,
      method = req.method.toLowerCase();

  for(var i=0,len=self.stack.length; i<len; i++) {
      if(method === self.stack[i].method) {
          return self.stack[i].handle_request(req, res);
      }
  }
};

http.METHODS.forEach(function(method) {
  method = method.toLowerCase();
  Route.prototype[method] = function(fn) {
      var layer = new Layer('/', fn); //path已经在route(path)加载到this.path了，这里就'/'
      layer.method = method;

      this.methods[method] = true;
      this.stack.push(layer);

      return this;  //链接效果
  };
});


exports = module.exports = Route;