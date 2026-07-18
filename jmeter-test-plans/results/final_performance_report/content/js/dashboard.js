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

    var data = {"OkPercent": 27.762962962962963, "KoPercent": 72.23703703703704};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [2.5925925925925926E-4, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.0, 500, 1500, "Get Incidents List"], "isController": false}, {"data": [0.0, 500, 1500, "Get Dashboard KPIs"], "isController": false}, {"data": [0.0, 500, 1500, "Get Incident Details"], "isController": false}, {"data": [0.0, 500, 1500, "Get Categories"], "isController": false}, {"data": [0.0, 500, 1500, "Create Incident"], "isController": false}, {"data": [0.0, 500, 1500, "Get Users by Role"], "isController": false}, {"data": [9.333333333333333E-4, 500, 1500, "Login Request"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 54000, 39008, 72.23703703703704, 3767.6273518518587, 0, 30743, 13066.0, 14920.900000000001, 15978.900000000001, 17581.99, 38.95609215568586, 18.557962725557577, 7.184859276302216], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Get Incidents List", 5000, 5000, 100.0, 0.0, 0, 0, 0.0, 0.0, 0.0, 0.0, 249.05359633393107, 55.904603522240485, 0.0], "isController": false}, {"data": ["Get Dashboard KPIs", 8000, 8000, 100.0, 9.01337499999999, 1, 126, 6.0, 20.0, 27.0, 49.0, 505.3057099545225, 187.3726866472966, 88.32980672056594], "isController": false}, {"data": ["Get Incident Details", 5000, 5000, 100.0, 7.987000000000006, 1, 148, 4.0, 18.0, 26.0, 50.98999999999978, 249.83760555638835, 92.5716643556688, 40.745000124918796], "isController": false}, {"data": ["Get Categories", 8000, 8000, 100.0, 8.94899999999998, 1, 102, 6.0, 20.0, 27.0, 48.0, 507.16368708000505, 188.06164416127805, 82.2159883352352], "isController": false}, {"data": ["Create Incident", 5000, 5000, 100.0, 7.917800000000015, 1, 85, 4.0, 19.0, 26.0, 46.0, 249.1280518186348, 92.44986297957149, 87.07351418472845], "isController": false}, {"data": ["Get Users by Role", 8000, 8000, 100.0, 9.156250000000028, 1, 112, 6.0, 20.0, 27.949999999999818, 49.0, 507.16368708000505, 188.06164416127805, 88.15931279320401], "isController": false}, {"data": ["Login Request", 15000, 8, 0.05333333333333334, 13543.69360000004, 659, 30743, 13277.0, 15571.9, 16233.949999999999, 17990.97, 10.821191355455214, 8.653131851166776, 2.3882707483719514], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["500", 8, 0.020508613617719443, 0.014814814814814815], "isController": false}, {"data": ["Non HTTP response code: java.lang.ClassCastException/Non HTTP response message: class org.apache.jmeter.config.Argument cannot be cast to class org.apache.jmeter.protocol.http.util.HTTPArgument (org.apache.jmeter.config.Argument and org.apache.jmeter.protocol.http.util.HTTPArgument are in unnamed module of loader org.apache.jmeter.DynamicClassLoader @3b07d329)", 731, 1.873974569319114, 1.3537037037037036], "isController": false}, {"data": ["403", 34000, 87.16160787530762, 62.96296296296296], "isController": false}, {"data": ["Non HTTP response code: java.lang.ClassCastException/Non HTTP response message: null", 4269, 10.943908941755538, 7.905555555555556], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 54000, 39008, "403", 34000, "Non HTTP response code: java.lang.ClassCastException/Non HTTP response message: null", 4269, "Non HTTP response code: java.lang.ClassCastException/Non HTTP response message: class org.apache.jmeter.config.Argument cannot be cast to class org.apache.jmeter.protocol.http.util.HTTPArgument (org.apache.jmeter.config.Argument and org.apache.jmeter.protocol.http.util.HTTPArgument are in unnamed module of loader org.apache.jmeter.DynamicClassLoader @3b07d329)", 731, "500", 8, "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["Get Incidents List", 5000, 5000, "Non HTTP response code: java.lang.ClassCastException/Non HTTP response message: null", 4269, "Non HTTP response code: java.lang.ClassCastException/Non HTTP response message: class org.apache.jmeter.config.Argument cannot be cast to class org.apache.jmeter.protocol.http.util.HTTPArgument (org.apache.jmeter.config.Argument and org.apache.jmeter.protocol.http.util.HTTPArgument are in unnamed module of loader org.apache.jmeter.DynamicClassLoader @3b07d329)", 731, "", "", "", "", "", ""], "isController": false}, {"data": ["Get Dashboard KPIs", 8000, 8000, "403", 8000, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Get Incident Details", 5000, 5000, "403", 5000, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Get Categories", 8000, 8000, "403", 8000, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Create Incident", 5000, 5000, "403", 5000, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Get Users by Role", 8000, 8000, "403", 8000, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Login Request", 15000, 8, "500", 8, "", "", "", "", "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
