let watch = require('watch')
let process = require('child_process')
 
process.exec(" npm run riot app tags", (error,stdout,stderr)=>{
    console.log(error,stdout,stderr)
})
 
watch.watchTree('app', function (f, curr, prev) {
   if(typeof f == 'string'){
    console.log(f)
    process.exec(" npm run riot " + f + " tags", (error,stdout,stderr)=>{
        console.log(f+ '-> '+ 'tags')
    })
   }
})