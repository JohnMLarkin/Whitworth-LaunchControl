var numBytesPods = [22, 0, 0, 0, 0, 0, 0];
var podTable = [[],[],[],[],[],[]];

function getSum(total, num) {
    return total + num;
}

function updateByteTable() {
  document.getElementById('cmdSize').innerHTML = numBytesPods[0];
  for (i=1; i<numBytesPods.length; i++) {
    document.getElementById('pod'+i.toString()+'Size').innerHTML = numBytesPods[i];
  }
  document.getElementById('missionSize').innerHTML = numBytesPods.reduce(getSum);
}

function updatePodTables() {
  for (i=1; i<=1; i++) {
    document.getElementById('pod'+i.toString()+'Total').innerHTML = numBytesPods[i];
  }
}

updateByteTable();
updatePodTables();
