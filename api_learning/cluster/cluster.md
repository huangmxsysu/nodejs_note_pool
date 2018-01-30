# cluster

## cluster模块的作用
cluster模块允许设立一个主进程和若干个worker进程，由主进程监控和协调worker进程的运行。**worker之间采用进程间通信交换消息**，cluster模块内置一个负载均衡器，采用**Round-robin算法**协调各个worker进程之间的负载。运行时，所有新建立的链接都由主进程完成，然后主进程再把TCP连接分配给指定的worker进程。
```js
var cluster = require('cluster');
var os = require('os');

if (cluster.isMaster){
  for (var i = 0, n = os.cpus().length; i < n; i += 1){
    cluster.fork();
  }
} else {
  http.createServer(function(req, res) {
    res.writeHead(200);
    res.end("hello world\n");
  }).listen(8000);
}
```
上面这段代码有一个缺点，就是一旦work进程挂了，主进程无法知道。为了解决这个问题，可以在主进程部署online事件和exit事件的监听函数。
```js
var cluster = require('cluster');

if(cluster.isMaster) {
  var numWorkers = require('os').cpus().length;
  console.log('Master cluster setting up ' + numWorkers + ' workers...');

  for(var i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('online', function(worker) {
    console.log('Worker ' + worker.process.pid + ' is online');
  });

  cluster.on('exit', function(worker, code, signal) {
    console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
    console.log('Starting a new worker');
    cluster.fork();
  });
}
```
主进程一旦监听到worker进程的exit事件，就会重启一个worker进程。worker进程一旦启动成功，可以正常运行了，就会发出online事件。

## worker 对象
worker对象是cluster.fork()的返回值，代表一个worker进程。
它的属性和方法如下。

（1）worker.id

worker.id返回当前worker的独一无二的进程编号。这个编号也是cluster.workers中指向当前进程的索引值。

（2）worker.process

所有的worker进程都是用child_process.fork()生成的。child_process.fork()返回的对象，就被保存在worker.process之中。通过这个属性，可以获取worker所在的进程对象。

（3）worker.send()

该方法用于在主进程中，向子进程发送信息。
```js
if (cluster.isMaster) {
  var worker = cluster.fork();
  worker.send('hi there');
} else if (cluster.isWorker) {
  process.on('message', function(msg) {
    process.send(msg);
  });
}
```
