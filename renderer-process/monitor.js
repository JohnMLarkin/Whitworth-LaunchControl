const settings = require('electron-settings');

const dataTypes = require('./dataTypes');

//populates monitor page with pod info
function setMissionIdMonitor(event) {
  document.getElementById("setupConfigReminder").innerHTML = "";
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

    for (i=1; i<=numPods; i++) {
      descriptionField = document.getElementById("pod"+i.toString()+"_FC_ID");
      descriptionField.value = settings.get('missions.'+id.toString()+'.pod'+i.toString()+'_fc_id');
    }

    // Need to trigger floating label to "float" when value set by code
    var mdlInputs = document.querySelectorAll('.mdl-js-textfield');
    for (var j = 0, l = mdlInputs.length; j < l; j++) {
      mdlInputs[j].MaterialTextfield.checkDirty();
    }
    loadPodTable(id);
  } else { // Save mission if it doesn't exist yet
    settings.set('missions.'+id.toString()+'.description', "")
    settings.set('missions.'+id.toString()+'.podTable', emptyPodTable)
    for (i=1; i<=numPods; i++) {
    descriptionField = document.getElementById("pod"+i.toString()+"Description");
    descriptionField.value = "";
    settings.set('missions.'+id.toString()+'.pod'+i.toString()+'description', "");
    }
    for (i=1; i<=numPods; i++) {
    descriptionField = document.getElementById("pod"+i.toString()+"_FC_ID");
    descriptionField.value = ""; 
    settings.set('missions.'+id.toString()+'.pod'+i.toString()+'_fc_id',"");
    }
  }
  updatePodTables();
}

//request data from CM
function refreshPodData(event, selectedPod) {
  cmdQueue.push("PODDATA" + " 1");    //+ toString(selectedPod)
}

//listener for mission id entry
const missionIDEntry = document.getElementById('missionID');
missionIDEntry.addEventListener('change', setMissionIdMonitor.bind(null, event), false);

//listeners for refresh buttons
const refreshPod1DataBtn = document.getElementById('refreshPod1');
refreshPod1DataBtn.addEventListener('click', refreshPodData.bind(null,event, 1), false);