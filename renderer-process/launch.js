const settings = require('electron-settings');
const request = require('request');
const _util = require('underscore');
const async = require('async');

const dataTypes = require('./dataTypes');

const missionControlUrl = 'http://localhost:3300';

var missionTotal = 0;
var transmitPeriod = 60;
var codeVerified = false;
var manifestVerified = false;

function sum(total, num) {
    return total + num;
}

function updateMission(event) {
  codeVerified = false;
  launchCodeResponse.innerHTML = '';
  launchCodeEntry.value = '';
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
  document.getElementById('manifestCheckSection').classList.remove('is-shown');
  document.getElementById('statusCheckSection').classList.remove('is-shown');
  document.getElementById('modeCheckSection').classList.remove('is-shown');
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
  costIndicator.innerHTML = '$ ' + cost.toFixed(2)
}

function verifyLaunchCode() {
  launchCodeResponse.style.color = "blue";
  launchCodeResponse.innerHTML = 'Verifying...';
  let id = missionIdEntry.value;
  request.post(missionControlUrl + '/verifyLaunchCode/' + id,
    {form: {launchCode: launchCodeEntry.value}},
    function (err, res, body) {
      if (!err) {
        if (body == 'VERIFIED') {
          codeVerified = true;
          launchCodeResponse.style.color = "green";
          launchCodeResponse.innerHTML = '<i class="material-icons" role="presentation">verified_user</i>';
          document.getElementById('manifestCheckSection').classList.add('is-shown');
          verifyManifest();
        } else {
          codeVerified = false;
          launchCodeResponse.style.color = "red";
          launchCodeResponse.innerHTML = '<i class="material-icons" role="presentation">cancel</i>';
          document.getElementById('manifestCheckSection').classList.remove('is-shown');
          document.getElementById('statusCheckSection').classList.remove('is-shown');
          document.getElementById('modeCheckSection').classList.remove('is-shown');
        }
      } else {
        codeVerified = false;
        console.log('Error: ' + err);
        launchCodeResponse.style.color = "red";
        launchCodeResponse.innerHTML = '<i class="material-icons" role="presentation">error</i>';
        document.getElementById('manifestCheckSection').classList.remove('is-shown');
        document.getElementById('statusCheckSection').classList.remove('is-shown');
        document.getElementById('modeCheckSection').classList.remove('is-shown');
      }
    }
  );
}

async function verifyManifest() {
  let localManifest = await makeManifest();
  let remoteManifest = await getManifest();
  localManifestJSON.innerHTML = JSON.stringify(localManifest);
  remoteManifestJSON.innerHTML = JSON.stringify(remoteManifest);
  manifestVerified = _util.isEqual(localManifest, remoteManifest);
  if (manifestVerified) {
    manifestVerifyStatus.style.color = "green";
    manifestVerifyStatus.innerHTML = '<i class="material-icons" role="presentation" style="vertical-align: middle">check_circle</i>';
    document.getElementById('manifestCheckWrapper').classList.remove('is-open');
    document.getElementById('statusCheckSection').classList.add('is-shown');
    document.getElementById('pushManifestButton').disabled = true;
    verifyActiveStatus();
  } else {
    manifestVerifyStatus.style.color = "red";
    manifestVerifyStatus.innerHTML = '<i class="material-icons" role="presentation" style="vertical-align: middle">cancel</i>';
    document.getElementById('manifestCheckWrapper').classList.add('is-open');
    document.getElementById('statusCheckSection').classList.remove('is-shown');
    pushManifestButton.disabled = false;
    document.getElementById('modeCheckSection').classList.remove('is-shown');
  }
}

function verifyActiveStatus() {
  let id = missionIdEntry.value;
  request.get(missionControlUrl + '/verifyActiveStatus/' + id,
    function (err, res, body) {
      if (!err) {
        if (body == 'active') {
          missionStatusActive.style.color = "green";
          missionStatusActive.innerHTML = '<i class="material-icons" role="presentation" style="vertical-align: middle">check_circle</i>';
          document.getElementById('statusCheckWrapper').classList.remove('is-open');
          statusSwitchSetting.classList.add('is-checked');
          document.getElementById('modeCheckSection').classList.add('is-shown');
          document.getElementById('modeCheckWrapper').classList.add('is-open');
          flightModeOn.style.color = "red";
          flightModeOn.innerHTML = '<i class="material-icons" role="presentation" style="vertical-align: middle">cancel</i>';
        } else {
          missionStatusActive.style.color = "red";
          missionStatusActive.innerHTML = '<i class="material-icons" role="presentation" style="vertical-align: middle">cancel</i>';
          document.getElementById('statusCheckWrapper').classList.add('is-open');
          statusSwitchSetting.classList.remove('is-checked');
          document.getElementById('modeCheckSection').classList.remove('is-shown');
        }
      } else {
        missionStatusActive.style.color = "red";
        missionStatusActive.innerHTML = '<i class="material-icons" role="presentation" style="vertical-align: middle">cancel</i>';
        document.getElementById('statusCheckWrapper').classList.add('is-open');
        statusSwitchSetting.classList.remove('is-checked');
        document.getElementById('modeCheckSection').classList.remove('is-shown');
        console.log(err);
      }
    }
  );
}

async function getManifest() {
  return new Promise( (resolve, reject) => {
    let id = missionIdEntry.value;
    request.get(missionControlUrl + '/getManifest/' + id,
      function (err, res, body) {
        if (!err) {
          if (res.statusCode == 200) {
            resolve(JSON.parse(body));
          }
        } else {
          console.log('Error: ' + err);
          reject(err);
        }
      }
    );
  });
}

async function makeManifest() {
  return new Promise( (resolve, reject) => {
    let id = missionIdEntry.value.toString();
    let podTable, numPods;
    let manifest = [];
    if (settings.has('missions.' + id)) {  // Load saved mission if it exists
      podTable = settings.get('missions.'+ id +'.podTable');
      numPods = podTable.length;
      for (let i = 0; i < numPods; i++) {
        manifest[i] = {};
        manifest[i].podDescription = settings.get('missions.' + id + '.pod' + (i+1).toString() + 'description');
        manifest[i].dataDescriptions = [];
        manifest[i].dataTypes = [];
        for (let j = 0; j < podTable[i].length; j++) {
          manifest[i].dataDescriptions[j] = podTable[i][j][1];
          manifest[i].dataTypes[j] = dataTypes[podTable[i][j][2]][0];
        }
      }
    }
    resolve(manifest);
  });
}

async function setManifest() {
  let manifest = await makeManifest();
  console.log('Local to push');
  console.log(manifest);
  console.log('stringified');
  console.log(JSON.stringify(manifest));
  let id = missionIdEntry.value;
  request.put(missionControlUrl + '/setManifest/' + id,
    {form: {launchCode: launchCodeEntry.value, manifest: JSON.stringify(manifest)}},
    function (err, res, body) {
      if (!err) {
        console.log(body);
        verifyManifest();
      } else {
        console.log('Error: ' + err);
      }
    }
  );
}

function changeMissionStatus(event) {
  if (event.target.checked) {
    statusSwitchSetting.classList.add('is-checked');
  } else {
    statusSwitchSetting.classList.remove('is-checked');
  }
}


const missionIdEntry = document.getElementById('missionIDlaunch');
missionIdEntry.addEventListener('change', updateMission.bind(null, event), false);

const periodSelect = document.getElementById('periodSelect');
periodSelect.addEventListener('change', updateTransmitPeriod.bind(null, event), false);

const launchCodeEntry = document.getElementById('launchCode');
launchCodeEntry.addEventListener('change', verifyLaunchCode.bind(null, event), false);

const launchCodeResponse = document.getElementById('launchCodeResponse');

const pushManifestButton = document.getElementById('pushManifestButton');
pushManifestButton.addEventListener('click', setManifest.bind(null, event), false);
const manifestVerifyStatus = document.getElementById('manifestVerifyStatus');
const localManifestJSON = document.getElementById('localManifestJSON');
const remoteManifestJSON = document.getElementById('remoteManifestJSON');

const statusSwitchSetting = document.getElementById('statusSwitchSetting');
const statusSwitch = document.getElementById('statusSwitch');
statusSwitch.addEventListener('click', changeMissionStatus, false);

const modeSwitchSetting = document.getElementById('modeSwitchSetting');
const modeSwitch = document.getElementById('modeSwitch');
//modeSwitch.addEventListener('click', changeFlightMode, false);
