var express = require('express')
var app=express()

app.use("*",function(req,res){
    res.send('200 success')

})
app.listen(9000,function(){
    console.log('http://localhost:9000/')
})