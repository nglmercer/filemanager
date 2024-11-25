const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
const NodedbJson = require('nodedb-json');
const nodedb = new NodedbJson('./db.json');
const http = require("http")
const express = require('express');
const expressapp = express();
const { Server } = require('socket.io'); // Importar Socket.IO
const fs = require('fs');
const WindowManager = require('./window-manager');
const windowManager = new WindowManager();
const PORT = process.env.PORT || 3002;

// Crear servidor HTTP para Socket.IO
const httpServer = http.createServer(expressapp);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

expressapp.use(express.static(path.join(__dirname, 'public')));

function createWindow () {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: false,
    },
  });
  const url = `http://localhost:${PORT}`
  mainWindow.loadURL(url)
}

// Rutas de medios existentes
expressapp.get('/media/*', (req, res) => {
  const requestedPath = decodeURIComponent(req.params[0]);
  const filePath = path.resolve(requestedPath);
  const extname = path.extname(filePath).toLowerCase();
  const imageobj = {
    '.jpg': 'jpeg',
    '.jpeg': 'jpeg',
    '.png': 'png',
    '.gif': 'gif',
    '.webp': 'webp',
    '.svg': 'svg',
    '.bmp': 'bmp',
    '.ico': 'x-icon',
    '.tiff': 'tiff',
    '.avif': 'avif',
    '.apng': 'apng'
  };

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return res.status(404).send('File not found');
    }

    if (extname === '.mp3' || extname === '.wav') {
      res.setHeader('Content-Type', 'audio/' + extname.slice(1));
    } else if (extname === '.mp4' || extname === '.webm') {
      res.setHeader('Content-Type', 'video/' + extname.slice(1));
    } else if (imageobj[extname]) {
      res.setHeader('Content-Type', 'image/' + imageobj[extname]);
    } else {
      return res.status(415).send('Unsupported file type');
    }

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  });
});

// Configuración de Socket.IO
io.on('connection', (socket) => {
  console.log('Cliente conectado');

  // Manejar creación de ventanas
  socket.on('create-window', (config) => {
    windowManager.createWindow(config);
  });

  // Manejar actualización de ventanas
  socket.on('update-window', ({ id, config }) => {
    windowManager.updateWindow(id, config);
  });

  // Manejar cierre de ventanas
  socket.on('close-window', (id) => {
    windowManager.closeWindow(id);
  });

  // Enviar lista inicial de ventanas
  socket.emit('window-list', 
    Array.from(windowManager.getWindows().entries())
      .map(([id, config]) => ({ id, ...config }))
  );
});

// Eventos desde WindowManager hacia Socket.IO
windowManager.on('window-created', (data) => {
  io.emit('window-created', data);
});

windowManager.on('window-closed', (id) => {
  io.emit('window-closed', id);
});

windowManager.on('window-updated', (data) => {
  io.emit('window-updated', data);
});

// Escuchar en el servidor HTTP en lugar de usar expressapp.listen
httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Eventos de ciclo de vida de Electron
app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// Manejador IPC existente
ipcMain.handle('get-file-paths', async (event, files) => {
  const filePaths = files.map(file => file.path);
  console.log('Rutas de archivos:', filePaths);
  return filePaths;
});