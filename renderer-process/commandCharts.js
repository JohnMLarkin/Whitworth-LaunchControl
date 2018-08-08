// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

google.charts.load('current', {'packages':['gauge']});
google.charts.setOnLoadCallback(drawCommandVoltageGauge);
google.charts.setOnLoadCallback(drawCommandTemperatureGauges);

function drawCommandVoltageGauge() {

  var data = google.visualization.arrayToDataTable([
    ['Label', 'Value'],
    ['Voltage', batteryVoltage],
  ]);

  var options = {
    max: 9,
    minorTicks: 3,
    greenFrom: 7.4, greenTo: 9,
    yellowFrom: 6.2, yellowTo: 7.4,
    redFrom: 0.0, redTo: 6.0,
    height: 120, width: 120
  };

  var chart = new google.visualization.Gauge(document.getElementById('cmdVoltGauge'));

  chart.draw(data, options);

  setInterval(function() {
    data.setValue(0, 1, batteryVoltage);
    chart.draw(data, options);
  }, 10000);
}

function drawCommandTemperatureGauges() {

  var data = google.visualization.arrayToDataTable([
    ['Label', 'Value'],
    ['External', externalTemperature],
    ['Internal', internalTemperature]
  ]);

  var options = {
    min: -50,
    max: 100,
    height: 120, width: 240
  };

  var chart = new google.visualization.Gauge(document.getElementById('cmdTempGauges'));

  chart.draw(data, options);

  setInterval(function() {
    data.setValue(1, 1, internalTemperature);
    data.setValue(0, 1, externalTemperature);
    chart.draw(data, options);
  }, 10000);
}
