TrueSight Pulse ActiveMQ Queues Integration Plugin
-------------------------

Collects metrics from ActiveMQ broker instance on Queues.

### Prerequisites

|     OS    | Linux | Windows | OS X |
|:----------|:-----:|:-------:|:----:|
| Supported |   v   |    -    |  -   |


|  Runtime | node.js | Python | Java |
|:---------|:-------:|:------:|:----:|
| Required |    +    |        |      |

- [How to install node.js?](https://help.truesight.bmc.com/hc/en-us/articles/202360701)

### Plugin Setup
None

#### Plugin Configuration Fields


|Field Name     |Description                                                    |
|:--------------|:--------------------------------------------------------------|
|Poll Interval  |How often (in miliseconds) to poll for collecting the metrics  |
|Base URL       |Basic URL to collect metrics from Hipster of Kubernetes        |

### Metrics Collected

Tracks the following metrics for the [ActiveMQ](https://kubernetes.io/) Queue instances.

|Metric Name                        |Description                                             |
|:----------------------------------|:-------------------------------------------------------|
