function handleGPSswitch(event) {
  if (logLines.length>maxLines) logLines.shift();
  if (event.target.checked) {
    myPort.write("GPS ON\r\n");
    logLines.push('> GPS ON');
    document.getElementById('button-GPS_update').disabled = false;
  } else {
    myPort.write("GPS OFF\r\n");
    logLines.push('> GPS OFF');
    document.getElementById('button-GPS_update').disabled = true;
  }
  document.getElementById('modemConsole').innerHTML =  logLines.join("<br>");
}

function handleIridiumSwitch(event) {
  if (logLines.length>maxLines) logLines.shift();
  if (event.target.checked) {
    myPort.write("SATLINK ON\r\n");
    logLines.push('> SATLINK ON');
  } else {
    myPort.write("SATLINK OFF\r\n");
    logLines.push('> SATLINK OFF');
  }
  while (logLines.length>maxLines) logLines.shift();
  document.getElementById('modemConsole').innerHTML =  logLines.join("<br>");
}

function handlePodSwitch(event) {
  if (event.target.checked) {
    myPort.write("PODLINK ON\r\n");
    logLines.push('> PODLINK ON');
  } else {
    myPort.write("PODLINK OFF\r\n");
    logLines.push('> PODLINK OFF');
  }
  while (logLines.length>maxLines) logLines.shift();
  document.getElementById('modemConsole').innerHTML =  logLines.join("<br>");
}

function handleRadioSwitch(event) {
  if (logLines.length>maxLines) logLines.shift();
  if (event.target.checked) {
    myPort.write("RADIO ON\r\n");
    logLines.push('> RADIO ON');
  } else {
    myPort.write("RADIO OFF\r\n");
    logLines.push('> RADIO OFF');
  }
  while (logLines.length>maxLines) logLines.shift();
  document.getElementById('modemConsole').innerHTML =  logLines.join("<br>");
}

const gpsSwitch = document.getElementById('switch-GPS');
gpsSwitch.addEventListener('click', handleGPSswitch, false);

const iridiumSwitch = document.getElementById('switch-Iridium');
iridiumSwitch.addEventListener('click', handleIridiumSwitch, false);

const podSwitch = document.getElementById('switch-XBee');
podSwitch.addEventListener('click', handlePodSwitch, false);

const radioSwitch = document.getElementById('switch-Radio900');
radioSwitch.addEventListener('click', handleRadioSwitch, false);

const updateGPSbutton = document.getElementById('button-GPS_update');
updateGPSbutton.addEventListener('click', updatePosition, false)

function updatePosition(event) {
  if (gpsSwitch.checked) {
    myPort.write("GPSDATA\r\n");
    logLines.push('> GPSDATA');
    while (logLines.length>maxLines) logLines.shift();
    document.getElementById('modemConsole').innerHTML =  logLines.join("<br>");
    waitingForGPSData = true;
  }
}
