# child_process模块
默认情况下，在 Node.js 的父进程与衍生的子进程之间会建立 stdin、stdout 和 stderr 的管道

child_process.spawn() 方法会异步地衍生子进程，且不会阻塞 Node.js 事件循环。 child_process.spawnSync() 方法则以同步的方式提供同样的功能，但会阻塞事件循环，直到衍生的子进程退出或终止

child_process 模块提供了一些同步和异步的替代方法，每个替代方法都是在 child_process.spawn() 或 child_process.spawnSync() 的基础上实现的。

* child_process.spawn()
* child_process.fork()
* child_process.exec()
* child_process.execFile()

每个方法都返回一个 ChildProcess 实例。 这些对象实现了 Node.js EventEmitter 的 API，允许父进程注册监听器函数，在子进程生命周期期间，当特定的事件发生时会调用这些函数。

## **在 Windows 上衍生 .bat 和 .cmd 文件**

在类 Unix 操作系统上（Unix、 Linux、 macOS），child_process.execFile() 效率更高，因为它不需要衍生一个 shell。

但是在 Windows 上，.bat 和 .cmd 文件在没有终端的情况下是不可执行的，因此不能使用 child_process.execFile() 启动。

当在 Windows 下运行时，要调用 .bat 和 .cmd 文件，可以通过使用设置了 shell 选项的 child_process.spawn()
```js
const bat = spawn('cmd.exe', ['/c', 'my.bat']);
//或
const bat = spawn('"my script.cmd"', ['a', 'b'], { shell: true });// 如果脚本文件名包含了空格，则需要用加上引号。
```
或使用 child_process.exec()
```js
exec('my.bat', (err, stdout, stderr) => {
  // ...
});
//或
exec('"my script.cmd" a b', (err, stdout, stderr) => {
  // ...
  // 如果脚本文件名包含了空格，则需要用加上引号。
});
```
或衍生 cmd.exe 并将 .bat 或 .cmd 文件作为一个参数传入（也就是 shell 选项和 child_process.exec() 所做的工作）。

## **child_process.exec(command[, options][, callback])**
衍生一个 shell，然后在 shell 中执行 command，且缓冲任何产生的输出。

特殊字符（因 shell 而异）需要相应处理：
```js
exec('"/path/to/test file/test.sh" arg1 arg2');
// 使用双引号这样路径中的空格就不会被解释为多个参数

exec('echo "The \\$HOME variable is $HOME"');
// 第一个 $HOME 被转义了，但第二个没有
```
**options [Object]**
* `cwd [string]` 子进程的当前工作目录。
* `env [Object]` 环境变量键值对。
* **`encoding [string]`** 默认为 'utf8'。
* **`shell [string]`** 用于执行命令的 shell。 在 UNIX 上默认为 '/bin/sh'，在 Windows 上默认为 process.env.ComSpec。
* **`timeout [number]`** 默认为 0。
* **`maxBuffer [number]`** stdout 或 stderr 允许的最大字节数。 默认为 200*1024。 如果超过限制，则子进程会被终止。 查看警告： maxBuffer and Unicode。
* **`killSignal [string] | [integer]`** 默认为 'SIGTERM'。
* `uid [number]` 设置该进程的用户标识。
* `gid [number]` 设置该进程的组标识。

默认为：
```js
const defaults = {
  encoding: 'utf8',
  timeout: 0,
  maxBuffer: 200 * 1024,
  killSignal: 'SIGTERM',
  cwd: null,
  env: null
};
```

**callback**

如果提供了一个 callback 函数，则它被调用时会带上参数 `(error, stdout, stderr)`。 当成功时，error 会是 null。 当失败时，error 会是一个 Error 实例。 error.code 属性会是子进程的退出码，error.signal 会被设为终止进程的信号。 **除 0 以外的任何退出码都被认为是一个错误。**



如果调用该方法的 `util.promisify()` 版本，将会返回一个包含 stdout 和 stderr 的 Promise 对象。在出现错误的情况洗，将返回 rejected 状态的 promise，拥有与回调函数一样的 error 对象，但附加了 stdout 和 stderr 属性。
```js
const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function lsExample() {
  const { stdout, stderr } = await exec('ls');
  console.log('stdout:', stdout);
  console.log('stderr:', stderr);
}
lsExample()
```

## **child_process.execFile(file[, args][, options][, callback])**
child_process.execFile() 函数类似 child_process.exec()，除了不衍生一个 shell。 而是，指定的可执行的 file 被直接衍生为一个新进程，这使得它比 child_process.exec() 更高效。

**它支持和 child_process.exec() 一样的选项(没有shell?)**。 由于没有衍生 shell，因此不支持像 I/O 重定向和文件查找这样的行为。

## **child_process.fork(modulePath[, args][, options])**
**options [Object]**

* `cwd [string]` 子进程的当前工作目录。
* `env [Object]` 环境变量键值对。
* **`execPath [string]`** 用来创建子进程的执行路径。
* **`execArgv [Array]`** 要传给执行路径的字符串参数列表。默认为 process.execArgv。
* **`silent [boolean]`** 如果为 true，则子进程中的 stdin、 stdout 和 stderr 会被导流到父进程中，否则它们会继承自父进程，详见 child_process.spawn() 的 stdio 中的 'pipe' 和 'inherit' 选项。 默认: false。
* `stdio [Array]| [string]` 详见 child_process.spawn() 的 stdio。 当提供了该选项，则它会覆盖 silent。 **如果使用了数组变量，则该数组必须包含一个值为 'ipc' 的子项，否则会抛出错误。 例如 [0, 1, 2, 'ipc']。**
* `uid [number]` 设置该进程的用户标识。
* `gid [number]` 设置该进程的组标识。

专门用于衍生新的 Node.js 进程，返回的 ChildProcess 会有一个额外的内置的通信通道，它允许消息在父进程和子进程之间来回传递。

**衍生的 Node.js 子进程与两者之间建立的 IPC 通信信道的异常是独立于父进程的**。 每个进程都有自己的内存，使用自己的 V8 实例。 由于需要额外的资源分配，因此不推荐衍生大量的 Node.js 进程。

**使用自定义的 execPath 启动的 Node.js 进程，会使用子进程的环境变量 NODE_CHANNEL_FD 中指定的文件描述符（fd）与父进程通信**。 fd 上的输入和输出期望被分割成一行一行的 JSON 对象。

## **child_process.spawn(command[, args][, options])**

**options [Object]**

* `cwd [string]` 子进程的当前工作目录。
* `env [Object]` 环境变量键值对。
* **`argv0 [string]`** 显式地设置要发给子进程的 argv[0] 的值。 如果未指定，则设为 command。
* `stdio [Array] | [string]` 子进程的 stdio 配置。
* **`detached [boolean]`** 准备将子进程独立于父进程运行。 具体行为取决于平台。
* `uid [number]` 设置该进程的用户标识。（详见 setuid(2)）
* `gid [number]` 设置该进程的组标识。（详见 setgid(2)）
* **`shell [boolean] | [string]`** 如果为 true，则在一个 shell 中运行 command。 **在 UNIX 上使用 '/bin/sh'，在 Windows 上使用 process.env.ComSpec**。 一个不同的 shell 可以被指定为字符串。**默认为 false（没有 shell）**。

默认为：
```js
const defaults = {
  cwd: undefined,
  env: process.env
};
```
**注意**：某些平台（macOS, Linux）会使用 argv[0] 的值作为进程的标题，而其他平台（Windows, SunOS）则使用 command。

**注意**，Node.js 一般会在启动时用 process.execPath 重写 argv[0]，所以 Node.js 子进程中的 process.argv[0] 不会匹配从父进程传给 spawn 的 argv0 参数，可以使用 process.argv0 属性获取它。

### **options.detached**
在 Windows 上，设置 options.detached 为 true 可以使子进程在父进程退出后继续运行。 子进程有自己的控制台窗口。 一旦启用一个子进程，它将不能被禁用。

在非 Windows 平台上，如果将 options.detached 设为 true，则子进程会成为新的进程组和会话的领导者。 注意，子进程在父进程退出后可以继续运行，不管它们是否被分离。 详见 setsid(2)。

默认情况下，父进程会等待被分离的子进程退出。 为了防止父进程等待给定的 subprocess，可以使用 subprocess.unref() 方法。 这样做会导致父进程的事件循环不包含子进程的引用计数，使得父进程独立于子进程退出，除非子进程和父进程之间建立了一个 IPC 信道。

当使用 detached 选项来启动一个长期运行的进程时，该进程不会在父进程退出后保持在后台运行，除非提供了一个不连接到父进程的 stdio 配置。 如果父进程的 stdio 是继承的，则子进程会保持连接到控制终端。

### **options.stdio**
options.stdio 选项用于配置子进程与父进程之间建立的管道。 

默认情况下，子进程的 stdin、 stdout 和 stderr 会重定向到 ChildProcess 对象上相应的 subprocess.stdin、 subprocess.stdout 和 subprocess.stderr 流。 这等同于将 options.stdio 设为 ['pipe', 'pipe', 'pipe']。

options.stdio 选项用于配置子进程与父进程之间建立的管道。 默认情况下，子进程的 stdin、 stdout 和 stderr 会重定向到 ChildProcess 对象上相应的 subprocess.stdin、 subprocess.stdout 和 subprocess.stderr 流。 这等同于将 options.stdio 设为 ['pipe', 'pipe', 'pipe']。

为了方便起见，options.stdio 可以是以下字符串之一：

* 'pipe' - 等同于 ['pipe', 'pipe', 'pipe'] （默认）
* 'ignore' - 等同于 ['ignore', 'ignore', 'ignore']
* 'inherit' - 等同于 [process.stdin, process.stdout, process.stderr] 或 [0,1,2]

另外，option.stdio 的值是一个每个索引都对应一个子进程 fd 的数组。 fd 的 0、1 和 2 分别对应 stdin、stdout 和 stderr。 
额外的 fd 可以被指定来创建父进程和子进程之间的额外管道。 该值是以下之一：

* 'pipe' - 创建一个子进程和父进程之间的管道。 在管道的父端以 subprocess.stdio[fd] 的形式作为 child_process 对象的一个属性暴露给父进程。 为 fd 创建的管道 0 - 2 也可分别作为 subprocess.stdin、subprocess.stdout 和 subprocess.stderr。
* 'ipc' - 创建一个用于父进程和子进程之间传递消息或文件描述符的 IPC 通道符。 一个 ChildProcess 最多只能有一个 IPC stdio 文件描述符。 设置该选项可启用 subprocess.send() 方法。 如果子进程把 JSON 消息写入到该文件描述符，则 [subprocess.on('message')] 事件句柄会被父进程触发。 如果子进程是一个 Node.js 进程，则一个已存在的 IPC 通道会在子进程中启用 process.send()、process.disconnect()、process.on('disconnect') 和 process.on('message')。
* 'ignore' - 指示 Node.js 在子进程中忽略 fd。 由于 Node.js 总是会为它衍生的进程打开 fd 0 - 2，所以设置 fd 为 'ignore' 可以使 Node.js 打开 /dev/null 并将它附加到子进程的 fd 上。
* <Stream> 对象 - 共享一个指向子进程的 tty、文件、socket 或管道的可读或可写流。 流的底层文件描述符在子进程中是重复对应该 stdio 数组的索引的 fd。 注意，该流必须有一个底层描述符（文件流直到 'open' 事件发生才需要）。
* 正整数 - 整数值被解析为一个正在父进程中打开的文件描述符。 它和子进程共享，类似于 <Stream> 是如何被共享的。
* null, undefined - 使用默认值。 对于 stdio fd 0、1 和 2（换言之，stdin、stdout 和 stderr）而言是创建了一个管道。 对于 fd 3 及以上而言，默认值为 'ignore'。

例子：
```js
const { spawn } = require('child_process');

// 子进程使用父进程的 stdios
spawn('prg', [], { stdio: 'inherit' });

// 衍生的子进程只共享 stderr
spawn('prg', [], { stdio: ['pipe', 'pipe', process.stderr] });

// 打开一个额外的 fd=4，用于与程序交互
spawn('prg', [], { stdio: ['pipe', null, null, null, 'pipe'] });
```
当在父进程和子进程之间建立了一个 IPC 通道，且子进程是一个 Node.js 进程，则子进程会带着未引用的 IPC 通道（使用 unref()）启动，直到子进程为 process.on('disconnect') 事件或 process.on('message') 事件注册了一个事件句柄。 这使得子进程可以在进程没有通过打开的 IPC 通道保持打开的情况下正常退出。

## **child_process.spawnSync(command[, args][, options])**
**options [Object]**

与spawn相比多了input,timeout,encoding,killSignall,maxBuffer，少了argv0,detached
* `input [string] | [Buffer] | [Uint8Array]` 要作为 stdin 传给衍生进程的值。提供该值会覆盖 stdio[0]
* `timeout [number]` 进程允许运行的最大时间数，以毫秒为单位。默认为 undefined。
* `killSignal [string] | [integer]` 当衍生进程将被杀死时要使用的信号值。默认为 'SIGTERM'。
* `maxBuffer [number]` stdout 或 stderr 允许的最大字节数。 默认为 200*1024。 如果超过限制，则子进程会被终止。 See caveat at maxBuffer and Unicode.
* `encoding [string]` 用于所有 stdio 输入和输出的编码。**默认为 'buffer'**。

**返回: [Object]**
* `pid [number]` 子进程的 pid。
* `output [Array]` stdio 输出返回的结果数组。
* `stdout [Buffer]` | [string] output[1] 的内容。
* `stderr [Buffer]` | [string] output[2] 的内容。
* `status [number]` 子进程的退出码。
* `signal [string]` 用于杀死子进程的信号。
* `error [Error]` 如果子进程失败或超时产生的错误对象。

## **child_process.execFileSync(file[, args][, options])**
**options**

与异步execFile相比多了两个参数+一个不同
* `input [string] | [Buffer] | [Uint8Array]` 要作为 stdin 传给衍生进程的值。
提供该值会覆盖 stdio[0]。
* `stdio [string] | [Array]` 子进程的 stdio 配置。默认为 'pipe'。
stderr 默认会输出到父进程中的 stderr，除非指定了 stdio。
* `encoding [string]` 用于所有 stdio 输入和输出的编码。默认为 'buffer'。

**返回: `[Buffer] | [string]`** 该命令的 stdout。

**当遇到超时且发送了 killSignal 时，则该方法直到进程完全退出后才返回结果。**

**注意**，如果子进程拦截并处理了 SIGTERM 信号且没有退出，则父进程会一直等待直到子进程退出。

如果进程超时，或有一个非零的退出码，则该方法会抛出一个 Error，**这个错误对象包含了底层 child_process.spawnSync() 的完整结果**。

## **child_process.execSync(command[, options])**
与execFileSync相比多了shell选项，默认为系统默认shell

## **ChildProcess 类**
### **'close' 事件** 
当子进程的 stdio 流被关闭时会触发 'close' 事件。 这与 'exit' 事件不同，因为多个进程可能共享同一 stdio 流。
### **'exit' 事件** 
注意，当 'exit' 事件被触发时，子进程的 stdio 流可能依然是打开的。
### **'error' 事件** 
注意，在错误发生后，'exit' 事件可能会也可能不会触发。 当同时监听了 'exit' 和 'error' 事件，谨防处理函数被多次调用。
### **'disconnect' 事件**
父进程中调用 subprocess.disconnect() 或在子进程中调用 process.disconnect() 后会触发 'disconnect' 事件
### **subprocess.connected**
subprocess.connected 属性表明是否仍可以从一个子进程发送和接收消息。 当 subprocess.connected 为 false 时，则不能再发送或接收的消息。
### **subprocess.disconnect()**
关闭父进程与子进程之间的 IPC 通道
### **subprocess.channel**
subprocess.channel 属性是当前子进程的 IPC 通道的引用。如果当前没有 IPC 通道，则该属性为 undefined
### **subprocess.pid**
返回子进程的进程标识（PID）
### **subprocess.kill([signal])**
subprocess.kill() 方法向子进程发送一个信号。 如果没有给定参数，则进程会发送 'SIGTERM' 信号，如果信号没有被送达，ChildProcess 对象可能会触发一个 'error' 事件。
**注意**，当函数被调用 kill 时，已发送到子进程的信号可能没有实际终止该进程
### **subprocess.killed**
表明该子进程是否已成功接收到 subprocess.kill() 的信号。 不代表子进程是否已被终止。
### **subprocess.send(message[, sendHandle[, options]][, callback])**
options 支持以下属性：

* keepOpen - 一个 Boolean 值，当传入 net.Socket 实例时可用。 当为 true 时，socket 在发送进程中保持打开。 默认为 false。

可选的 callback 是一个函数，它在消息发送之后、子进程收到消息之前被调用。 该函数被调用时只有一个参数：成功时是 null，失败时是一个 Error 对象。如果没有提供 callback 函数，且消息没被发送，则一个 'error' 事件将被 ChildProcess 对象触发

如果通道已关闭，或当未发送的消息的积压超过阈值使其无法发送更多时，subprocess.send() 会返回 false。 除此以外，该方法返回 true。 callback 函数可用于实现流量控制。

### **subprocess.stderr，subprocess.stdin，subprocess.stdout，subprocess.stdio**

### **maxBuffer 与 Unicode**
这会影响包含多字节字符编码的输出，如 UTF-8 或 UTF-16。 例如，console.log('中文测试') 会发送 13 个 UTF-8 编码的字节到 stdout，尽管只有 4 个字符。

