// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const serialport = require('serialport')

var btCount = 0;
var portFound = false;
var myPort = new serialport('COM1', {autoOpen: false}); // just a dummy

var batteryVoltage = 0;
var externalTemperature = -50;
var internalTemperature = -50;

var logLines = [];
const maxLines = 28;

var cmdQueue = [];
var busy = false;
var waitingForGPSData = false;
var nextGPSelement = 0;
var waitingForCmdSensors = false;
var nextCmdSensorElement = 0;

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
      /*
      if ((port.manufacturer == 'mbed') &&  !portFound) {
        myPort = new serialport(port.comName, {
          autoOpen: false,
          baudRate: 115200,
          parser: serialport.parsers.readline("\r\n")
        });
        portFound = true;
      }
      */
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
        busy = false;
        break;
      default:
    }
    nextGPSelement++;
  } else if (waitingForCmdSensors) {
    switch (nextCmdSensorElement) {
      case 0:
        batteryVoltage = Number(data.substring(data.indexOf("=")+1)).toFixed(1);
        break;
      case 1:
        externalTemperature = Number(data.substring(data.indexOf("=")+1)).toFixed(1);
        break;
      case 2:
        internalTemperature = Number(data.substring(data.indexOf("=")+1)).toFixed(1);
        break;
      case 3:
        nextCmdSensorElement = -1;
        waitingForCmdSensors = false;
        busy = false;
        break;
      default:
    }
    nextCmdSensorElement++;
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

function processCmdQueue() {
  if (portFound && !busy && (cmdQueue.length>0)) {
    command = cmdQueue.shift();
    busy = true;
    switch (command) {
      case "CMDSENSORS":
        myPort.write("CMDSENSORS\r\n");
        logLines.push('> CMDSENSORS');
        waitingForCmdSensors = true;
        break;
      case "GPS ON":
        myPort.write("GPS ON\r\n");
        logLines.push('> GPS ON');
        document.getElementById('button-GPS_update').disabled = false;
        busy = false;
        break;
      case "GPS OFF":
        myPort.write("GPS OFF\r\n");
        logLines.push('> GPS OFF');
        document.getElementById('button-GPS_update').disabled = true;
        busy = false;
        break;
      case "SATLINK ON":
        myPort.write("SATLINK ON\r\n");
        logLines.push('> SATLINK ON');
        busy = false;
        break;
      case "SATLINK OFF":
        myPort.write("SATLINK OFF\r\n");
        logLines.push('> SATLINK OFF');
        busy = false;
        break;
      case "PODLINK ON":
        myPort.write("PODLINK ON\r\n");
        logLines.push('> PODLINK ON');
        busy = false;
        break;
      case "PODLINK OFF":
        myPort.write("PODLINK OFF\r\n");
        logLines.push('> PODLINK OFF');
        busy = false;
        break;
      case "RADIO ON":
        myPort.write("RADIO ON\r\n");
        logLines.push('> RADIO ON');
        busy = false;
        break;
      case "RADIO OFF":
        myPort.write("RADIO OFF\r\n");
        logLines.push('> RADIO OFF');
        busy = false;
        break;
      case "GPSDATA":
        myPort.write("GPSDATA\r\n");
        logLines.push('> GPSDATA');
        waitingForGPSData = true;
        break;
    }
    while (logLines.length>maxLines) logLines.shift();
    document.getElementById('modemConsole').innerHTML =  logLines.join("<br>");
  }
}

setInterval(function() {
  if (portFound) {
    cmdQueue.push("CMDSENSORS");
  }
}, 10000);

setInterval(processCmdQueue, 500);

setInterval(function() {
  if (!portFound) {
    autoDetectPort();
  }
}, 5000);
