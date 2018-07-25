function handleGPSswitch(event) {
  if (event.target.checked) {
    cmdQueue.push("GPS ON");
  } else {
    cmdQueue.push("GPS OFF");
  }
}

function handleIridiumSwitch(event) {
  if (event.target.checked) {
    cmdQueue.push("SATLINK ON");
  } else {
    cmdQueue.push("SATLINK OFF");
  }
}

function handlePodSwitch(event) {
  if (event.target.checked) {
    cmdQueue.push("PODLINK ON");
  } else {
    cmdQueue.push("PODLINK OFF");
  }
}

function handleRadioSwitch(event) {
  if (event.target.checked) {
    cmdQueue.push("RADIO ON");
  } else {
    cmdQueue.push("RADIO OFF");
  }
}

function updatePosition(event) {
  cmdQueue.push("GPSDATA");
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
