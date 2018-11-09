(function (window) {

    function getMyTasks() {
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
        fetch('https://jira.360es.cn/rest/issueNav/1/issueTable', {
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
                'Referer': 'https://jira.360es.cn/issues/?filter=-1&jql=issuetype%20%3D%20Task%20AND%20resolution%20%3D%20Unresolved%20AND%20assignee%20in%20(currentUser())%20order%20by%20updated%20DESC'
            },
            body: str.join('&')
        })
    }




})(window)