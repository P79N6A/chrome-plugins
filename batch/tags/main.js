riot.tag2('app-main', '<h1>200</h1>', '', '', function(opts) {
this.datas = 123
this.update()
console.log(this,opts,'main')
var a=new Function("alert()")
a()
});