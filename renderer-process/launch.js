const settings = require('electron-settings');
const request = require('request');
const _util = require('underscore');
const async = require('async');

const dataTypes = require('./dataTypes');

const missionControlUrl = 'https://missioncontrol.westus2.cloudapp.azure.com';
//const missionControlUrl = 'http://localhost:3300';


// Initial values and states
var missionTotal = 0;
var transmitPeriod = 60;
var codeVerified = false;
var manifestVerified = false;
var verifyModeTicker;

document.getElementById('manifestCheckSection').classList.remove('is-shown');
document.getElementById('statusCheckSection').classList.remove('is-shown');
document.getElementById('modeCheckSection').classList.remove('is-shown');

dataTypeDict = {};
for (let i = 0; i < dataTypes.length; i++) {
  dataTypeDict[dataTypes[i][0]] = i;
}

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
    pushManifestButton.disabled = true;
    pullManifestButton.disabled = true;
    verifyActiveStatus();
  } else {
    manifestVerifyStatus.style.color = "red";
    manifestVerifyStatus.innerHTML = '<i class="material-icons" role="presentation" style="vertical-align: middle">cancel</i>';
    document.getElementById('manifestCheckWrapper').classList.add('is-open');
    document.getElementById('statusCheckSection').classList.remove('is-shown');
    pushManifestButton.disabled = false;
    pullManifestButton.disabled = false;
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
          flightMode = -1;
          document.getElementById('modeSpinner').classList.add('is-active');
          flightModeChangeProcessing = true;
          cmdQueue.push("FLIGHT_MODE?");
          setTimeout(function() {verifyFlightMode()},500);
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
      document.getElementById('statusSpinner').classList.remove('is-active');
    }
  );
}

function verifyFlightMode() {
  if (!flightModeChangeProcessing) {
    clearInterval(verifyModeTicker);
    switch (flightMode) {
      case 0:
        flightModeOn.style.color = "red";
        flightModeOn.innerHTML = '<i class="material-icons" role="presentation" style="vertical-align: middle">cancel</i>';
        modeSwitchSetting.classList.remove('is-checked');
        document.getElementById('modeCheckWrapper').classList.add('is-open');
        break;
      case 1:
        flightModeOn.style.color = "green";
        flightModeOn.innerHTML = '<i class="material-icons" role="presentation" style="vertical-align: middle">check_circle</i>';
        modeSwitchSetting.classList.add('is-checked');
        document.getElementById('modeCheckWrapper').classList.remove('is-open');
        break;
      case 2:
        flightModeOn.style.color = "green";
        flightModeOn.innerHTML = '<i class="material-icons" role="presentation" style="vertical-align: middle">lock</i>';
        modeSwitchSetting.classList.add('is-checked');
        document.getElementById('modeCheckWrapper').classList.remove('is-open');
        modeSwitch.disable = true;
        break;
      case 3:
        flightModeOn.style.color = "green";
        flightModeOn.innerHTML = '<i class="material-icons" role="presentation" style="vertical-align: middle">lock</i>';
        modeSwitchSetting.classList.add('is-checked');
        document.getElementById('modeCheckWrapper').classList.remove('is-open');
        modeSwitch.disable = true;
        break;
      default:
        flightModeOn.style.color = "red";
        flightModeOn.innerHTML = '<i class="material-icons" role="presentation" style="vertical-align: middle">device_unknown</i>';
        document.getElementById('modeCheckWrapper').classList.add('is-open');
    }
    document.getElementById('modeSpinner').classList.remove('is-active');
  }
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

async function importManifest() {
  let manifest = await getManifest();
  let id = missionIdEntry.value;
  let podTable = [];
  let numPods = manifest.length;
  for (let i = 0; i < numPods; i++) {
    settings.set('missions.' + id + '.pod' + (i+1).toString() + 'description', manifest[i].podDescription);
    settings.set('missions.' + id + '.pod' + (i+1).toString() + '_fc_id', manifest[i].fc_id);
    podTable[i] = [];
    for (let j = 0; j < manifest[i].dataTypes.length; j++) {
      podTable[i][j] = [];
      podTable[i][j][0] = j + 1;
      podTable[i][j][1] = manifest[i].dataDescriptions[j];
      console.log(manifest[i].dataTypes[j]);
      podTable[i][j][2] = String(dataTypeDict[manifest[i].dataTypes[j]]);
    }
  }
  console.log('Generated podTable from remote:');
  console.log(podTable);
  settings.set('missions.' + id + '.podTable', podTable);
  verifyManifest();
}

async function makeManifest() {
  return new Promise( (resolve, reject) => {
    let id = missionIdEntry.value.toString();
    let podTable, numPods;
    let manifest = [];
    if (settings.has('missions.' + id)) {  // Load saved mission if it exists
      podTable = settings.get('missions.'+ id +'.podTable');
      console.log('Local podTable:');
      console.log(podTable);
      numPods = podTable.length;
      for (let i = 0; i < numPods; i++) {
        manifest[i] = {};
        manifest[i].podDescription = settings.get('missions.' + id + '.pod' + (i+1).toString() + 'description');
        manifest[i].fc_id = settings.get('missions.' + id + '.pod' + (i+1).toString() + '_fc_id');
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
  let id = missionIdEntry.value;
  request.put(missionControlUrl + '/setManifest/' + id,
    {form: {launchCode: launchCodeEntry.value, manifest: JSON.stringify(manifest)}},
    function (err, res, body) {
      if (!err) {
        verifyManifest();
      } else {
        console.log('Error: ' + err);
      }
    }
  );
}

async function setStatusActive() {
  let id = missionIdEntry.value;
  await request.put(missionControlUrl + '/setStatusActive/' + id,
    {form: {launchCode: launchCodeEntry.value}},
    function (err, res, body) {
      if (!err) {
        console.log(body);
      } else {
        console.log('Error: ' + err);
      }
    }
  );
  document.getElementById('statusSpinner').classList.add('is-active');
  setTimeout(function() {verifyActiveStatus()},2000);
}

async function setStatusPlanned() {
  let id = missionIdEntry.value;
  await request.put(missionControlUrl + '/setStatusPlanned/' + id,
    {form: {launchCode: launchCodeEntry.value}},
    function (err, res, body) {
      if (!err) {
        console.log(body);
      } else {
        console.log('Error: ' + err);
      }
    }
  );
  document.getElementById('statusSpinner').classList.add('is-active');
  setTimeout(function() {verifyActiveStatus()},2000);
}

function changeMissionStatus(event) {
  if (event.target.checked) {
    setStatusActive();
  } else {
    setStatusPlanned();
  }
}

function handleFlightModeSwitch(event) {
  flightModeChangeProcessing = true;
  var fcID = [];
  if (event.target.checked) {
    let id = missionIdEntry.value;
    for (let i = 1; i <= numPods; i++) {
      descriptionField = document.getElementById("pod"+i.toString()+"_FC_ID");
      fcID[i-1] = descriptionField.value; 
    }
    cmdQueue.push(`MISSIONID=${id}`);
    cmdQueue.push(`TRANSPERIOD=${transmitPeriod}`);
    for (let i = 1; i <= numPods; i++) {
      if (fcID[i-1].length>0) {
        cmdQueue.push(`POD ${i} = ${fcID[i-1]} ${numBytesPods[i]}`);
      }
    }
    cmdQueue.push("FLIGHT_MODE ON");
  } else {
    cmdQueue.push("FLIGHT_MODE OFF");
  }
  flightMode = -1;
  document.getElementById('modeSpinner').classList.add('is-active');
  verifyModeTicker = setInterval(function() {verifyFlightMode()},500);
}

const missionIdEntry = document.getElementById('missionIDLaunch');
missionIdEntry.addEventListener('change', updateMission.bind(null, event), false);

const periodSelect = document.getElementById('periodSelect');
periodSelect.addEventListener('change', updateTransmitPeriod.bind(null, event), false);

const launchCodeEntry = document.getElementById('launchCode');
launchCodeEntry.addEventListener('change', verifyLaunchCode.bind(null, event), false);

const launchCodeResponse = document.getElementById('launchCodeResponse');

const pushManifestButton = document.getElementById('pushManifestButton');
pushManifestButton.addEventListener('click', setManifest.bind(null, event), false);
const pullManifestButton = document.getElementById('pullManifestButton');
pullManifestButton.addEventListener('click', importManifest.bind(null, event), false);
const manifestVerifyStatus = document.getElementById('manifestVerifyStatus');
const localManifestJSON = document.getElementById('localManifestJSON');
const remoteManifestJSON = document.getElementById('remoteManifestJSON');

const statusSwitchSetting = document.getElementById('statusSwitchSetting');
const statusSwitch = document.getElementById('statusSwitch');
statusSwitch.addEventListener('click', changeMissionStatus, false);

const modeSwitchSetting = document.getElementById('modeSwitchSetting');
const modeSwitch = document.getElementById('modeSwitch');
modeSwitch.addEventListener('click', handleFlightModeSwitch, false);
