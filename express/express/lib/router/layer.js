function Layer(path, fn) {
  this.handle = fn;
  // this.name = fn.name || '<anonymous>';
  this.path = path;
}

//简单处理
Layer.prototype.handle_request = function (req, res) {
  this.handle && this.handle(req,res)
};


//简单匹配
Layer.prototype.match = function (path) {
  return (path === this.path || path === '*')
};


exports = module.exports = Layer;