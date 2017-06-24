// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const serialport = require('serialport')

var btCount = 0;
var portFound = false;
var myPort = new serialport('COM1', {autoOpen: false}); // just a dummy

var waitingForGPSData = false;
var nextGPSelement = 0;

// Autodetect mbed connection
function autoDetectPort() {
  serialport.list(function (err, ports) {
    ports.forEach(function(port) {
      //console.log("For " + port.comName + " search is " + port.pnpId.search("BTHENUM"));
      if (port.pnpId.search("BTHENUM")==0) {
        btCount++;
        if ((btCount==2) && !portFound) {
          myPort = new serialport(port.comName, {
            autoOpen: false,
            baudRate: 115200,
            parser: serialport.parsers.readline("\r\n")
          });
          portFound = true;
        }
      }
      if ((port.manufacturer == 'mbed') &&  !portFound) {
        myPort = new serialport(port.comName, {
          autoOpen: false,
          baudRate: 115200,
          parser: serialport.parsers.readline("\r\n")
        });
        portFound = true;
      }
    });
    if (portFound) {
      myPort.on('open', showPortOpen);
      myPort.on('data', receiveSerialData);
      myPort.on('close', showPortClose);
      myPort.on('error', showError);
      myPort.open();
      document.getElementById('switch-XBee').disabled = false;
      document.getElementById('button-GPS_update').disabled = false;
    }
  });
}

var logLines = [];
const maxLines = 28;

function showPortOpen() {
  while (logLines.length>maxLines) logLines.shift();
  logLines.push('Port open with data rate ' + myPort.options.baudRate + ' baud');
  document.getElementById('modemConsole').innerHTML =  logLines.join("<br>");
}

function receiveSerialData(data) {
  if (waitingForGPSData) {
    switch (nextGPSelement) {
      case 1:
        document.getElementById('latitude').innerHTML = Number(data.substring(data.indexOf("=")+1)).toFixed(5);
        break;
      case 2:
        document.getElementById('longitude').innerHTML = Number(data.substring(data.indexOf("=")+1)).toFixed(5);
        break;
      case 3:
        document.getElementById('altitude').innerHTML = Number(data.substring(data.indexOf("=")+1)).toFixed(0);
        break;
      case 4:
        nextGPSelement = -1;
        waitingForGPSData = false;
        break;
      default:
    }
    nextGPSelement++;
  }
  while (logLines.length>maxLines) logLines.shift();
  logLines.push(data);
  document.getElementById('modemConsole').innerHTML =  logLines.join("<br>");
}

function showPortClose() {
  while (logLines.length>maxLines) logLines.shift();
  logLines.push('Port closed.');
  document.getElementById('modemConsole').innerHTML =  logLines.join("<br>");
  portFound = false;
}

function showError(error) {
  while (logLines.length>maxLines) logLines.shift();
  logLines.push('Serial port error: ' + error);
  portFound = false;
  document.getElementById('modemConsole').innerHTML =  logLines.join("<br>");
}

setInterval(function() {
  if (!portFound) {
    autoDetectPort();
  }
}, 5000);
