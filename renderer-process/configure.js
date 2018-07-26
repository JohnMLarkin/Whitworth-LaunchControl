/* const BrowserWindow = require('electron').remote.BrowserWindow */
/* const path = require('path') */
const settings = require('electron-settings')


var numBytesPods = [28, 0, 0, 0, 0, 0, 0];
var podTable = [[],[],[],[],[],[]];
const numPods = podTable.length;
var dataTypes = [['uint8','char',1,'0 .. 255'],
  ['int8','signed char',1,'-128 .. 127'],
  ['uint16','unsigned short',2,'0 .. 65,535'],
  ['int16','short',2,'-32,768 .. 32,767'],
  ['uint32','unsigned int',4,'0 .. 4,294,967,295'],
  ['int32','int',4,'-2,147,483,648 .. 2,147,483,647'],
  ['float','float',4,'-3.4E38 .. 3.4E38'],
  ['double','double',8,'-1.7E308 .. 1.7E308']
];

function populateDataTypeTable() {
  var table = document.getElementById('dataTypeTable');
  for (i=0; i<dataTypes.length; i++) {
    var new_row = table.insertRow(i+1);
    var typeCell = new_row.insertCell(0);
    typeCell.className = "mdl-data-table__cell--non-numeric";
    var mbedCell = new_row.insertCell(1);
    mbedCell.className = "mdl-data-table__cell--non-numeric";
    var byteCell = new_row.insertCell(2);
    var rangeCell = new_row.insertCell(3);
    rangeCell.className = "mdl-data-table__cell--non-numeric";
    typeCell.innerHTML = dataTypes[i][0];
    mbedCell.innerHTML = dataTypes[i][1];
    byteCell.innerHTML = dataTypes[i][2];
    rangeCell.innerHTML = dataTypes[i][3];
  }
}
populateDataTypeTable();

function setMissionId(event) {
  var idField = document.getElementById("missionID");
  var descriptionField = document.getElementById("missionDescription");
  var id = idField.value;
  var x = document.getElementsByClassName('subsection');
  for (i=0; i<x.length; i++) {
    x[i].classList.add('is-shown');
  }
  if (settings.has('missions.'+id.toString())) { // Load saved mission if exists
    descriptionField.value = settings.get('missions.'+id.toString()+'.description');

    for (i=1; i<=numPods; i++) {
      descriptionField = document.getElementById("pod"+i.toString()+"Description");
      descriptionField.value = settings.get('missions.'+id.toString()+'.pod'+i.toString()+'description');
    }

    // Need to trigger floating label to "float" when value set by code
    var mdlInputs = document.querySelectorAll('.mdl-js-textfield');
    for (var j = 0, l = mdlInputs.length; j < l; j++) {
      mdlInputs[j].MaterialTextfield.checkDirty();
    }
    loadPodTable(id);
  } else { // Save mission if it doesn't exist yet
    settings.set('missions.'+id.toString()+'.description', descriptionField.value)
    settings.set('missions.'+id.toString()+'.podTable', podTable)
    for (i=1; i<=numPods; i++) {
      descriptionField = document.getElementById("pod"+i.toString()+"Description");
      settings.set('missions.'+id.toString()+'.pod'+i.toString()+'description', descriptionField.value);
    }
  }
  updatePodTables();
}

function loadPodTable(id) {
  pT = settings.get('missions.'+id.toString()+'.podTable');
  for (id=1; id<=numPods; id++) {
    var table = document.getElementById('pod'+id.toString()+'Table');
    var numRows = table.rows.length;
    for (i=1; i<(numRows-1); i++) {
      table.deleteRow(1);
    }
    for (i=1; i<=(pT[id-1].length); i++) {
      var new_row = table.insertRow(i);
      var idCell = new_row.insertCell(0);
      var labelCell = new_row.insertCell(1);
      var typeCell = new_row.insertCell(2);
      var bytesCell = new_row.insertCell(3);
      var deleteCell = new_row.insertCell(4);
      idCell.innerHTML = i;
      // Add the label text field
      var labelField = document.createElement("input");
      labelField.type = "text";
      labelField.size = 25;
      labelField.id = 'pod'+id.toString()+'item'+i.toString()+'Label';
      labelField.value = pT[id-1][i-1][1];
      labelCell.appendChild(labelField);
      labelField.addEventListener('change', changeLabel.bind(null, event, id, i), false);
      // Add the data type select menu
      var selectList = document.createElement("select");
      selectList.id = 'pod'+id.toString()+'item'+i.toString()+'Type';
      typeCell.appendChild(selectList);
      for (j=0; j<dataTypes.length; j++) {
        var option = document.createElement("option");
        option.value = j;
        option.text = dataTypes[j][0];
        selectList.appendChild(option);
      }
      selectList.value = pT[id-1][i-1][2];
      selectList.addEventListener('change', changeDataType.bind(null,event, id, i), false);

      bytesCell.id = 'pod'+id.toString()+'item'+i.toString()+'Size';

      var deleteButton = document.createElement("button");
      deleteButton.id =  'pod'+id.toString()+'item'+i.toString()+'Delete';
      deleteButton.className = 'mdl-button mdl-js-button mdl-button--icon';
      var deleteIcon = document.createElement("i");
      deleteIcon.className = "material-icons";
      var icon = document.createTextNode("clear");
      deleteIcon.appendChild(icon);
      deleteButton.appendChild(deleteIcon);
      deleteCell.appendChild(deleteButton);
      deleteButton.addEventListener('click', deleteItem.bind(null, event, id, i), false);
    }
  }
  podTable = pT;
}

function sum(total, num) {
    return total + num;
}

function updateByteTable() {
  document.getElementById('cmdSize').innerHTML = numBytesPods[0];
  for (i=1; i<numBytesPods.length; i++) {
    document.getElementById('pod'+i.toString()+'Size').innerHTML = numBytesPods[i];
  }
  var missionTotal = numBytesPods.reduce(sum);
  document.getElementById('missionSize').innerHTML = missionTotal;
  if (missionTotal>34) {
    document.getElementById('missionSize').style.color = 'red';
  } else
    document.getElementById('missionSize').style.color = 'initial';
}

function updatePodTables() {
  for (i=1; i<=numPods; i++) {
    var table = document.getElementById('pod'+i.toString()+'Table');
    var numRows = table.rows.length;
    var total = 0;
    for (j=1; j< (numRows-1); j++) {
      var itemCode = document.getElementById('pod'+i.toString()+'item'+j.toString()+'Type');
      document.getElementById('pod'+i.toString()+'item'+j.toString()+'Size').innerHTML = dataTypes[itemCode.value][2];
      total = total + dataTypes[itemCode.value][2];
    }
    if (total>0) {
      numBytesPods[i] = total + 1;
    } else numBytesPods[i] = 0;
    document.getElementById('pod'+i.toString()+'Total').innerHTML = total;
  }
  updateByteTable();
  var idField = document.getElementById("missionID");
  var id = idField.value;
  settings.set('missions.'+id.toString()+'.podTable', podTable);
}

function changeMissionDescription(event) {
  var idField = document.getElementById("missionID");
  var id = idField.value;
  var descriptionField = document.getElementById("missionDescription");
  settings.set('missions.'+id.toString()+'.description', descriptionField.value);
}

function changePodDescription(event, pod) {
  var idField = document.getElementById("missionID");
  var id = idField.value;
  var descriptionField = document.getElementById("pod"+pod.toString()+"Description");
  settings.set('missions.'+id.toString()+'.pod'+pod.toString()+'description', descriptionField.value);
}

function changeDataType(event, pod, item) {
  var itemCode = document.getElementById('pod'+pod.toString()+'item'+item.toString()+'Type');
  podTable[pod-1][item-1][2] = itemCode.value;
  updatePodTables();
}

function changeLabel(event, pod, item) {
  var itemLabel = document.getElementById('pod'+pod.toString()+'item'+item.toString()+'Label');
  podTable[pod-1][item-1][1] = itemLabel.value;
}

function deleteAllItems(event, selectedPod) {
  numBytesPods[selectedPod] = 0;
  podTable[selectedPod-1] = [];
  var table = document.getElementById('pod'+selectedPod.toString()+'Table');
  var numRows = table.rows.length;
  for (i=1; i<(numRows-1); i++) {
    table.deleteRow(1);
  }
  updatePodTables();
}

function deleteItem(event, selectedPod, i) {
  // Delete the selected row from podTable
  podTable[selectedPod-1].splice(i-1,1);
  // Update the HTML table
  var table = document.getElementById('pod'+selectedPod.toString()+'Table');
  table.deleteRow(i);
  for (j=i; j<(table.rows.length-1); j++) {
    table.rows[j].cells[0].innerHTML = j;
    var labelField = document.getElementById('pod'+selectedPod.toString()+'item'+(j+1).toString()+'Label');
    labelField.removeEventListener('click', changeLabel);
    labelField.id = 'pod'+selectedPod.toString()+'item'+j.toString()+'Label';
    labelField.addEventListener('change', changeLabel.bind(null, event, selectedPod, j), false);
    var selectList = document.getElementById('pod'+selectedPod.toString()+'item'+(j+1).toString()+'Type');
    selectList.id = 'pod'+selectedPod.toString()+'item'+j.toString()+'Type';
    var bytesCell = document.getElementById('pod'+selectedPod.toString()+'item'+(j+1).toString()+'Size');
    bytesCell.id = 'pod'+selectedPod.toString()+'item'+j.toString()+'Size';
    var deleteButton = document.getElementById('pod'+selectedPod.toString()+'item'+(j+1).toString()+'Delete');
    deleteButton.removeEventListener('click', deleteItem);
    deleteButton.id = 'pod'+selectedPod.toString()+'item'+j.toString()+'Delete';
    deleteButton.addEventListener('click', deleteItem.bind(null, event, selectedPod, j), false);
  }
  updatePodTables();
}

function insertItem(event, selectedPod)
{
  var table = document.getElementById('pod'+selectedPod.toString()+'Table');
  var numRows = table.rows.length;
  var new_row = table.insertRow(numRows-1);
  var idCell = new_row.insertCell(0);
  var labelCell = new_row.insertCell(1);
  var typeCell = new_row.insertCell(2);
  var bytesCell = new_row.insertCell(3);
  var deleteCell = new_row.insertCell(4)
  idCell.innerHTML = numRows-1;
  // Add the label text field
  var labelField = document.createElement("input");
  labelField.type = "text";
  labelField.size = 25;
  labelField.id = 'pod'+selectedPod.toString()+'item'+(numRows-1).toString()+'Label';
  labelCell.appendChild(labelField);
  labelField.addEventListener('change', changeLabel.bind(null, event, selectedPod, numRows-1), false);

  // Add the data type select menu
  var selectList = document.createElement("select");
  selectList.id = 'pod'+selectedPod.toString()+'item'+(numRows-1).toString()+'Type';
  typeCell.appendChild(selectList);
  for (i=0; i<dataTypes.length; i++) {
    var option = document.createElement("option");
    option.value = i;
    option.text = dataTypes[i][0];
    selectList.appendChild(option);
  }
  selectList.addEventListener('change', changeDataType.bind(null,event, selectedPod, numRows-1), false);

  bytesCell.id = 'pod'+selectedPod.toString()+'item'+(numRows-1).toString()+'Size';

  var deleteButton = document.createElement("button");
  deleteButton.id =  'pod'+selectedPod.toString()+'item'+(numRows-1).toString()+'Delete';
  deleteButton.className = 'mdl-button mdl-js-button mdl-button--icon';
  var deleteIcon = document.createElement("i");
  deleteIcon.className = "material-icons";
  var icon = document.createTextNode("clear");
  deleteIcon.appendChild(icon);
  deleteButton.appendChild(deleteIcon);
  deleteCell.appendChild(deleteButton);
  deleteButton.addEventListener('click', deleteItem.bind(null, event, selectedPod, numRows-1), false);

  podTable[selectedPod-1].push([(numRows-1),null,0]);
  updatePodTables();
}

const missionIDEntry = document.getElementById('missionID');
missionIDEntry.addEventListener('change', setMissionId.bind(null, event), false);

const missionDescriptionEntry = document.getElementById('missionDescription');
missionDescriptionEntry.addEventListener('change', changeMissionDescription.bind(null, event), false);

const pod1DescriptionEntry = document.getElementById('pod1Description');
pod1DescriptionEntry.addEventListener('change', changePodDescription.bind(null, event, 1), false);
const pod2DescriptionEntry = document.getElementById('pod2Description');
pod2DescriptionEntry.addEventListener('change', changePodDescription.bind(null, event, 2), false);
const pod3DescriptionEntry = document.getElementById('pod3Description');
pod3DescriptionEntry.addEventListener('change', changePodDescription.bind(null, event, 3), false);
const pod4DescriptionEntry = document.getElementById('pod4Description');
pod4DescriptionEntry.addEventListener('change', changePodDescription.bind(null, event, 4), false);
const pod5DescriptionEntry = document.getElementById('pod5Description');
pod5DescriptionEntry.addEventListener('change', changePodDescription.bind(null, event, 5), false);
const pod6DescriptionEntry = document.getElementById('pod6Description');
pod6DescriptionEntry.addEventListener('change', changePodDescription.bind(null, event, 6), false);

const addPod1ItemBtn = document.getElementById('addPod1Item');
addPod1ItemBtn.addEventListener('click', insertItem.bind(null,event, 1), false);
const addPod2ItemBtn = document.getElementById('addPod2Item');
addPod2ItemBtn.addEventListener('click', insertItem.bind(null,event, 2), false);
const addPod3ItemBtn = document.getElementById('addPod3Item');
addPod3ItemBtn.addEventListener('click', insertItem.bind(null,event, 3), false);
const addPod4ItemBtn = document.getElementById('addPod4Item');
addPod4ItemBtn.addEventListener('click', insertItem.bind(null,event, 4), false);
const addPod5ItemBtn = document.getElementById('addPod5Item');
addPod5ItemBtn.addEventListener('click', insertItem.bind(null,event, 5), false);
const addPod6ItemBtn = document.getElementById('addPod6Item');
addPod6ItemBtn.addEventListener('click', insertItem.bind(null,event, 6), false);

const clearPod1ItemsBtn = document.getElementById('clearPod1Items');
clearPod1ItemsBtn.addEventListener('click', deleteAllItems.bind(null,event, 1), false);
const clearPod2ItemsBtn = document.getElementById('clearPod2Items');
clearPod2ItemsBtn.addEventListener('click', deleteAllItems.bind(null,event, 2), false);
const clearPod3ItemsBtn = document.getElementById('clearPod3Items');
clearPod3ItemsBtn.addEventListener('click', deleteAllItems.bind(null,event, 3), false);
const clearPod4ItemsBtn = document.getElementById('clearPod4Items');
clearPod4ItemsBtn.addEventListener('click', deleteAllItems.bind(null,event, 4), false);
const clearPod5ItemsBtn = document.getElementById('clearPod5Items');
clearPod5ItemsBtn.addEventListener('click', deleteAllItems.bind(null,event, 5), false);
const clearPod6ItemsBtn = document.getElementById('clearPod6Items');
clearPod6ItemsBtn.addEventListener('click', deleteAllItems.bind(null,event, 6), false);
