const settings = require('electron-settings');
const request = require('request');

const dataTypes = require('./dataTypes');

const missionControlUrl = 'http://localhost:3300';

var missionTotal = 0;
var transmitPeriod = 60;
var codeVerified = false;

function sum(total, num) {
    return total + num;
}

function updateMission(event) {
  codeVerified = false;
  launchCodeResponse.innerHTML = '';
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
    document.getElementById('missionIdError').innerHTML = 'Mission details not saved locally';
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

function verifyLaunchCode() {
  let id = missionIdEntry.value;
  request.post(missionControlUrl + '/verifyLaunchCode/' + id,
    {form: {launchCode: launchCodeEntry.value}},
    function (err, res, body) {
      if (!err) {
        console.log('Response: ' + res.statusCode);
        console.log(body);
        if (body == 'VERIFIED') {
          codeVerified = true;
          launchCodeResponse.style.color = "green";
          launchCodeResponse.innerHTML = '<i class="material-icons" role="presentation">verified_user</i>'
        } else {
          codeVerified = false;
          launchCodeResponse.style.color = "red";
          launchCodeResponse.innerHTML = '<i class="material-icons" role="presentation">cancel</i>'
        }
      } else {
        codeVerified = false;
        console.log('Error: ' + err);
        launchCodeResponse.style.color = "red";
        launchCodeResponse.innerHTML = '<i class="material-icons" role="presentation">error</i>'
      }
    }
  );
}



const missionIdEntry = document.getElementById('missionIDlaunch');
missionIdEntry.addEventListener('change', updateMission.bind(null, event), false);

const periodSelect = document.getElementById('periodSelect');
periodSelect.addEventListener('change', updateTransmitPeriod.bind(null, event), false);

const launchCodeEntry = document.getElementById('launchCode');
launchCodeEntry.addEventListener('change', verifyLaunchCode.bind(null, event), false);

const launchCodeResponse = document.getElementById('launchCodeResponse');
