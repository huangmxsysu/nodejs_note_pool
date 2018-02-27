var Layer = require('./layer.js');
var Route = require('./route.js');
var http = require('http');

var Router = function () {
  //stack属性
  this.stack = [new Layer('*', function (req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/plain'
    });
    res.end('404');
  })];
};

Router.prototype.handle = function (req, res) {
  var self = this;
  var method = req.method;
  //从索引1开始
  for (var i = 1, len = self.stack.length; i < len; i++) {
    if (self.stack[i].match(req.url) &&
      self.stack[i].route && self.stack[i].route.has_handles_method(method)) {
      return self.stack[i].handle_request(req, res);  //也就是route.dispatch(req,res)丢进去的handle，负责处理method
    }
  }
  return self.stack[0].handle_request(req, res);
}

Router.prototype.route = function(path){
  var route = new Route(path);//是不是得检查已有path的route?
  var layer = new Layer(path,route.dispatch.bind(route));
  layer.route = route;
  this.stack.push(layer);
  return route;
}

http.METHODS.forEach(function(method) {
  method = method.toLowerCase();
  Router.prototype[method] = function(path, fn) {
    var route = this.route(path);
    route[method].call(route, fn);

    return this;
  };
});

exports = module.exports = Router;
