const path = require('path')
const electron = require('electron')
const url = require('url')

const BrowserWindow = electron.BrowserWindow
const app = electron.app

var mainWindow = null

function createWindow () {
  var windowOptions = {
    width: 1900,
    minWidth: 680,
    height: 1000,
    webPreferences: {nodeIntegration: true}
  }

  mainWindow = new BrowserWindow(windowOptions)
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  mainWindow.on('closed', function () {
    mainWindow = null
  })

  mainWindow.webContents.openDevTools()
}



app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})
