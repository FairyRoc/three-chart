import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
var echarts = require('echarts');
var holtWinters = require('holtwinters');
var axios = require('axios');
var ESS = require('exponential-smoothing-stream');
var dataV={};
dataV.date = [];
dataV.value = [];
dataV.lastDate = [];
dataV.lastValue = [];


class App extends Component {
  componentDidMount(){
    var promisePv, promiseError;
    var today = parseInt(Date.now() / 60000 / 24 / 60) * 60000 * 24 * 60 - 8 * 60000 * 60,
        lastSpanDay = today - 3 * 60000 * 24 * 60,
        oneDay = 60000 * 24 * 60 * 3;
    var type = ["ajaxError",
        "定位失败",
        "checkorderforpay",
        "poi接口异常",
        "websocket错误",
        "一起点菜品变动",
        "写点评小程序返回",
        "平台首页",
        "定位失败",
        "提交订单接口",
        "支付接口",
        "用户拒绝授权 || 获取用户信息失败",
        "登陆接口",
        "秒付订单详情",
        "订单详情接口",
        "访问接口错误",
        "跳转写点评小程序成功",
        "账户中心授权接口超时"
    ];

    promisePv = axios.post('http://10.69.85.97:8080/eagle-prajna-*/_search', {
            "query": {
                "bool": {
                    "must": [{
                            "term": {
                                "project": "menuorder-wxapp"
                            }
                        },
                        {
                            "term": {
                                "env": "product"
                            }
                        },
                        {
                            "term": {
                                "userAgent.ua": "weixin agent"
                            }
                        },
                        {
                            "term": {
                                "category": "pv"
                            }
                        },
                        {
                            "range": {
                                "@timestamp": {
                                    "gte": lastSpanDay ,
                                    "lte": today
                                }
                            }
                        }
                    ]
                }
            },
            "aggs": {
                "first_date": {
                    "date_histogram": {
                        "field": "@timestamp",
                        "interval": "1m"
                    }
                }
            }
        }, {
            "headers": {
                "content-type": "application/json",
                "Authorization": "cHJham5hLXNlcnZpY2Utd2ViOkREODMzNEJBMzYwNEM5NEI1NENDRTA4NjRCMUQ5M0JF"
            }
        }),

        promiseError = axios.post('http://10.69.85.97:8080/eagle-prajna-*/_search', {
            "query": {
                "bool": {
                    "must": [{
                            "term": {
                                "project": "menuorder-wxapp"
                            }
                        },
                        {
                            "term": {
                                "env": "product"
                            }
                        },
                        {
                            "term": {
                                "userAgent.ua": "weixin agent"
                            }
                        },
                        {
                            "term": {
                                "category": "jsError"
                            }
                        },
                        {
                            "range": {
                                "@timestamp": {
                                    "gte": lastSpanDay,
                                    "lte": today
                                }
                            }
                        }
                    ]
                }
            },
            "aggs": {
                "first_date": {
                    "date_histogram": {
                        "field": "@timestamp",
                        "interval": "1m"
                    },
                    "aggs": {
                        "errorType": {
                            "terms": {
                                "field": "log.name"
                            }
                        }
                    }
                }
            }
        }, {
            "headers": {
                "content-type": "application/json",
                "Authorization": "cHJham5hLXNlcnZpY2Utd2ViOkREODMzNEJBMzYwNEM5NEI1NENDRTA4NjRCMUQ5M0JF"
            }
        })

    /*期望数据结构
    *   [{
        "timestamp":2020202020100,
        "error1":28,
        "error2":19,
        "error3":20
    },{
        "timestamp":20202020202233,
        "error1":28,
        "error2":19,
        "error3":20
    }]
    *
    *
    */
    Promise.all([promisePv, promiseError]).then(values => {
        var pv = values[0].data.aggregations.first_date.buckets;
        var error = values[1].data.aggregations.first_date.buckets;
        var pvObj = {},
            result = [],
            errorObj = {};
        pv.forEach((pvCount, index) => {
            pvObj[pvCount.key] = pvCount.doc_count
        });
        error.forEach((errorCount, index) => {
            errorObj[errorCount.key] = errorCount.errorType.buckets
        });
        for (var key in pvObj) {
            var tmp = {};
            tmp['@timestamp'] = new Date(+key);
            // console.log(errorObj[key])
            type.forEach(type => {
                //errorObj[i]:{
                //   "key": "ajaxError",
                //   "doc_count": 23
                // }
                var signal = 0;
                for (var i = 0; i < errorObj[key].length; i++) {
                    if (errorObj[key][i].key === type) {
                        var data = errorObj[key][i]
                        tmp[data.key] = data.doc_count / pvObj[key];
                        signal = 1;
                        break;
                    }
                }
                if (signal === 0) tmp[type] = 0;
            })

            result.push(tmp);
        };
        var templist = {};
        templist.date = [];
        templist.val = [];

        result.forEach(function(item, index){
            templist.date.push(item['@timestamp']);
            templist.val.push(item['websocket错误']);
        })
        console.log(templist);


        myChart.setOption({
            title: {
                text: '错误真实占比'
            },
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                data: ['错误真实占比']
            },
            xAxis: {
                type: 'category',
                data: templist.date
            },
            yAxis: {
                type: "value"
            },
            series: [{
                name: 'websocket错误',
                type: 'line',
                data: templist.val
            }
            ]
        });
    });

    // 绘制图表
        // 基于准备好的dom，初始化echarts实例
    var myChart = echarts.init(document.getElementById('main'));
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">wolt-winters平滑算法</h1>
        </header>
        <div id="main" style={{width:"100%",height:"700px"}}></div>
      </div>
    );
  }
}

export default App;
