var cluster = require('cluster');
var numCPUs = 8;
function fibo (n) {
  return n > 1 ? fibo(n - 1) + fibo(n - 2) : 1;
}
console.time('8 cluster');
if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  var i = 8;
  cluster.on('exit', function(worker, code, signal) {
        if(!--i){
            console.timeEnd('8 cluster');
            process.exit(0);
        }
  });
} else {
    console.log(fibo (40));
    process.exit(0);
}
