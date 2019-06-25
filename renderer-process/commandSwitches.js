const settings = require('electron-settings');

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
    var fcPresent = false;
    var fcID = [];
    var missionIdEntry = document.getElementById("missionID");
    let id = missionIdEntry.value;
    if (id) {
      for (let i = 1; i <= numPods; i++) {
        descriptionField = document.getElementById("pod"+i.toString()+"_FC_ID");
        fcID[i-1] = descriptionField.value;
        if (fcID[i-1].length>0) fcPresent = true; 
      }
      if (fcPresent) {
        cmdQueue.push("PODLINK ON");
        for (let i = 1; i <= numPods; i++) {
          console.log(`FC ID: ${fcID[i-1]}`);
          if (fcID[i-1].length>0) {
            cmdQueue.push(`POD ${i} = ${fcID[i-1]} ${numBytesPods[i]}`);
          }
        }
        cmdQueue.push("END");
      } else {
        cmdQueue.push(`ERROR: No flight computer IDs have been entered on the Configure Mission tab`);
      }
    } else {
      cmdQueue.push(`ERROR: First enter a mission ID on the Configure Mission tab`);
    }
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
