
```js
const ChildProcess = require('internal/child_process').ChildProcess
```

```js
function normalizeSpawnArguments(file, args, options) {
  //...
  //验证file,args,options的有效性，否则抛出错误

  options = Object.assign({}, options);

  if (options.shell) {
    //options.shell显示需要衍生一个shell时，根据平台不同处理参数args并设定file可执行文件
    const command = [file].concat(args).join(' ');

    if (process.platform === 'win32') {
      if (typeof options.shell === 'string')
        file = options.shell;
      else
        file = process.env.comspec || 'cmd.exe';
      args = ['/d', '/s', '/c', `"${command}"`];
      options.windowsVerbatimArguments = true;
    } else {
      if (typeof options.shell === 'string')
        file = options.shell;
      else if (process.platform === 'android')
        file = '/system/bin/sh';
      else
        file = '/bin/sh';
      args = ['-c', command];
    }
  }

  //将第一个参数放入args数组中
  if (typeof options.argv0 === 'string') {
    args.unshift(options.argv0);
  } else {
    args.unshift(file);
  }

  var env = options.env || process.env;
  var envPairs = [];

  // Prototype values are intentionally included.
  for (var key in env) {
    const value = env[key];
    if (value !== undefined) {
      envPairs.push(`${key}=${value}`);
    }
  }

  _convertCustomFds(options);

  return {
    file: file,
    args: args,
    options: options,
    envPairs: envPairs
  };
}
```

## spawn
```js
var spawn = exports.spawn = function(/*file, args, options*/) {
  var opts = normalizeSpawnArguments.apply(null, arguments);
  var options = opts.options;
  var child = new ChildProcess();

  child.spawn({
    file: opts.file,
    args: opts.args,
    cwd: options.cwd,
    windowsHide: !!options.windowsHide,
    windowsVerbatimArguments: !!options.windowsVerbatimArguments,
    detached: !!options.detached,
    envPairs: opts.envPairs,
    stdio: options.stdio,
    uid: options.uid,
    gid: options.gid
  });

  return child;
};
```

## fork
```js
exports.fork = function(modulePath /*, args, options*/) {

  // 处理 options and args 参数.
  
  // Prepare arguments for fork:
  execArgv = options.execArgv || process.execArgv;
  //...
  args = execArgv.concat([modulePath], args);

  //...处理options.stdio

  options.execPath = options.execPath || process.execPath;
  options.shell = false;

  return spawn(options.execPath, args, options);
};
```

## execFile
```js
exports.execFile = function(file /*, args, options, callback*/) {
  var args = [];
  var callback;
  var options = {
    encoding: 'utf8',
    timeout: 0,
    maxBuffer: 200 * 1024,
    killSignal: 'SIGTERM',
    cwd: null,
    env: null,
    shell: false
  };

  // ...
  // Parse the args,options,callback parameters.
  

  //...
  //检查参数形式有效性

  var child = spawn(file, args, {
    cwd: options.cwd,
    env: options.env,
    gid: options.gid,
    uid: options.uid,
    shell: options.shell,
    windowsHide: !!options.windowsHide,
    windowsVerbatimArguments: !!options.windowsVerbatimArguments
  });

  //根据encoding设置_stdout,_stderr为string或者数组（encoding为'buffer')
  var timeoutId;

  var ex = null;

  var cmd = file;

  function exithandler(code, signal) {

    // merge chunks
    var stdout;
    var stderr;
    if (encoding) {
      stdout = _stdout;
      stderr = _stderr;
    } else {
      stdout = Buffer.concat(_stdout);
      stderr = Buffer.concat(_stderr);
    }

    if (!ex && code === 0 && signal === null) {
      callback(null, stdout, stderr);
      return;
    }

    if (args.length !== 0)
      cmd += ` ${args.join(' ')}`;

    if (!ex) {
      ex = new Error('Command failed: ' + cmd + '\n' + stderr);
      ex.killed = child.killed || killed;
      ex.code = code < 0 ? getSystemErrorName(code) : code;
      ex.signal = signal;
    }

    ex.cmd = cmd;
    callback(ex, stdout, stderr);
  }

  function errorhandler(e) {
    ex = e;

    if (child.stdout)
      child.stdout.destroy();

    if (child.stderr)
      child.stderr.destroy();

    exithandler();
  }

  function kill() {
    if (child.stdout)
      child.stdout.destroy();

    if (child.stderr)
      child.stderr.destroy();

    killed = true;
    try {
      child.kill(options.killSignal);
    } catch (e) {
      ex = e;
      exithandler();
    }
  }

  if (options.timeout > 0) {
    timeoutId = setTimeout(function delayedKill() {
      kill();
      timeoutId = null;
    }, options.timeout);
  }

  if (child.stdout) {
    if (encoding)
      child.stdout.setEncoding(encoding);

    child.stdout.on('data', function onChildStdout(chunk) {
      stdoutLen += encoding ? Buffer.byteLength(chunk, encoding) : chunk.length;

      if (stdoutLen > options.maxBuffer) {
        ex = new errors.RangeError('ERR_CHILD_PROCESS_STDIO_MAXBUFFER',
                                   'stdout');
        kill();
      } else if (encoding) {
        _stdout += chunk;
      } else {
        _stdout.push(chunk);
      }
    });
  }

  if (child.stderr) {
    if (encoding)
      child.stderr.setEncoding(encoding);

    child.stderr.on('data', function onChildStderr(chunk) {
      stderrLen += encoding ? Buffer.byteLength(chunk, encoding) : chunk.length;

      if (stderrLen > options.maxBuffer) {
        ex = new errors.RangeError('ERR_CHILD_PROCESS_STDIO_MAXBUFFER',
                                   'stderr');
        kill();
      } else if (encoding) {
        _stderr += chunk;
      } else {
        _stderr.push(chunk);
      }
    });
  }

  child.addListener('close', exithandler);
  child.addListener('error', errorhandler);

  return child;
};
```

## exec
```js
exports.exec = function(command /*, options, callback*/) {
  var opts = normalizeExecArgs.apply(null, arguments);
  return exports.execFile(opts.file,
                          opts.options,
                          opts.callback);
};
```