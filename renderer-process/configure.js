const BrowserWindow = require('electron').remote.BrowserWindow
const path = require('path')

var numBytesPods = [22, 0, 0, 0, 0, 0, 0];
var podTable = [[],[],[],[],[],[]];
var dataTypes = [['uint8','char',1,'0 .. 255'],
  ['int8','signed char',1,'-128 .. 127'],
  ['uint16','unsigned short',2,'0 .. 65,535'],
  ['int16','short',2,'-32,768 .. 32,767'],
  ['uint32','unsigned int',4,'0 .. 4,294,967,295'],
  ['int32','int',4,'-2,147,483,648 .. 2,147,483,647'],
  ['float','float',4,'-3.4E38 .. 3.4E38'],
  ['double','double',8,'-1.7E308 .. 1.7E308']
];
var podID;

function sum(total, num) {
    return total + num;
}

function updateByteTable() {
  document.getElementById('cmdSize').innerHTML = numBytesPods[0];
  for (i=1; i<numBytesPods.length; i++) {
    document.getElementById('pod'+i.toString()+'Size').innerHTML = numBytesPods[i];
  }
  document.getElementById('missionSize').innerHTML = numBytesPods.reduce(sum);
}

function updatePodTables() {
  for (i=1; i<=1; i++) {
    document.getElementById('pod'+i.toString()+'Total').innerHTML = numBytesPods[i];
  }
}

function openAddPodItemDialog(event, selectedPod) {
  const modalPath = path.join('file://', __dirname, '../sections/addPodItem.html')
  let win = new BrowserWindow({width: 400, height: 320})
  //win.setMenu(null);
  win.on('close', function () { win = null })
  podID = selectedPod;
  win.loadURL(modalPath)
  win.show()
}

function insertItem(event, selectedPod)
{
  var table = document.getElementById('pod'+selectedPod.toString()+'Table');
  var numRows = table.rows.length;
  var new_row = table.insertRow(numRows-1);
  var idCell = new_row.insertCell(0);
  var labelCell = new_row.insertCell(1);
  var typeCell = new_row.insertCell(2);
  var instructCell = new_row.insertCell(3);
  var bytesCell = new_row.insertCell(4);
  idCell.innerHTML = numRows-1;
  // Add the label text field
  var labelField = document.createElement("input");
  labelField.type = "text";
  labelField.size = 25;
  labelField.id = 'pod'+selectedPod.toString()+'item'+(numRows-1).toString()+'Label';
  labelCell.appendChild(labelField);

  // Add the data type select menu
  var selectList = document.createElement("select");
  selectList.id = 'pod'+selectedPod.toString()+'item'+(numRows-1).toString()+'Type';
  typeCell.appendChild(selectList);
  for (i=0; i<dataTypes.length; i++) {
    var option = document.createElement("option");
    option.value = dataTypes[i][0];
    option.text = dataTypes[i][0];
    selectList.appendChild(option);
  }

  bytesCell.id = 'pod'+selectedPod.toString()+'item'+(numRows-1).toString()+'Size';
}


const addPod1ItemBtn = document.getElementById('addPod1Item');
addPod1ItemBtn.addEventListener('click', insertItem.bind(null,event, 1), false);

updateByteTable();
updatePodTables();
