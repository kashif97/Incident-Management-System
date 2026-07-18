/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 0.0, "KoPercent": 100.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.0, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.0, 500, 1500, "Get Incidents List"], "isController": false}, {"data": [0.0, 500, 1500, "Get Dashboard KPIs"], "isController": false}, {"data": [0.0, 500, 1500, "Get Incident Details"], "isController": false}, {"data": [0.0, 500, 1500, "Get Categories"], "isController": false}, {"data": [0.0, 500, 1500, "Create Incident"], "isController": false}, {"data": [0.0, 500, 1500, "Get Users by Role"], "isController": false}, {"data": [0.0, 500, 1500, "Login Request"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 54000, 54000, 100.0, 1.4319999999999746, 0, 96, 0.0, 3.0, 3.0, 4.0, 1824.9408583981076, 498.4869716859581, 165.64268967556606], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Get Incidents List", 5000, 5000, 100.0, 2.000000000000006E-4, 0, 1, 0.0, 0.0, 0.0, 0.0, 252.98522566282128, 44.62901495458915, 0.0], "isController": false}, {"data": ["Get Dashboard KPIs", 8000, 8000, 100.0, 2.6367500000000086, 0, 96, 2.0, 4.0, 5.0, 10.0, 514.8999163287637, 190.93031955976056, 90.00691896762567], "isController": false}, {"data": ["Get Incident Details", 5000, 5000, 100.0, 2.749399999999996, 0, 76, 2.0, 4.0, 6.0, 11.989999999999782, 253.84576331421027, 94.20057622988273, 41.39867429050109], "isController": false}, {"data": ["Get Categories", 8000, 8000, 100.0, 2.618124999999995, 0, 86, 2.0, 4.0, 5.0, 10.0, 518.0340607394936, 192.0924933626886, 83.97817781519134], "isController": false}, {"data": ["Create Incident", 5000, 5000, 100.0, 0.01240000000000001, 0, 1, 0.0, 0.0, 0.0, 1.0, 253.1004808909137, 47.67276085168312, 0.0], "isController": false}, {"data": ["Get Users by Role", 8000, 8000, 100.0, 2.6742499999999914, 0, 85, 2.0, 4.0, 5.0, 10.0, 518.168275147354, 192.14226148066584, 90.07221970334867], "isController": false}, {"data": ["Login Request", 15000, 15000, 100.0, 0.005666666666666707, 0, 3, 0.0, 0.0, 0.0, 0.0, 507.0822487407457, 73.40807866535953, 0.0], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: java.lang.ClassCastException/Non HTTP response message: class org.apache.jmeter.config.Argument cannot be cast to class org.apache.jmeter.protocol.http.util.HTTPArgument (org.apache.jmeter.config.Argument and org.apache.jmeter.protocol.http.util.HTTPArgument are in unnamed module of loader org.apache.jmeter.DynamicClassLoader @3b07d329)", 2302, 4.262962962962963, 4.262962962962963], "isController": false}, {"data": ["403", 29000, 53.7037037037037, 53.7037037037037], "isController": false}, {"data": ["Non HTTP response code: java.lang.ClassCastException/Non HTTP response message: null", 22698, 42.03333333333333, 42.03333333333333], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 54000, 54000, "403", 29000, "Non HTTP response code: java.lang.ClassCastException/Non HTTP response message: null", 22698, "Non HTTP response code: java.lang.ClassCastException/Non HTTP response message: class org.apache.jmeter.config.Argument cannot be cast to class org.apache.jmeter.protocol.http.util.HTTPArgument (org.apache.jmeter.config.Argument and org.apache.jmeter.protocol.http.util.HTTPArgument are in unnamed module of loader org.apache.jmeter.DynamicClassLoader @3b07d329)", 2302, "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["Get Incidents List", 5000, 5000, "Non HTTP response code: java.lang.ClassCastException/Non HTTP response message: null", 4449, "Non HTTP response code: java.lang.ClassCastException/Non HTTP response message: class org.apache.jmeter.config.Argument cannot be cast to class org.apache.jmeter.protocol.http.util.HTTPArgument (org.apache.jmeter.config.Argument and org.apache.jmeter.protocol.http.util.HTTPArgument are in unnamed module of loader org.apache.jmeter.DynamicClassLoader @3b07d329)", 551, "", "", "", "", "", ""], "isController": false}, {"data": ["Get Dashboard KPIs", 8000, 8000, "403", 8000, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Get Incident Details", 5000, 5000, "403", 5000, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Get Categories", 8000, 8000, "403", 8000, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Create Incident", 5000, 5000, "Non HTTP response code: java.lang.ClassCastException/Non HTTP response message: null", 4449, "Non HTTP response code: java.lang.ClassCastException/Non HTTP response message: class org.apache.jmeter.config.Argument cannot be cast to class org.apache.jmeter.protocol.http.util.HTTPArgument (org.apache.jmeter.config.Argument and org.apache.jmeter.protocol.http.util.HTTPArgument are in unnamed module of loader org.apache.jmeter.DynamicClassLoader @3b07d329)", 551, "", "", "", "", "", ""], "isController": false}, {"data": ["Get Users by Role", 8000, 8000, "403", 8000, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Login Request", 15000, 15000, "Non HTTP response code: java.lang.ClassCastException/Non HTTP response message: null", 13800, "Non HTTP response code: java.lang.ClassCastException/Non HTTP response message: class org.apache.jmeter.config.Argument cannot be cast to class org.apache.jmeter.protocol.http.util.HTTPArgument (org.apache.jmeter.config.Argument and org.apache.jmeter.protocol.http.util.HTTPArgument are in unnamed module of loader org.apache.jmeter.DynamicClassLoader @3b07d329)", 1200, "", "", "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
