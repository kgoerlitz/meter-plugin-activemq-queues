'use strict';

const params  = require('./param.json');
const metrics = require('./metrics.json');
const request = require('request-promise-native');
const os      = require('os');

if (!params.host) {
    throw new ReferenceError('ActiveMQ host is missing');
}
if (!params.broker_name) {
    throw new ReferenceError('ActiveMQ broker name is missing');
}

const pollInterval = params.pollInterval || 5000;
const baseUrl      = `http://${params.host}:${params.port||8161}`;
const brokerPath   = `org.apache.activemq:type=Broker,brokerName=${params.broker_name}`;
const sourcePrefix = (params.sourcePrefix || os.hostname()).trim(); // get the metric source

var auth_options = {
    user: params.username,
    pass: params.password
};
let amqRequest = request.defaults({
    baseUrl: `${baseUrl}/api/jolokia/read/`,
    auth: auth_options,
    headers: {
        'User-Agent': 'pulse-plugin-activemq-queues',
        'Content-Type': 'application/json'
    }
});

let previousValues = {};

function poll() {
    sendRequest('GET', brokerPath)
    .then(result => {
        //console.log('==> Result: '+JSON.stringify(result, null, 4));
        let queuePromise = Promise.resolve(true);
        result.value.Queues.forEach(queueEntry => {
            let queuePath = queueEntry.objectName;
            queuePromise = queuePromise.then(() => {
                return sendRequest('GET', queuePath)
                .then(queueResult => {
                    let queueData = queueResult.value;
                    let queueName = queueData.Name;
                    for (let metricName in metrics) {
                        let metric = metrics[metricName];
                        let metricValue = queueData[metric.valueFrom];
                        
                        if (metric.subtractPrevious) {
                            let previousQueueValues = previousValues[queueName];
                            let currentMetricValue = metricValue;
                            if (!previousQueueValues) {
                                previousValues[queueName] = {};
                            }
                            if (previousQueueValues && previousQueueValues[metricName]) {
                                metricValue -= previousQueueValues[metricName];
                            } else {
                                metricValue = 0;
                            }
                            previousValues[queueName][metricName] = currentMetricValue;
                        }
                        
                        if (metric.compute) {
                            metricValue = computeMethods[metric.compute.method](metricValue, metric.compute.value);
                        }
                        
                        console.log(`${metricName} ${metricValue} ${sourcePrefix}.queue.${queueName}`);
                    }
                    return Promise.resolve(true);
                })
                .catch(error => {
                    console.error(error.toString());
                });
            });
        });
    })
    .catch(error => {
        console.error(error.toString());
    });
}

const computeMethods = {
    add: function add(op1, op2) {
        return op1 + op2;
    },
    
    subtract: function subtract(op1, op2) {
        return op1 - op2;
    },
    
    multiply: function multiply(op1, op2) {
        return op1 * op2;
    },
    
    divide: function divide(op1, op2) {
        return op1 / op2;
    }
}

function sendRequest(method, uri, data) {
    var requestOptions = {
        method: method,
        uri:    uri,
        json:   true,
        simple: true
    };

    return amqRequest(requestOptions).then(response => {
        if (response.error) {
            return Promise.reject(response.error);
        } else {
            return Promise.resolve(response);
        }
    });
}

function execute() {
    poll();
    setInterval(poll, pollInterval);
}

execute();

process.on('unhandledRejection', error => {
    console.error('Unhandled rejection');
    console.error(error);
    //Retry execution after increased amount of time
    setTimeout(execute, pollInterval*10);
});
