

(function () {

    var files = {}

    var filter = {
        urls: ["<all_urls>"]
      //  types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
    };

   
    chrome.webRequest.onCompleted.addListener(function (details){
        var headerInfo = {}
        var url = details.url, responseHeaders = details.responseHeaders, headers={};
        responseHeaders.map((item)=>{
            headers[item.name.toLocaleLowerCase()] = item.value
        })
        console.log(url,"!!!!!!!!")
        // console.log(url,'收到请求',details);
        url = url.split("?")[0]
     //   console.log(url, details.url)
        if(files[url]){
            return;
        }

        if (/\.(js|css|png|jpg|map|svg|html|woff|woff2|ttf|tpl|glsl)$/.test(url)) {
            
            files[url] = details
            renderList()
        }else if(headers['content-type'] && headers['content-type'].indexOf('text/html')!=-1){
        
            files[url+'.html'] = details
            renderList()
        }else if(headers['content-type'] && headers['content-type'].indexOf('application/json')!=-1){
            let t= url
            files[t] = details
            renderList()
        } else {
          //  console.log(url, details, '不是文件')
        }
    }, filter, ["responseHeaders"]);

    chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
        

        //return { };  //,url:'http://localhost:9000/skyeye/_perms?csrf_token=70f83a87cc64411976ddec0d3280290c&r=0.40742844398789035'
    }, filter, ["blocking", "requestHeaders"]);

    document.querySelector('#refresh').addEventListener('click', function(e){
      chrome.tabs.getSelected(function(tab){
         //  console.log(tab.id)
           chrome.tabs.executeScript(tab.id, {
               code: "window.location.reload()"
           }, function(){

           })
       })
       
    })

    document.querySelector('#list').addEventListener('click', function (e) {

        /*  
         return; */
        let list = []
        Array.from(document.getElementsByName('ckFile')).map((e) => {

            if (e.checked) {
                list.push(e.value)
            }
        })

        Promise.all(list.map((url) => {
            return getFile(url).catch((e)=>{
                console.error(url,"获取文件报错")
                return 'error'
            })
        })).then((results) => {debugger
           // console.log(results) //,result.responseURL
            var zip = new JSZip();


            results.map((result) => {
                if(result.responseURL){
                    let names = result.responseURL.split('/')
                    names.splice(0, 3)
                    
                    zip.file(names.join('/'), result.response||'');
                }
            })
            zip.generateAsync({ type: "blob" })
                .then(function (blob) {
                    saveAs(new Date().getTime() + 'zip', blob)
                });
        }).catch((results)=>{debugger

        })

    })

    function renderList() {
        let list = Object.keys(files).map((file) => {
            return `<tr>
            <td><input type="checkbox" name="ckFile" value="${file}" /></td>
            <td>${file}</td>
                
            </tr>`
        })
        document.querySelector('#filelist').innerHTML = `<table class="table table-condensed">
        <thead>
        <tr>
            <th><input type="checkbox" name='all' id="checkall"/></th>
            <th>文件名</th>
        </tr>
        </thead>
        <tbody>
        ${list.join('')}
        </tbody>
        </table>`

        document.querySelector('#checkall').addEventListener('click', function (event) {
            if (event.target.checked) {
                Array.from(document.getElementsByName('ckFile')).map((e) => {
                    e.checked = true
                })
            } else {
                Array.from(document.getElementsByName('ckFile')).map((e) => {
                    e.checked = false
                })
            }
        })
    }

    function getFile(url) {
        return new Promise(function (resolve, reject) {
            try {
                var xhr = new XMLHttpRequest();
                xhr.responseType = "blob";
                xhr.onreadystatechange = function (e) {
                    if (e.target.readyState == 4 && e.target.status == 200) {
                        resolve(e.target)
                    }else if(e.target.readyState == 4 ){
                        resolve(e.target.status)
                    }
                }; // Implemented elsewhere.
                xhr.onCompleted=function(e){
                    resolve(e.target)
                }
                xhr.onerror = function (e) {
                    console.error("getFile->获取文件 报错了！")
                    resolve('404')
                }
                xhr.open("GET", url, true);//http://sonar.bbfe.group/js/vendor.c348694e.js
                try{
                    xhr.send();
                }catch(e){
                    console.error("getFile报错了！")
                    resolve('404')
                }
                
            } catch (e) {
                resolve('404')
            }
        })
    }

    function saveAs(fileName = '文件名', blob) {
        var a = document.createElement('a');
        a.innerHTML = fileName;

        // 指定生成的文件名
        a.download = fileName;
        a.href = URL.createObjectURL(blob);

        document.body.appendChild(a);

        var evt = document.createEvent("MouseEvents");
        evt.initEvent("click", false, false);

        a.dispatchEvent(evt);

        document.body.removeChild(a);
    }
})()