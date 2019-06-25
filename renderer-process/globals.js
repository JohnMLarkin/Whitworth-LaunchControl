var numBytesPods = [27, 0, 0, 0, 0, 0, 0];
var podTable = [[],[],[],[],[],[]];
var emptyPodTable = [[],[],[],[],[],[]];
const numPods = podTable.length;

function sendFlightComputerConfig() {
  var fcPresent = false;
  var fcID = [];
  for (let i = 1; i <= numPods; i++) {
    descriptionField = document.getElementById("pod"+i.toString()+"_FC_ID");
    fcID[i-1] = descriptionField.value;
    if (fcID[i-1].length>0) fcPresent = true; 
  }
  if (fcPresent) {
    cmdQueue.push("PODLINK ON");
    for (let i = 1; i <= numPods; i++) {
      if (fcID[i-1].length>0) {
        cmdQueue.push(`POD ${i} = ${fcID[i-1]} ${numBytesPods[i]}`);
      }
    }
    cmdQueue.push("END");
  }
}