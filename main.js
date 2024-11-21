// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
const NodedbJson = require('nodedb-json');
const nodedb = new NodedbJson('./db.json');
const http = require("http")
const express = require('express');
const expressapp = express();
const fs = require('fs');
const PORT = process.env.PORT || 3002;
expressapp.use(express.static(path.join(__dirname, 'public')));
function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    webPreferences: {
        preload: path.join(__dirname, 'preload.js'), // Habilitar Preload Script
        contextIsolation: true,
        sandbox: false,
      },
  });
  const url = "http://localhost:3002"
  // and load the index.html of the app.
  mainWindow.loadURL(url)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

expressapp.get('/media/*', (req, res) => {
  const requestedPath = decodeURIComponent(req.params[0]); // Decodifica rutas con %20
  const filePath = path.resolve(requestedPath); // Resuelve la ruta absoluta

  const extname = path.extname(filePath).toLowerCase();
  const imageobj = {
    '.jpg': 'jpeg',
    '.jpeg': 'jpeg',
    '.png': 'png',
    '.gif': 'gif',
    '.webp': 'webp',
  };

  // Verifica si el archivo existe
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return res.status(404).send('File not found');
    }

    // Determina el tipo de archivo
    if (extname === '.mp3' || extname === '.wav') {
      res.setHeader('Content-Type', 'audio/' + extname.slice(1));
    } else if (extname === '.mp4' || extname === '.webm') {
      res.setHeader('Content-Type', 'video/' + extname.slice(1));
    } else if (imageobj[extname]) {
      res.setHeader('Content-Type', 'image/' + imageobj[extname]);
    } else {
      return res.status(415).send('Unsupported file type');
    }

    // Lee el archivo y envíalo
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  });
});

expressapp.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
ipcMain.handle('get-file-paths', async (event, files) => {
  const filePaths = files.map(file => file.path); // Acceder al atributo `path`
  console.log('Rutas de archivos:', filePaths);
  return filePaths;
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
