const settings = require('electron-settings');

const dataTypes = require('./dataTypes');

//populates monitor page with pod info
function setMissionIdMonitor(event) {
  document.getElementById("setupConfigReminder").innerHTML = "";  //hides setup reminder block
  var numberOfPods = 2;
  for (let i = 0; i < numberOfPods; i++) {
    setupPodMonitor(i + 1);
  }
}

function setupPodMonitor(selectedPod) {
  document.getElementById("pod" + selectedPod.toString() + "Description_monitor").innerHTML = document.getElementById("pod" + selectedPod.toString() + "Description").value + " Pod";
  document.getElementById("pod" + selectedPod.toString() + "_FC_ID_monitor").innerHTML = "NI: " + document.getElementById("pod" + selectedPod.toString() + "_FC_ID").value;
  fillPodTable_monitor(selectedPod);
}

//creates tables
function fillPodTable_monitor(selectedPod) {
  var tableConfig = document.getElementById('pod'+selectedPod.toString()+'Table');
  var tableMonitor = document.getElementById('pod'+selectedPod.toString()+'Table_monitor');
  var numRows = tableConfig.rows.length - 2;
  var new_row, idCell, labelCell, typeCell, bytesCell, valueCell;

  //if theres anything in the table already, delete it
  while (tableMonitor.rows.length > 1) {
    tableMonitor.deleteRow(1);
  }

  for (let i = 1; i < numRows + 1; i++ ) {
    new_row = tableMonitor.insertRow(i);
    idCell = new_row.insertCell(0);
    labelCell = new_row.insertCell(1);
    typeCell = new_row.insertCell(2);
    bytesCell = new_row.insertCell(3);
    valueCell = new_row.insertCell(4);
    idCell.innerHTML = i;
    idCell.id = 'pod'+selectedPod.toString()+'item'+i.toString()+'ID' + '_monitor';

    labelCell.classList.add("mdl-data-table__cell--non-numeric");
    labelCell.innerHTML = document.getElementById('pod'+selectedPod.toString()+'item'+i.toString()+'Label').value;
    labelCell.id = 'pod'+selectedPod.toString()+'item'+i.toString()+'label' + '_monitor';

    var type = document.getElementById('pod'+selectedPod.toString()+'item'+i.toString()+'Type').value;
    typeCell.classList.add("mdl-data-table__cell--non-numeric");
    typeCell.innerHTML = dataTypes[type][0];
    typeCell.id = 'pod'+selectedPod.toString()+'item'+i.toString()+'type' + '_monitor';

    var bytes = "";
    for (let i = 0; i < dataTypes[type][2]; i++) {
      bytes += "--" + '\xa0\xa0\xa0\xa0';
    }
    bytesCell.classList.add("mdl-data-table__cell--non-numeric");
    bytesCell.innerHTML = bytes;
    bytesCell.id = 'pod'+selectedPod.toString()+'item'+i.toString()+'bytes' + '_monitor';

    valueCell.innerHTML = "N/A";
    valueCell.id = 'pod'+selectedPod.toString()+'item'+i.toString()+'value' + '_monitor';
  }
}

/*
function emptyPodTable_monitor(selectedPod) {
  var table = document.getElementById('pod'+selectedPod.toString()+'Table_monitor');
  for (let i = 1; i < table.rows.length; i++) {
    document.getElementById('pod'+selectedPod.toString()+'item'+i.toString()+'bytes' + '_monitor').innerHTML = "";    //clear bytes field
    document.getElementById('pod'+selectedPod.toString()+'item'+i.toString()+'value' + '_monitor').innerHTML = "NA";    //clear value field
  }
}
*/

//request data from CM
function refreshPodData(event, selectedPod) {
  fillPodTable_monitor(selectedPod);
  cmdQueue.push("PODDATA " + selectedPod.toString());
}

//listener for mission id entry
const missionIDEntryMonitor = document.getElementById('missionID');
missionIDEntryMonitor.addEventListener('change', setMissionIdMonitor.bind(null, event), false);

//listeners for refresh buttons
const refreshPod1DataBtn = document.getElementById('refreshPod1');
refreshPod1DataBtn.addEventListener('click', refreshPodData.bind(null, event, 1), false);

const refreshPod2DataBtn = document.getElementById('refreshPod2');
refreshPod2DataBtn.addEventListener('click', refreshPodData.bind(null, event, 2), false);

//listener for monitor tabs
const monitorPod1 = document.getElementById('pod1monitor-toggle');
monitorPod1.addEventListener('click', fillPodTable_monitor.bind(null, 1));

const monitorPod2 = document.getElementById('pod2monitor-toggle');
monitorPod2.addEventListener('click', fillPodTable_monitor.bind(null, 2));