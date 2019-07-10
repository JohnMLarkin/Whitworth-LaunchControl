// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const serialport = require('serialport');
const Readline = require('@serialport/parser-readline');

const dataTypes = require('./renderer-process/dataTypes');

const dataTypeDefinitions = {
  'uint8': {size: 1, converter:'readUInt8'},
  'int8': {size: 1, converter: 'readInt8'},
  'uint16': {size: 2, converter: 'readUInt16LE'},
  'int16': {size: 2, converter: 'readInt16LE'},
  'uint32': {size: 4, converter: 'readUInt32LE'},
  'int32': {size: 4, converter: 'readInt32LE'},
  'float': {size: 4, converter: 'readFloatLE'},
  'double': {size: 8, converter: 'readDoubleLE'}
};

var portFound = false;
var portName;
var portConnected = false;
var myPort = new serialport('COM1', {autoOpen: false}); // just a dummy
var parser;

var detectPortTicker;
var detectConnectTicker;
var processCmdQueueTicker;
var updateSensorsTicker;

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
var waitingForFlightMode = false;
var flightMode;
var waitingForHandshake = false;
var waitingForFlightModeOk = false;
var flightModeChangeProcessing = false;
var waitingForPodData = false;
var waitingForPodLinkOk = false;
var podDataPodIndex;
var podDataElement = 0;
var podDataLength;
var podDataArray = [];

// Search for Bluetooth port
function autoDetectPort() {
  serialport.list(function (err, ports) {
    if (err) console.log(err);
    if (ports) console.log(ports);
    ports.forEach(function(port) {
      // My RN41 has a MAC address of D1:D3 and this appears in the pnpId
      if ((port.pnpId.search("BTHENUM")==0) && (port.pnpId.includes("D1D3"))) {
        if (!portFound) {
          clearInterval(detectPortTicker);
          portName = port.comName;
          portFound = true;
          portConnected = false;
          while (logLines.length>maxLines) logLines.shift();
          logLines.push('Bluetooth port at ' + portName);
          document.getElementById('modemConsole').innerHTML =  logLines.join("<br>");
          myPort = new serialport(portName, {
            baudRate: 115200,
            autoOpen: false
          });
          detectConnectTicker = setInterval(autoConnectPort, 1000);
        }
      }
    });
  });
}

// On page load start autoDetectPort and continue until Bluetooth found
detectPortTicker = setInterval(autoDetectPort, 1000);

// Try to make serial port connection
function autoConnectPort() {
  myPort.open( (err) => {
    if (!err) {
      clearInterval(detectConnectTicker);
      portConnected = true;
      while (logLines.length>maxLines) logLines.shift();
      logLines.push('Bluetooth connected with data rate ' + myPort.baudRate + ' baud');
      parser = myPort.pipe(new Readline({delimiter:'\r\n'}));
      parser.on('data', receiveSerialData);
      myPort.on('close', showPortClose);
      myPort.on('error', showError);
      document.getElementById('modemConsole').innerHTML =  logLines.join("<br>");
      document.getElementById('switch-XBee').disabled = false;
      document.getElementById('button-GPS_update').disabled = true;
      processCmdQueueTicker = setInterval(function() {
        processCmdQueue();
      }, 500);
      setTimeout(function() {
        cmdQueue.push("HELLO");
      }, 1000);
    }
  });
}

function showPortClose() {
  clearInterval(processCmdQueueTicker);
  clearInterval(updateSensorsTicker);
  while (logLines.length>maxLines) logLines.shift();
  logLines.push('Port closed.');
  document.getElementById('modemConsole').innerHTML =  logLines.join("<br>");
  portFound = false;
  portConnected = false;
  detectPortTicker = setInterval(autoDetectPort, 1000);
}

function showError(error) {
  while (logLines.length>maxLines) logLines.shift();
  logLines.push('Serial port error: ' + error);
  console.log(error);
  document.getElementById('switch-XBee').disabled = false;
  document.getElementById('button-GPS_update').disabled = true;
  document.getElementById('modemConsole').innerHTML =  logLines.join("<br>");
}

function receiveSerialData(data) {
  console.log(data);
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
  } else if (waitingForFlightMode) {
    flightMode = Number(data.substring(data.indexOf("=")+1));
    waitingForFlightMode = false;
    flightModeChangeProcessing = false;
    busy = false;
  } else if (waitingForHandshake) {
    if (data=='COMMAND MODULE READY') {
      updateSensorsTicker = setInterval(function() {
        cmdQueue.push("CMDSENSORS");
      }, 120000);
      waitingForHandshake = false;
      busy = false;
    }
  } else if (waitingForFlightModeOk) {
    if (data=="OK") cmdQueue.push("FLIGHT_MODE?");
    waitingForFlightMode = true;
    waitingForFlightModeOk = false;
    busy = false;
  } else if (waitingForPodData) {
    switch (podDataElement) {
      case 0:
      break;
      case 1:
      podDataLength = Number(data.substring(data.indexOf("=")+1));            //"BYTES=#"
      if (podDataLength == 0) {
        //no data recieved, skip next case 
        podDataElement++;
        console.log("No data received.");
      }
      break;
      case 2:
      var n0 = data.indexOf("=");                                             //"DATA= __ __ __ ..."
      var n;
      var dataSnip;
      podDataArray = [];                                                      //clear data array
      for (let i = 0; i < podDataLength; i++) {
        n = n0 + 3 * i;
        dataSnip = data.substring(n+2,n+4);
        podDataArray.push(parseInt(dataSnip, 16)); 
        console.log("Data: " + dataSnip);
      }

      var table = document.getElementById('pod'+podDataPodIndex.toString()+'Table_monitor');

      var podDataArrayIndex = 0;
      var podDataType;
      var value;
      var byteBuffer = Buffer.from(podDataArray)  //create buffer object from data array, that will be interpreted based on data type
      for (let i = 1; i < table.rows.length; i++) {
        podDataType = document.getElementById('pod'+podDataPodIndex.toString()+'item'+i.toString()+'Type').value;              //get data type for this row
        value = 0;
        document.getElementById('pod'+podDataPodIndex.toString()+'item'+i.toString()+'bytes' + '_monitor').innerHTML = " "; //empty bytes field
        for (let j = 0; j < dataTypes[podDataType][2]; j++) {
          document.getElementById('pod'+podDataPodIndex.toString()+'item'+i.toString()+'bytes' + '_monitor').innerHTML += podDataArray[podDataArrayIndex++].toString(16).toUpperCase() + "\xa0\xa0";
        }
        console.log(podDataArrayIndex.toString() + " " + dataTypes[podDataType][2].toString());
        value = byteBuffer[dataTypeDefinitions[dataTypes[podDataType][0]].converter](podDataArrayIndex - dataTypes[podDataType][2]);
        if ((dataTypes[podDataType][0]=='float')||(dataTypes[podDataType][0]=='double')) {
          value = value.toPrecision(4);  
        }
        document.getElementById('pod'+podDataPodIndex.toString()+'item'+i.toString()+'value' + '_monitor').innerHTML = value;
        console.log(value);
      }
      break;
      default: 
        waitingForPodData = false;
        busy = false;
        podDataElement = -1;
    }
    podDataElement++;

  } else {
    if ((data=="OK") || (data=="ERROR")) busy = false;
  }
  while (logLines.length>maxLines) logLines.shift();
  logLines.push(data);
  document.getElementById('modemConsole').innerHTML =  logLines.join("<br>");
}

function processCmdQueue() {
  if (myPort.isOpen && !busy && (cmdQueue.length>0)) {
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
        break;
      case "GPS OFF":
        myPort.write("GPS OFF\r\n");
        logLines.push('> GPS OFF');
        document.getElementById('button-GPS_update').disabled = true;
        break;
      case "SATLINK ON":
        myPort.write("SATLINK ON\r\n");
        logLines.push('> SATLINK ON');
        break;
      case "SATLINK OFF":
        myPort.write("SATLINK OFF\r\n");
        logLines.push('> SATLINK OFF');
        break;
      case "PODLINK ON":
        while (command != "END") {
          myPort.write(`${command}\r\n`);
          logLines.push(`> ${command}`);
          command = cmdQueue.shift();
        }
        myPort.write("END\r\n");
        logLines.push(`> END`);
        break;
      case "PODLINK OFF":
        myPort.write("PODLINK OFF\r\n");
        logLines.push('> PODLINK OFF');
        break;
      case "PODDATA 1":
        myPort.write("PODDATA 1\r\n");
        logLines.push('> PODDATA 1');
        podDataPodIndex = 1;
        waitingForPodData = true;
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
      case "FLIGHT_MODE ON":
        clearInterval(updateSensorsTicker);
        myPort.write("FLIGHT_MODE ON\r\n");
        logLines.push('> FLIGHT_MODE ON');
        busy = true;
        waitingForFlightModeOk = true;
        break;
      case "FLIGHT_MODE OFF":
        myPort.write("FLIGHT_MODE OFF\r\n");
        logLines.push('> FLIGHT_MODE OFF');
        busy = true;
        waitingForFlightModeOk = true;
        break;
      case "FLIGHT_MODE?":
        myPort.write("FLIGHT_MODE?\r\n");
        logLines.push('> FLIGHT_MODE?');
        waitingForFlightMode = true;
        break;
      case "HELLO":
        waitingForHandshake = true;
        logLines.push('Waiting for response from Command Module...');
        myPort.write("HELLO\r\n", 'ascii', (err) => {
          if (err) console.log(err);
        });
        break;
      default:
        if (command.includes("TRANSPERIOD")) {
          let p = Number(command.substring(command.indexOf("=")+1));
          myPort.write(`TRANSPERIOD ${p.toFixed(0)}\r\n`);
          logLines.push(`> TRANSPERIOD ${p.toFixed(0)}`);
        } else if (command.includes("MISSIONID")) {
          let p = Number(command.substring(command.indexOf("=")+1));
          myPort.write(`MISSIONID ${p.toFixed(0)}\r\n`);
          logLines.push(`> MISSIONID ${p.toFixed(0)}`);
        } else if (command.includes("ERROR")) {
          let p = command.substring(command.indexOf(":")+1);
          logLines.push(`> ERROR: ${p}`);
          busy = false;
        } else {
          logLines.push(`> Unrecognized command: ${command}`);
          busy = false;
        }
    }
    while (logLines.length>maxLines) logLines.shift();
    document.getElementById('modemConsole').innerHTML =  logLines.join("<br>");
  }
}
