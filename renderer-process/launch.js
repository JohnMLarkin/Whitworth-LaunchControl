const settings = require('electron-settings');

const dataTypes = require('./dataTypes');

var missionTotal = 0;
var transmitPeriod = 60;

function sum(total, num) {
    return total + num;
}

function getMissionBytes(event) {
  let id = missionIdEntry.value;
  if (settings.has('missions.'+id.toString())) {
    document.getElementById('missionIdError').innerHTML = '';
    let podTable = settings.get('missions.'+id.toString()+'.podTable');
    let numBytesPods = [27, 0, 0, 0, 0, 0, 0];
    const numPods = podTable.length;
    for (let i = 0; i< numPods; i++) {
      var numRows = podTable[i].length;
      var total = 0;
      for (let j = 0; j < numRows; j++) {
        var typeCode = podTable[i][j][2];
        total = total + dataTypes[typeCode][2];
      }
      if (total>0) {
        numBytesPods[i+1] = total + 1;
      } else numBytesPods[i+1] = 0;
    }
    missionTotal = numBytesPods.reduce(sum);
  } else {  // Mission configuration is not saved locally
    document.getElementById('missionIdError').innerHTML = 'Mission not saved locally';
  }
  updateEstimatedCost();
}

function updateTransmitPeriod(event) {
  let wholeString = periodSelect.value;
  transmitPeriod = wholeString.substring(0,2);
  updateEstimatedCost();
}

function updateEstimatedCost() {
  let cost;
  let costPerMessage;
  let missionLength = 2.5*60*60;
  const costIndicator = document.getElementById('estCost');
  if (missionTotal < 30) {
    costPerMessage = 0.04;
  } else {
    costPerMessage = 0.04 + 0.0015*(missionTotal-30);
  }
  cost = costPerMessage*missionLength/transmitPeriod;
  console.log(`costPerMessage = ${costPerMessage}`);
  console.log(`transmitPeriod = ${transmitPeriod}`);
  costIndicator.innerHTML = '$ ' + cost.toFixed(2)
}



const missionIdEntry = document.getElementById('missionIDlaunch');
missionIdEntry.addEventListener('change', getMissionBytes.bind(null, event), false);

const periodSelect = document.getElementById('periodSelect');
periodSelect.addEventListener('change', updateTransmitPeriod.bind(null, event), false);
