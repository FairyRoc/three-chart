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
                                    "gte": "2018-01-22T16:00:00Z",
                                    "lte": "2018-01-25T15:59:59Z"
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
        })
        .then(function(response) {
            console.log(response);
            var res = response.data.aggregations.first_date.buckets
            res.forEach((per) => {
                dataV.date.push(new Date(per.key_as_string).toLocaleString())
                dataV.value.push(per.doc_count)
            })
            dataV.lastDate = dataV.date.slice(0,72);
            dataV.lastValue = dataV.value.slice(0,72);

            console.log(dataV);
            //一天的值
            var predictionLength = 1440;
            var result = holtWinters(dataV.value, predictionLength);
            //周期数据
            result = result.augumentedDataset.slice(dataV.value.length-predictionLength,dataV.value.length);
            console.log("瞧一瞧看一看咯",result,getPeriodData(dataV))
            //用当前时间戳去5分钟取整-60分钟，共计60个点，和周期数据中12个点作比对，生成一个残差数组，对残差数组做一次平滑，生成此刻残差数据，+周期数据=预测数据return
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
                                            "gte": "now-61m",
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
                                "interval": "1m"
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
                        var realData = response.data.aggregations.first_date.buckets.slice(0,60);
                        var realNow = response.data.aggregations.first_date.buckets[61].doc_count;
                        var periodData = getPeriodData(dataV).slice(0,60);
                        var periodNow = getPeriodData(dataV)[60];
                        console.log(periodData,realData,"比较")
                        var residual = realData.map((value,index)=>{
                            return value.doc_count-periodData[index];
                        });
                        var diff = holtWinters(residual, 1).augumentedDataset[60];
                        console.log("残差",residual,"实际一小时",realData,"预测数据",periodData,"当前真实值",realNow,"预测的当前数据",periodNow+diff,"当前残差",diff,"对应周期数据",periodNow)
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
            

        })
        .catch(function(error) {
            console.log(error);
        });

        function getPeriodData(data){
            return dataV.value.slice(getRangeIndex()-61,getRangeIndex())
        }
        function getRangeIndex(){
            var now = new Date();
            var today = parseInt(now/60000/24/60)*60000*24*60-60000*8*60;
            var index = parseInt((now-today)/60000);
            console.log("取整时间",index);
            return index;
        }
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
