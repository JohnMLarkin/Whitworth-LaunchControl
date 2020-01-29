var numBytesPods = [27, 0, 0, 0, 0, 0, 0];
var podTable = [[],[],[],[],[],[]];
var emptyPodTable = [[],[],[],[],[],[]];
const numPods = podTable.length;
var fc_id = [];

function sendFlightComputerConfig() {
  var fcPresent = false;
  for (let i = 1; i <= numPods; i++) {
    if (fc_id.length>0) fcPresent = true; 
  }
  if (fcPresent) {
    cmdQueue.push("PODLINK ON");
    for (let i = 1; i <= numPods; i++) {
      if (fc_id.length>0) {
        cmdQueue.push(`POD ${i} = ${fc_id[i]} ${numBytesPods[i]}`);
      }
    }
    cmdQueue.push("END");
  }
}