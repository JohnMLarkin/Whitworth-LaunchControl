// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

google.charts.load('current', {'packages':['gauge']});
google.charts.setOnLoadCallback(drawCommandVoltageGauge);
google.charts.setOnLoadCallback(drawCommandTemperatureGauges);

function drawCommandVoltageGauge() {

  var data = google.visualization.arrayToDataTable([
    ['Label', 'Value'],
    ['Voltage', 7.4],
  ]);

  var options = {
    max: 12,
    minorTicks: 3,
    greenFrom: 7.0, greenTo: 12,
    yellowFrom: 6.0, yellowTo: 7.0,
    redFrom: 0.0, redTo: 6.0,
    height: 120, width: 120
  };

  var chart = new google.visualization.Gauge(document.getElementById('cmdVoltGauge'));

  chart.draw(data, options);

  setInterval(function() {
    data.setValue(0, 1, 7.0 + Math.round(30 * Math.random())/10.0);
    chart.draw(data, options);
  }, 13000);
}

function drawCommandTemperatureGauges() {

  var data = google.visualization.arrayToDataTable([
    ['Label', 'Value'],
    ['External', 55],
    ['Internal', 35]
  ]);

  var options = {
    min: -50,
    max: 100,
    height: 120, width: 240
  };

  var chart = new google.visualization.Gauge(document.getElementById('cmdTempGauges'));

  chart.draw(data, options);

  setInterval(function() {
    data.setValue(1, 1, 40 + Math.round(20 * Math.random()));
    data.setValue(0, 1, -40 + Math.round(80 * Math.random()));
    chart.draw(data, options);
  }, 13000);
}
