const http = require('http')
// module.exports = express
function express(){
  let midFn = []
  let app = function(req,res){
    let i = 0;
    function next(){
      let midware = midFn[i++]
      if(!midware) return;
      midware(req,res,next);
    }
    next()
  }
  app.use = function(midware){
    midFn.push(midware);
  }
  return app;
}

var app = express();
http.createServer(app).listen('3000', function () {
    console.log('listening 3000....');
});

function middlewareA(req, res, next) {
    console.log('middlewareA before next()');
    next();
    console.log('middlewareA after next()');
}

function middlewareB(req, res, next) {
    console.log('middlewareB before next()');
    next();
    console.log('middlewareB after next()');
}

function middlewareC(req, res, next) {
    console.log('middlewareC before next()');
    next();
    console.log('middlewareC after next()');
}

app.use(middlewareA);
app.use(middlewareB);
app.use(middlewareC);
// middlewareA before next()
// middlewareB before next()
// middlewareC before next()
// middlewareC after next()
// middlewareB after next()
// middlewareA after next()