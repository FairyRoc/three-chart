import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
var echarts = require('echarts');
var Papa = require('papaparse');
var holtWinters = require('holtwinters');
var axios = require('axios');
var dataV={};
dataV.date = [];
dataV.value = [];
dataV.lastDate = [];
dataV.lastValue = [];


class App extends Component {
  componentDidMount(){
    axios.post('http://10.69.85.97:8080/eagle-prajna-*/_search', {
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
                                    "gte": "now-5d",
                                    "lte": "now"
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
                        "interval": "5m"
                    }
                }
            }
        }, {
            "headers": {
                "content-type": "application/json",
                "Authorization": "cHJham5hLXNlcnZpY2Utd2ViOkREODMzNEJBMzYwNEM5NEI1NENDRTA4NjRCMUQ5M0JF"
            }
        })
        .then(function(response) {
            console.log(response);
            var res = response.data.aggregations.first_date.buckets
            res.forEach((per) => {
                dataV.date.push(per.key_as_string)
                dataV.value.push(per.doc_count)
            })
            dataV.lastDate = dataV.date.slice(0,72);
            dataV.lastValue = dataV.value.slice(0,72);

            console.log(dataV);
            var predictionLength = 288;
            var result = holtWinters(dataV.value, predictionLength);
            result = result.augumentedDataset.slice(dataV.value.length-predictionLength,dataV.value.length)
            console.log("瞧一瞧看一看咯",result)
            myChart.setOption({
                title: {
                    text: '数据对比'
                },
                tooltip: {
                    trigger: 'axis'
                },
                legend: {
                    data: ['实际值', '预测值']
                },
                xAxis: {
                    type: 'category',
                    data: dataV.date
                },
                yAxis: {
                    type: "value"
                },
                series: [{
                    name: '实际值',
                    type: 'line',
                    data: dataV.value
                }, {
                    name: '预测值',
                    type: 'line',
                    data: result
                }]
            });
        })
        .catch(function(error) {
            console.log(error);
        });
        // 基于准备好的dom，初始化echarts实例
    var myChart = echarts.init(document.getElementById('main'));
    // 绘制图表

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
