* cluster模块内置一个负载均衡器，采用Round-robin算法协调各个worker进程之间的负载
* 当前socket的data事件，也可以用id属性识别worker进程。
```js
socket.on('data', function(id) {
  var worker = cluster.workers[id];
});
```
* **worker进程**调用listening方法以后，“listening”事件就传向该进程的服务器，然后传向主进程。
* **不中断地重启Node服务**

思路

重启服务需要关闭后再启动，利用cluster模块，可以做到先启动一个worker进程，再把原有的所有work进程关闭。这样就能实现不中断地重启Node服务。
[阮一峰nodejs](http://javascript.ruanyifeng.com/nodejs/cluster.html)

* PM2模块