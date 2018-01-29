* 默认情况下，在 Node.js 的父进程与衍生的子进程之间会建立 stdin、stdout 和 stderr 的管道。 数据能以非阻塞的方式在管道中流通。 注意，有些程序会在内部使用 **行缓冲 I/O**。 虽然这并不影响 Node.js，但这意味着发送到子进程的数据可能无法被立即使用。
* 它支持和 child_process.exec() 一样的选项。 由于没有衍生 shell，因此不支持像 I/O 重定向和文件查找这样的行为。
* 衍生的 Node.js 子进程与两者之间建立的 IPC 通信信道的异常是独立于父进程的
* 使用自定义的 execPath 启动的 Node.js 进程，会使用子进程的环境变量 NODE_CHANNEL_FD 中指定的文件描述符（fd）与父进程通信。 fd 上的输入和输出期望被分割成一行一行的 JSON 对象。
* **注意**：某些平台（macOS, Linux）会使用 argv[0] 的值作为进程的标题，而其他平台（Windows, SunOS）则使用 command。

* **注意**，Node.js 一般会在启动时用 process.execPath 重写 argv[0]，所以 Node.js 子进程中的 process.argv[0] 不会匹配从父进程传给 spawn 的 argv0 参数，可以使用 process.argv0 属性获取它。
* options.detached
* options.stdio
* 一旦一个 socket 已被传给了子进程，则父进程不再能够跟踪 socket 何时被销毁。 为了表明这个，.connections 属性会变成 null。 当发生这种情况时，建议不要使用 .maxConnections。建议在子进程中的任何 message 处理程序都需要验证 socket 是否存在，因为连接可能会在它在发送给子进程的这段时间内被关闭。

```js
const { fork } = require('child_process');
const normal = fork('subprocess.js', ['normal']);
const special = fork('subprocess.js', ['special']);

// 开启 server，并发送 socket 给子进程。
// 使用 `pauseOnConnect` 防止 socket 在被发送到子进程之前被读取。
const server = require('net').createServer({ pauseOnConnect: true });
server.on('connection', (socket) => {

  // 特殊优先级
  if (socket.remoteAddress === '74.125.127.100') {
    special.send('socket', socket);
    return;
  }
  // 普通优先级
  normal.send('socket', socket);
});
server.listen(1337);
```
subprocess.js 会接收到一个 socket 句柄，并作为第二个参数传给事件回调函数：

```js
process.on('message', (m, socket) => {
  if (m === 'socket') {
    socket.end(`请求被 ${process.argv[2]} 优先级处理`);
  }
});
process.on('message', (m, socket) => {
  if (m === 'socket') {
    if (socket) {
      // 检查客户端 socket 是否存在。
      // socket 在被发送与被子进程接收这段时间内可被关闭。
      socket.end(`请求被 ${process.argv[2]} 优先级处理`);
    }
  }
});
```
* subprocess.stdin 注意，如果一个子进程正在等待读取所有的输入，则子进程不会继续直到流已通过 end() 关闭。
* ### **subprocess.send(message[, sendHandle[, options]][, callback])**
options 支持以下属性：

keepOpen - 一个 Boolean 值，当传入 net.Socket 实例时可用。 当为 true 时，socket 在发送进程中保持打开。 默认为 false。
