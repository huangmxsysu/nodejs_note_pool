var foo = function(){
  var bar = function(){
    var local = 'local';
    setTimeout(function(){
      local = 'change'
    },1000);
    // return function(){
      return local;
    // }
  }
  var baz = bar();
  setInterval(function(){
    console.log(baz)
  },100)
}

foo();