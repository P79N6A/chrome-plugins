
let url = ''
(function () {
 
    /*  var config = {
        mode: "pac_script",
        pacScript: {
            data:  `
            function FindProxyForURL(url, host) {
                console.log(url,host,'proxy..............')
                return "DIRECT";
              }
            `
        }
    };   
    chrome.proxy.settings.set({value: config, scope: 'regular'},function() {});  */

  /*   var config = {
        mode: "fixed_servers",
        rules: {
          proxyForHttp: {
            scheme: "http",
            host: "localhost",
            port: 9000
          },
          bypassList: []//例外
        }
      };
    
   chrome.proxy.settings.set({value: config, scope: 'regular'},function() {}); */

/*     chrome.proxy.settings.get(
        {'incognito': false},
        function(config) {console.log(JSON.stringify(config));}); */
   /*  
    chrome.webRequest.onCompleted.addListener(function(details){
        console.log(details,'请求')
      
        return {url:'http://localhost:9000/skyeye/_perms?csrf_token=70f83a87cc64411976ddec0d3280290c&r=0.40742844398789035'}
    }, filter, [   ]) */
 
    //  var store = {}
    chrome.cookies.getAll({
        domain: 'www.baidu.com'
    }, function (cookies) {
        // store.cookies = cookies
        console.log(cookies)
    })

    let yearSelect = document.querySelector('#year'),
        monthSelect = document.querySelector('#month');

    
    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            console.log('收到消息', request)
            if(request.type == 1){//获取所有未完成的任务
                let {issueIds,issueKeys} = request.data
                if(issueKeys.length==0 || issueIds.length==0){
                    document.querySelector('#taskList').innerHTML = renderTable([])
                }
                issueKeys.map((key)=>{
                    chrome.tabs.executeScript(null, {code: getTaskByIssueKey(key)});
                })
            }else if(request.type == 2){//添加任务完成
                console.log(request.data,'添加成功')
                chrome.tabs.executeScript(null, {code: fetchList()});
            }else if(request.type == 4){
                document.querySelector(`tr[name='${request.data.id}']`).style['text-decoration'] = 'line-through'
                
            }else if(request.type == 5){
                let { id, key, summary } = request.data
                tasks[id] = {
                    id,key,summary
                }
                console.log(tasks)
               
                document.querySelector('#taskList').innerHTML = renderTable(tasks)
                console.log(document.querySelector('#taskList tbody'))
                new Sortable(document.querySelector('#taskList tbody'), {
                     group: "taskList",  // or { name: "...", pull: [true, false, clone], put: [true, false, array] }
                     sort: true,  // sorting inside list
                     delay: 0, // time in milliseconds to define when the sorting should start
                     touchStartThreshold: 0, // px, how many pixels the point should move before cancelling a delayed drag event
                     disabled: false, // Disables the sortable if set to true.
                     store: null,  // @see Store
                     animation: 150,  // ms, animation speed moving items when sorting, `0` — without animation
                     //handle: ".my-handle",  // Drag handle selector within list items
                    // filter: ".ignore-elements",  // Selectors that do not lead to dragging (String or Function)
                     preventOnFilter: true, // Call `event.preventDefault()` when triggered `filter`
                     draggable: "tr",
                     onEnd(e){
                        if(e.target.localName = 'tbody'){
                            console.log( e.item.querySelector('input'))
                            setTimeout(()=>{
                                e.item.querySelector('input').checked = false
                            },100)
                            delete ckTasks[  e.item.getAttribute('name')]
                        }
                     }
                 })
            }else if(request.type == 6){//删除任务完成
                let { id } = request.data
                chrome.tabs.executeScript(null, {code: fetchList()});
                //alert(`${id}删除成功！`)
            }
        })

        yearSelect.addEventListener('change',function(){
            getCalendar(yearSelect.value,monthSelect.value)
        })
        monthSelect.addEventListener('change',function(){
            getCalendar(yearSelect.value,monthSelect.value)
        })
        
       /*  let startSelect = false,
        document.querySelector('#calendar').addEventListener('mousedown',(e)=>{
            if(e.target.className.indexOf('calendar-item')!=-1&&e.target.className.indexOf('dropable')!=-1){
                startSelect=true
            }
        })
        document.querySelector('#calendar').addEventListener('mouseup',()=>{

        }) */
        


        document.querySelector('#file').addEventListener('change', (e) => {
            
            try{
                var f = e.target.files[0];
                var reader = new FileReader();
                reader.onload = function(e) {
                    try{
                        var data = e.target.result;
                        data = new Uint8Array(data);
                        let WorkBook = XLSX.read(data, {type: 'array'})
                        let sheetdata = XLSX.utils.sheet_to_json(WorkBook.Sheets[WorkBook.SheetNames[0]])
                        console.log(WorkBook,XLSX,sheetdata)
                        if(confirm(`确定要导入一下${sheetdata.length}条任务吗?:${JSON.stringify(sheetdata,'',2).replace(/[\{\}]/ig,'')}`)){
                            sheetdata.map((item)=>{
                                console.log(item['任务'])
                                if(item['任务']){
                                    chrome.tabs.executeScript(null, {code: createTask('yexinfu', item['任务'])});
                                }
                            })
                        }
                        document.querySelector('#file').value=""
                    }catch(e){
                        alert('读取模板文件失败!')
                        throw e
                    }
                };
                reader.readAsArrayBuffer(f);
            }catch(e){
                alert('读取模板文件失败!')
                throw e
            }
        })

        document.querySelector('#add').addEventListener('click', (e) => {
            document.querySelector('#file').click()
        })

        document.querySelector('#download').addEventListener('click', (e) => {
            //alert('添加')
            var elt = document.getElementById('template');
            var wb = XLSX.utils.table_to_book(elt, {sheet:"Sheet JS"});
            XLSX.writeFile(wb,  '任务模板.xlsx')
        })

        document.querySelector('#isCalendar').addEventListener('click', (e) => {
            
        })

        let date=new Date()
       
        initCalendar()
        document.querySelector('#done').addEventListener('click', (e) => {
            let keys = Object.keys(ckTasks);
            if(keys.length==0){
                alert("请选择要完成的问题!");
                return;
            }
            let commitMap = []
            keys.map((key)=>{
                commitMap.push(tasks[key].key)
            })
            console.log(commitMap)
            if(confirm(`以下是要完成的${commitMap.length}条任务:${JSON.stringify(commitMap,'',2)}，确定要提交吗?` )){
                keys.map((id)=>{
                    chrome.tabs.executeScript(null, {code: doneTask(id, 'yexinfu')});
                })
                
            }
        }) 

        document.querySelector('#auto').addEventListener('click', (e) => {
            
            let days = document.querySelectorAll('#calendar .calendar-item.dropable ');
            let keys = Object.keys(ckTasks),
            index = 0;

            if(keys.length==0){
                alert("请选择要分配的任务!");
                return;
            }
            console.log(ckTasks,days)
            
            Array.from(days).map((el,i)=>{
                if(el.querySelectorAll('tr').length==0){
                   let taskTr = document.querySelector(`#taskList tr[name='${keys[index++]}']`)
                   if(taskTr){
                     el.appendChild(taskTr)
                     taskTr.querySelector('input').checked = false
                    
                   }
                }else{
                    //已经有任务的日期，不会自动分配进去
                }
            })
            ckTasks = {}
        })
        
        document.querySelector('#commit').addEventListener('click',(e)=>{
            let days = document.querySelectorAll('#calendar .calendar-item.dropable ');
            let commitMap = {}
            Array.from(days).map((el,i)=>{
                
                if(el.querySelector('tr'))   commitMap[el.getAttribute('name')] = tasks[el.querySelector('tr').getAttribute('name')].key
                
            })
            console.log(commitMap)
            if(confirm(`以下是要提交的工时表:${JSON.stringify(commitMap,'',2)}，确定要提交吗?` )){
                //alert('ok')
                Object.keys(commitMap).map((date)=>{
                    chrome.tabs.executeScript(null, {code: recordTask(commitMap[date],'yexinfu',date)});
                })
                
                
            }

                
        })

        document.querySelector('#delete').addEventListener('click',(e)=>{
            let keys = Object.keys(ckTasks);
            if(keys.length==0){
                alert("请选择要删除的问题!");
                return;
            }
            let commitMap = []
            keys.map((key)=>{
                commitMap.push(tasks[key].key)
            })
            console.log(commitMap)
            if(confirm(`以下是要删除的${commitMap.length}条任务:${JSON.stringify(commitMap,'',2)}，确定要提交吗?` )){
                keys.map((id)=>{
                    chrome.tabs.executeScript(null, {code: deleteTask(id)});
                })
                
            }
        })

        function initCalendar(){
            let year=date.getFullYear(), month=date.getMonth(); 
            yearSelect.value=year;
            monthSelect.value = month
            getCalendar(year,month)
        }

        function getCalendar(year, month){
            let tempDate = new Date(year,month,1)
            let weekIndex=tempDate.getDay()
            let countdays=30
            if([1,3,5,7,8,10,12].indexOf(Math.floor(month)+1)!=-1){
                countdays = 31
            }else if(month == 1){
                if((year%4==0 || year%100==0) && year&400!=0){
                    countdays = 29
                }else{
                    countdays = 28
                }
            }
            let index = 0
            document.querySelector('#calendar').innerHTML = 
                     
                         ['周日','周一','周二','周三','周四','周五','周六'].map((title)=>{
                            return `<div class="calendar-title">${title}</div>`
                        }).join('') +
                        new Array(50).fill(0).map((o,i)=>{
                            if(index<countdays){

                                if(i<weekIndex){
                                    return `<div class="calendar-item disabled">&nbsp;</div>`
                                }else{
                                    let isRestday =  i%7==0 ||i%7==6
                                    let date = year+'-'+(Math.floor(month)+1)+'-'+ (++index)
                                    return `<div class="calendar-item dropable ${isRestday?'rest':''}" name='${date}'>${date}</div>`
                                }
                            }
                        }).join('')
                  
            
            
            Array.from(document.querySelectorAll('#calendar .calendar-item.dropable')).map((el)=>{
                new Sortable(el, {
                    group: "taskList",  // or { name: "...", pull: [true, false, clone], put: [true, false, array] }
                    sort: true,  // sorting inside list
                    delay: 0, // time in milliseconds to define when the sorting should start
                    touchStartThreshold: 0, // px, how many pixels the point should move before cancelling a delayed drag event
                    disabled: false, // Disables the sortable if set to true.
                    store: null,  // @see Store
                    animation: 140,  // ms, animation speed moving items when sorting, `0` — without animation
                    //handle: ".my-handle",  // Drag handle selector within list items
                   // filter: ".ignore-elements",  // Selectors that do not lead to dragging (String or Function)
                    preventOnFilter: true, // Call `event.preventDefault()` when triggered `filter`
                    draggable: "tr"
                })
            })
            
        }

        document.querySelector('#taskList').addEventListener('click', (e) => {
            
            if(e.target.type==='checkbox'){
                let ck = e.target
                if(ck.name=='all'){
                    if(ck.checked){
                        Array.from(document.querySelector('#taskList').querySelectorAll('input')).map((input)=>{
                            input.checked = true
                            if(input.name!='all'){
                                ckTasks[input.name] = true
                            }
                        })
                    }else{
                        Array.from(document.querySelector('#taskList').querySelectorAll('input')).map((input)=>{
                            input.checked = false
                            ckTasks = {}
                        })
                    }
                }else{
                    if(ck.checked){
                        ckTasks[ck.name] = true
                    }else{
                        delete ckTasks[ck.name]
                    }
                    
                }
                console.log('选中的任务:',ckTasks)
            }
        })
        document.querySelector('#list').addEventListener('click', () => {
            tasks = {}, ckTasks = {};
            chrome.tabs.executeScript(null, {code: fetchList()});
            getCalendar(yearSelect.value,monthSelect.value)
            // chrome.tabs.executeScript(null, {code: createTask('yexinfu', '调整日志备份列表展示样式')});
            // chrome.tabs.executeScript(null, {code: doneTask('2708669', 'yexinfu')});
            // chrome.tabs.executeScript(null, {code: recordTask('TSSSV-561', 'yexinfu','2018-5-11')});
            // chrome.tabs.executeScript(null, { code: sendMessage({ name: 'yexinfu', message: '消息发送成功' }) });
            // chrome.tabs.executeScript(null, {code: getTaskByIssueKey('TSSSV-566')});
        })
        chrome.tabs.executeScript(null, {code: fetchList()}); //自动获取一下

    
    //获取所有的未完成任务列表
    function fetchList() {
        return ` 
            (function(){
                let data = {
                    'startIndex': 0,
                    'filterId': -1,
                    'jql': 'issuetype = Task AND resolution = Unresolved AND assignee in (currentUser()) order by updated DESC',
                    'layoutKey': 'list-view'
              
                }
                let str = []
                Object.keys(data).map((key) => {
                    str.push(key + '=' + data[key])
                })
                console.log(str.join('&'))
                fetch('${url}rest/issueNav/1/issueTable', {
                    method: 'POST',
                    credentials: "include",
                    mode: 'cors',
                    headers: {
                        // 'Accept': 'application/json',
                        "origin": "*",
                        "__amdModuleName": "jira/issue/utils/xsrf-token-header",
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        // 'Access-Control-Allow-Credentials':'true',
                        'X-Atlassian-Token': 'no-check',
                        'X-Requested-With': 'XMLHttpRequest',
                        'Referer': '${url}/?filter=-1&jql=issuetype%20%3D%20Task%20AND%20resolution%20%3D%20Unresolved%20AND%20assignee%20in%20(currentUser())%20order%20by%20updated%20DESC'
                    },
                    body: str.join('&')
                }).then((res)=>{
                    return res.json()
                }).then((res)=>{
                    console.log(res)
                    localStorage.issueIds = res.issueTable.issueIds.join(',')
                    localStorage.issueKeys = res.issueTable.issueKeys.join(',')
                    
                    ${sendMessage(
                       ` {type:'1',data:{
                            issueIds:res.issueTable.issueIds,
                            issueKeys:res.issueTable.issueKeys
                        }}`
                    )}
                }).catch(()=>{
                    ${sendMessage(
                        ` {type:'error',message:'获取未完成的任务失败！'}`
                     )}
                })
            })()
            `
    }

    //创建一个任务
    function createTask(user, content) {
        return `
            (function(){
            let data = {
                pid:'12027',
                issuetype:'10100',
                atl_token:'BVXE-9XUX-0N6C-O6NO|4125cc80b113456294badef028401a18cc45a61f|lin',
                formToken:'32ce4c4f6ea84a1148374186986e9c0acf080f7d',
                summary:'${content || ''}',
                reporter:'${user || 'yexinfu'}',
                description:'',
                priority:'10002',
                timetracking_originalestimate:'8h',
                timetracking_remainingestimate:'',
                isCreateIssue:true,
                hasWorkStarted:'',
                'dnd-dropzone':'',
                duedate:'',
                issuelinks:'issuelinks',
                'issuelinks-linktype':'blocks',
                assignee:'${user || 'yexinfu'}',
                fieldsToRetain:'project',
                fieldsToRetain:'issuetype',
                fieldsToRetain:'reporter',
                fieldsToRetain:'components',
                fieldsToRetain:'fixVersions',
                fieldsToRetain:'priority',
                fieldsToRetain:'labels',
                fieldsToRetain:'duedate',
                fieldsToRetain:'issuelinks',
                fieldsToRetain:'assignee',
                fieldsToRetain:'customfield_10002'
            }
            let str = []
            Object.keys(data).map((key) => {
                str.push(key + '=' + data[key])
            })
            console.log(str.join('&'))
            fetch('${url}secure/QuickCreateIssue.jspa?decorator=none', {
                method: 'POST',
                credentials: "include",
                mode: 'cors',
                headers: {
                    // 'Accept': 'application/json',
                    "origin": "*",
                    "__amdModuleName": "jira/issue/utils/xsrf-token-header",
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    // 'Access-Control-Allow-Credentials':'true',
                    'X-Atlassian-Token': 'no-check',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': '${url}/?filter=-1&jql=issuetype%20%3D%20Task%20AND%20resolution%20%3D%20Unresolved%20AND%20assignee%20in%20(currentUser())%20order%20by%20updated%20DESC'
                },
                body: str.join('&')+"&fieldsToRetain=project&fieldsToRetain=issuetype&fieldsToRetain=reporter&fieldsToRetain=components&fieldsToRetain=fixVersions&fieldsToRetain=priority&fieldsToRetain=labels&fieldsToRetain=duedate&fieldsToRetain=issuelinks&fieldsToRetain=assignee"
            }).then((res)=>{
                return res.json()
            }).then((res)=>{
                ${sendMessage(
                    ` {type:'2',data:{
                         
                         result:res
                     }}`
                 )}
                console.log(res)
            }).catch(()=>{
                ${sendMessage(
                    ` {type:'error',message:'创建任务:${content}失败'}`
                 )}
            })})()
            `
    }

//删除任务
function deleteTask(id) {
    return `
        (function(){
        let data = {
            inline:true,
            decorator:'dialog',
            id:'${id}',
            viewIssueKey:'',
            confirm:true,
            targetUrl:'/issues/?atl_token=BVXE-9XUX-0N6C-O6NO%7Cf08962ebe0ac008d40516f0024638a2cc9326933%7Clin',
            atl_token:'BVXE-9XUX-0N6C-O6NO|f08962ebe0ac008d40516f0024638a2cc9326933|lin'
        }
        let str = []
        Object.keys(data).map((key) => {
            str.push(key + '=' + data[key])
        })
        console.log(str.join('&'))
        fetch('${url}secure/DeleteIssue.jspa', {
            method: 'POST',
            credentials: "include",
            mode: 'cors',
            headers: {
                // 'Accept': 'application/json',
                "origin": "*",
                "__amdModuleName": "jira/issue/utils/xsrf-token-header",
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                // 'Access-Control-Allow-Credentials':'true',
                'X-Atlassian-Token': 'no-check',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': '${url}/?filter=-1&jql=issuetype%20%3D%20Task%20AND%20resolution%20%3D%20Unresolved%20AND%20assignee%20in%20(currentUser())%20order%20by%20updated%20DESC'
            },
            body: str.join('&')+"&fieldsToRetain=project&fieldsToRetain=issuetype&fieldsToRetain=reporter&fieldsToRetain=components&fieldsToRetain=fixVersions&fieldsToRetain=priority&fieldsToRetain=labels&fieldsToRetain=duedate&fieldsToRetain=issuelinks&fieldsToRetain=assignee"
        }).then((res)=>{
            return res.text()
        }).then((res)=>{
            ${sendMessage(
                ` {type:'6',data:{
                     id:'${id}',
                     result:res
                 }}`
             )}
            console.log(res)
        }).catch(()=>{
            ${sendMessage(
                ` {type:'error',message:'任务id:${id}状态修改失败!'}`
             )}
        })})()
        `
}


    //把任务状态改成done
    function doneTask(id, user) {
        return `
        (function(){
            let data = {
                inline:true,
                decorator:'dialog',
                action:'5',
                id:'${id}',
                viewIssueKey:'',
                formToken:'b23e88b19aa45464eeb89033ccd65c5c8d49b266',
                resolution:'10000',
                fixVersions:'12708',
                assignee:'${user}',
                worklog_activate:true,
                worklog_timeLogged:'',
                worklog_startDate:'21/五月/18 6:04 下午',
                worklog_adjustEstimate:'auto',
                isCreateIssue:false,
                isEditIssue:false,
                customfield_10902:'',
                customfield_10901:'',
                comment:'',
                commentLevel:'',
                atl_token:'BVXE-9XUX-0N6C-O6NO|4125cc80b113456294badef028401a18cc45a61f|lin'
            }
            let str = []
            Object.keys(data).map((key) => {
                str.push(key + '=' + data[key])
            })
            console.log(str.join('&'))
            fetch('${url}secure/CommentAssignIssue.jspa?atl_token=BVXE-9XUX-0N6C-O6NO%7C4125cc80b113456294badef028401a18cc45a61f%7Clin', {
                method: 'POST',
                credentials: "include",
                mode: 'cors',
                headers: {
                    // 'Accept': 'application/json',
                    "origin": "*",
                    "__amdModuleName": "jira/issue/utils/xsrf-token-header",
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    // 'Access-Control-Allow-Credentials':'true',
                    'X-Atlassian-Token': 'no-check',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': '${url}/?filter=-1&jql=issuetype%20%3D%20Task%20AND%20resolution%20%3D%20Unresolved%20AND%20assignee%20in%20(currentUser())%20order%20by%20updated%20DESC'
                },
                body: str.join('&')
            }).then((res)=>{
                return res.text()
            }).then((res)=>{
                ${sendMessage(
                    ` {type:'4',data:{
                         id:'${id}',
                         result:res
                     }}`
                 )}
                console.log(res)
            }).catch(()=>{
                ${sendMessage(
                    ` {type:'error',message:'任务id:${id}状态修改失败!'}`
                 )}
            })})()
            `
    }

    //将任务记录到工时 TSSSV-561 yexinfu  2018-05-21
    function recordTask(key, user, date) {
        return `
        (function(){
            let nowDate=new Date()
            let nowDateStr=nowDate.getFullYear()+'-'+(nowDate.getMonth()+1)+'-'+nowDate.getDate()
            let data = {
                id:'',
                type:'issue',
                'use-ISO8061-week-numbers':'false',
                ansidate:'${date}',
                ansienddate:nowDateStr,
                'selected-panel':'',
                'analytics-origin-page':'Issue Search or Issue View',
                'analytics-origin-view':'Tempo Issue Panel',
                'analytics-origin-action':'Clicked Log Work Button',
                'analytics-page-category':'JIRA',
                'startTimeEnabled':false,
                'actionType':'logTime',
                'tracker':false,
                preSelectedIssue:'${key}',
                planning:false,
                user:'${user}',
                issue:'${key}',
                date:'${date}',
                enddate:nowDateStr,
                time:'8h',
                billedTime:'8h',
                remainingEstimate:'0h',
                comment:''
            }
            let str = []
            Object.keys(data).map((key) => {
                str.push(key + '=' + data[key])
            })
            console.log(str.join('&'))
            fetch('${url}rest/tempo-rest/1.0/worklogs/${key}', {
                method: 'POST',
                credentials: "include",
                mode: 'cors',
                headers: {
                    // 'Accept': 'application/json',
                    "origin": "*",
                    "__amdModuleName": "jira/issue/utils/xsrf-token-header",
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    // 'Access-Control-Allow-Credentials':'true',
                    'X-Atlassian-Token': 'no-check',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': '${url}/?filter=-1&jql=issuetype%20%3D%20Task%20AND%20resolution%20%3D%20Unresolved%20AND%20assignee%20in%20(currentUser())%20order%20by%20updated%20DESC'
                },
                body: str.join('&')
            }).then((res)=>{
                return res.text()
            }).then((res)=>{
                console.log(res)
            })})()
          `
    }

    function getTaskByIssueKey(key){
        return `
            (function(){
                fetch("${url}secure/AjaxIssueAction!default.jspa?issueKey=${key}&decorator=none&prefetch=false&shouldUpdateCurrentProject=true&loadFields=false&_=1527042890536",{credentials: "include"})
                .then((res)=>{
                    return res.json()
                }).then((res)=>{
                    ${sendMessage(
                        ` {type:'5',data:{
                            id:res.issue.id,
                            key:res.issue.key,
                            summary:res.issue.summary
                        }}`
                    )}
                })
            })()
        `
    }

    //从页面给插件发送消息
    function sendMessage(data) {
        return `
            chrome.runtime.sendMessage(${data},function(){
                console.log('发送成功!')
            })
            `
    }

    function renderTable(tasks){
        return `
        <table class="table table-condensed">
        <thead>
        <tr>
            <th><input type="checkbox" name='all'/></th>
            <th>issueId</th>
            <th>issueKey</th>
            <th>summary</th> 
        </tr>
        </thead>
        <tbody>
        ${Object.keys(tasks).map((id)=>{
            let task = tasks[id]
            return `
                <tr class='task-item' name='${task.id}'>
                    <td><input type="checkbox" name="${task.id}"/></td>
                    <td>${task.id}</td>
                    <td>${task.key}</td>
                    <td>${task.summary}</td> 
                </tr>
            `
        }).join('')}
        </tbody>
        </table>
            
        `
    }

    function checkTask(){
        console.log(arguments)
    }

})()