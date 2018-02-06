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
                                    "gte": "2018-01-23T16:00:00Z",
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
        .then(function(PV) {
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
                                "category": "jsError"
                            }
                        },
                        {
                            "range": {
                                "@timestamp": {
                                    "gte": "2018-01-23T16:00:00Z",
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
            console.log(response,PV);
            var res = response.data.aggregations.first_date.buckets
            var pv = PV.data.aggregations.first_date.buckets
            res.forEach((per,index) => {
                dataV.date.push(new Date(per.key_as_string).toLocaleString())
                if(pv[index].doc_count===0){dataV.value.push(0)}
                else{
                    dataV.value.push(per.doc_count/pv[index].doc_count)
                    if(per.doc_count/pv[index].doc_count>0.2)console.log(per.doc_count/pv[index].doc_count,"概率")
                }
                
            })
            // dataV.lastDate = dataV.date.slice(0,72);
            // dataV.lastValue = dataV.value.slice(0,72);

            console.log(dataV);
            //一天的值
            // var predictionLength = 1440;
            // var result = holtWinters(dataV.value, predictionLength);
            // console.log(result);
            // var testData = [1,2,3,4,5,10,20,15,13,12,11,10,9,8,7,6,5,4,3,2,1]
            // var test = holtWinters(testData, 10);
            //             console.log("预测结果123",test)
            //             var ess = new ESS({
            //                 smoothingFactor: 0.5
            //             });
            //             var valueList = [];
            //             testData.forEach(re=>{
            //                 ess.write(re)
            //             })
            //             ess.end();
                         
            //             ess.on('data', function(data) {
            //                 valueList.push(data);
            //             });
                         
            //             ess.on('end', function() {
            //                 console.log(valueList,'预测后结果123');
            //                 //value list now equals: [2, 2, 2.5, 2.25, 1.625] 
            //             });
            //周期数据
            // result = result.augumentedDataset.slice(dataV.value.length-predictionLength,dataV.value.length);
            // console.log("全部周期数据",result,getPeriodData(dataV))
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
                                        "category": "jsError"
                                    }
                                },
                                {
                                    "range": {
                                        "@timestamp": {
                                            "gte": parseInt(new Date()/60000)*60000-60000*65,
                                            "lte": parseInt(new Date()/60000)*60000-60000*4
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
                        var realNow = response.data.aggregations.first_date.buckets[60].doc_count;
                        var periodData = getPeriodData(dataV).slice(0,60);
                        var periodNow = getPeriodData(dataV)[60];
                        console.log(periodData,realData,"比较");
                        var diff=0;
                        var residual = realData.map((value,index)=>{
                            return value.doc_count-periodData[index];
                        });
                        residual.forEach(value=>{
                            diff+=value;
                        })
                        diff/=residual.length;
                        // var ess = new ESS({
                        //     smoothingFactor: 0.5
                        // });
                         
                        // var valueList = [];
                        // residual.forEach(re=>{
                        //     ess.write(re)
                        // })
                        // ess.end();
                         
                        // ess.on('data', function(data) {
                        //     valueList.push(data);
                        // });
                         
                        // ess.on('end', function() {
                        //     console.log(valueList,'预测后结果');
                        //     //value list now equals: [2, 2, 2.5, 2.25, 1.625] 
                        // });
                        // var diff = holtWinters(residual, 1).augumentedDataset[60];
                        // var diff = 122;
                        console.log("残差",residual,"实际一小时",realData,"预测数据",periodData,"当前真实值",realNow,"预测的当前数据",periodNow+diff,"当前残差",diff,"对应周期数据",periodNow,"对应预测时间",new Date())
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
                            }
                            ]
                        });
                    })
                    .catch(function(error) {
                        console.log(error);
                    });
            

        })
        .catch(function(error) {
            console.log(error);
        });
        })


        function getPeriodData(data){
            return dataV.value.slice(getRangeIndex()-61,getRangeIndex())
        }
        function getRangeIndex(){
            var now = new Date();
            var today = parseInt(now/60000/24/60)*60000*24*60-8*60000*60;
            var index = parseInt((now-today)/60000);
            console.log("取整时间",index-4);
            return index-4;
        }


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
