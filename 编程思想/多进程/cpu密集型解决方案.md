# 深入理解child_process

## **child_process**

### **fork**
fork()得到的并不是子进程，而是一个全新的Node.js程序实例。并且每个新实例至少需要30ms的启动时间和10M内存，也就是说通过fork()繁衍进程，不光是充分利用了CPU，也需要很多内存，所以不能fork()太多。

#### **long run --> 子线程**

模拟event loop以最快的速度运转，不断地向控制台中输出.
```js
(function printForever () {
  process.stdout.write(".");
  setImmediate(printForever);
})();
```
在这段代码中再加上一个计算斐波那契数列的任务(long run)
```js
function fibo (n) {
  return n > 1 ? fibo(n - 1) + fibo(n - 2) : 1;
}

(function fiboLoop () {
  process.stdout.write(fibo(40).toString());
  setImmediate(fiboLoop);
})();

(function printForever() {
  process.stdout.write(".");
  setImmediate(printForever);
})();
```
计算斐波那契数列是一个CPU密集型的任务，event loop要在计算结果出来后才有机会进入下一个tick，执行输出.的简单任务，感觉就像服务器死掉了一样。在我的机器上计算斐波那契数列时，取值45可以明显感觉到程序的停滞，你可以根据自己的CPU性能调节该值。

把CPU密集型(long run)任务分给子进程（child_process.fork()）
```js
//parent.js
var cp = require('child_process');

var child = cp.fork(__dirname+'/child.js');

child.on('message', function(m) {
  process.stdout.write(m.result.toString());
});

(function fiboLoop () {
  child.send({v:40});
  setImmediate(fiboLoop);
})();


(function spinForever () {
  process.stdout.write(".");
  setImmediate(spinForever);
})();
```
在主进程中用cp.fork()创建了子进程child，并用child.on('message', callback)监听子进程发来的消息，输出计算结果。现在的fiboLoop()也不再执行具体的计算操作，只是用child.send({v:40});不停的发消息给子进程。
```js
//child.js
function fibo (n) {
  return n > 1 ? fibo(n - 1) + fibo(n - 2) : 1;
}

process.on('message', function(m) {
  process.send({ result: fibo(m.v) });
});
```
运行node parent.js，结果跟我们预期的一样，输出.的任务不再受到阻塞，欢快地在屏幕上刷了一大堆.，然后每隔一段输出一个165580141

![](images/cpu-bound.png)


## **cluster**
借助cluster模块，Node.js程序可以同时在不同的内核上运行多个”工人进程“，每个”工人进程“做的都是相同的事情，并且可以接受来在同一个TCP/IP端口的请求。相对于在Ngnix或Apache后面启动几个Node.js程序实例而言，cluster用起来更加简单便捷。虽然cluster模块繁衍线程实际上用的也是child_process.fork，但它对资源的管理要比我们自己直接用child_process.fork管理得更好[link-->深入理解cluster]()。
```js
function fibo (n) {
  return n > 1 ? fibo(n - 1) + fibo(n - 2) : 1;
}

var cluster= require('cluster');

if (cluster.isMaster) {
    cluster.fork();
} else {
    (function fiboLoop () {
        process.stdout.write(fibo(40).toString());
        process.nextTick(fiboLoop);
    })();
}

(function spinForever () {
  process.stdout.write(".");
  process.nextTick(spinForever);
})();
```
**这种方法资源占用比单纯child_process.fork少，充分利用资源且简单，但它只是解决了负载分配的问题**。但其实做得也不是特别好，在0.10版本之前，cluster把负载分配的工作交给了操作系统，然而实践证明，最终负载都落在了两三个进程上，分配并不均衡。所以在0.12版中，cluster改用round-robin方式分配负载。详情请参见这里[link-->Node.js V0.12新特性之Cluster轮转法负载均衡](https://gist.github.com/wuhaixing/bed6a4b60941b86f32e7)。

## **third-part module**
除了Node.js官方提供的API，Node.js社区也为这个问题贡献了几个第三方模块。
### **[compute-cluster](https://github.com/lloyd/node-compute-cluster)**
比如Mozilla Identity团队为Persona开发的node-compute-cluster。这个模块可以繁衍和管理完成特定计算的一组进程。你可以设定最大进程数，然后由node-compute-cluste根据负载确定进程数量。它还会追踪运行进程的数量，以及工作完成的平均时长等统计信息，方便你分析系统的处理能力。

```js
//computeClusterParent.js
const computecluster = require('compute-cluster');

// 分配计算集群
var cc = new computecluster({ module: './computeClusterChild.js' });

// 并行运行工作
cc.enqueue({ input: 38 }, function (error, result) {
  console.log("38：", result);
});
cc.enqueue({ input: 39 }, function (error, result) {
  console.log("39：", result);
});
cc.enqueue({ input: 40 }, function (error, result) {
  console.log("40：", result);
});
```
{input:38}会调用send方法发送给子进程，子进程通过process.on('message')接收输入，然后调用process.send返回给主进程，主进程回调中获得结果，并输出
```js
//computeClusterChild.js
function fibo (n) {
  return n > 1 ? fibo(n - 1) + fibo(n - 2) : 1;
}
process.on('message', function(m) {
  var output;
  var output = fibo(m.input);
  process.send(output);
});
```

### **[threads-a-gogo](https://github.com/xk/node-threads-a-gogo)**
参考文献的一篇文章[Why you should use Node.js for CPU-bound tasks](http://neilk.net/blog/2013/04/30/why-you-should-use-nodejs-for-CPU-bound-tasks/)介绍了一个拼字游戏解密程序[LetterPwn](https://github.com/neilk/letterpwn)，其中就是用threads_a_gogo管理CPU密集型计算线程的。

node版本在6以上好像安装threads_a_gogo会出问题，所以切换node版本到5`nvm use 5`然后安装就没问题了

>Threads 又称线程，他可以在同一时刻并行的执行，他们共享主进程的内存，在其中某一时刻某一个threads锁死了，是不会影响主线程以及其他线程的执行。但是为了实现这个模型，我们不得不消耗更多的内存和cpu为线程切换的开销，同时也存在可能多个线程对同一内存单元进行读写而造成程序崩溃的问题。

>很多让node支持多线程的方法是使用c/c++的addon来实现，在需要进行cpu密集型计算的地方，把js代码改写成c/c++代码，但是如果开发人员对c++不是很熟悉，一来开发效率会降低不少，二来也容易出bug，而且我们知道在addon中的c++代码除了编译出错外，是很难调试的，毕竟没有vs调试c++代码方便。

```js
function fibo (n) {
  return n > 1 ? fibo(n - 1) + fibo(n - 2) : 1;
}

var numThreads= 10;
var threadPool= require('threads_a_gogo').createPool(numThreads).all.eval(fibo);

threadPool.all.eval('fibo(40)', function cb (err, data) {
  process.stdout.write(" ["+ this.id+ "]"+ data);
  this.eval('fibo(40)', cb);
});

(function printForever () {
  process.stdout.write(".");
  setImmediate(printForever);
})();
```

cluster对比threads_a_gogo:

如果是动态计算斐波那契数组的结果，编码将更加困难，需要在fork时挂上不同的参数，出错的几率也更大。同时还有更重要的一个事情，如果是创建一个http服务器，如果4个cluster都在计算fibo，那第5个请求node将无法处理，而是用TAGG则还是能够正常处理的，所以cluster并不能解决单线程模型的cpu密集计算带来的阻塞问题
