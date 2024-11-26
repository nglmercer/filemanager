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
class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // Almacena información de las salas
  }

  // Unir usuario a sala
  joinRoom(socket, roomId) {
    socket.join(roomId);
    
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    
    this.rooms.get(roomId).add(socket.id);
    
    return {
      roomId,
      usersCount: this.rooms.get(roomId).size
    };
  }

  // Salir de sala
  leaveRoom(socket, roomId) {
    socket.leave(roomId);
    
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(socket.id);
      
      // Eliminar sala si está vacía
      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  // Emitir a todos los usuarios en una sala
  emitToRoom(roomId, eventName, data) {
    this.io.to(roomId).emit(eventName, data);
  }

  // Obtener usuarios en una sala
  getRoomUsers(roomId) {
    return this.rooms.get(roomId) || new Set();
  }

  // Verificar si una sala existe
  roomExists(roomId) {
    return this.rooms.has(roomId);
  }

  // Obtener número de usuarios en una sala
  getRoomSize(roomId) {
    return this.rooms.get(roomId)?.size || 0;
  }
}
const roomManager = new RoomManager(io);

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
/**
 * Ruta para servir archivos multimedia
 * 
 * El error "Unsupported pixel format: -1" ocurre cuando FFmpeg no puede decodificar
 * el formato de píxeles del video. Para solucionarlo:
 * 
 * 1. Asegurarse que el video esté en un formato compatible (H.264/VP8/VP9)
 * 2. Convertir el video a un formato soportado usando:
 *    ffmpeg -i input.mp4 -pix_fmt yuv420p output.mp4
 * 3. Verificar que el codec y contenedor sean compatibles con el navegador
 * 
 * Formatos recomendados:
 * - Video: MP4 (H.264) o WebM (VP8/VP9) con yuv420p
 * - Audio: MP3 o WAV
 * - Imágenes: JPEG, PNG, WebP, GIF
 */
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
    '.svg': 'svg+xml',
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
      // Para videos, verificar que estén en formato compatible
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
  console.log('Cliente conectado',socket.id);
  socket.on('join-room', (roomId) => {
    const roomInfo = roomManager.joinRoom(socket, roomId);
    
    // Notificar a todos en la sala
    roomManager.emitToRoom(roomId, 'user-joined', {
      userId: socket.id,
      usersCount: roomInfo.usersCount
    });
  });
  socket.on('create-overlay', ({ roomId, mapconfig }) => {
    if (roomManager.roomExists(roomId)) {
      console.log('create-overlay', mapconfig);
      roomManager.emitToRoom(roomId, 'create-overlay', mapconfig);
    }
    // emitimos a todos los usuarios en la sala

  });
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
  socket.on('leave-room', (roomId) => {
    roomManager.leaveRoom(socket, roomId);
    roomManager.emitToRoom(roomId, 'user-left', {
      userId: socket.id,
      usersCount: roomManager.getRoomSize(roomId)
    });
  });

  socket.on('disconnect', () => {
    // Limpiar todas las salas donde estaba el usuario
    for (const [roomId, users] of roomManager.rooms.entries()) {
      if (users.has(socket.id)) {
        roomManager.leaveRoom(socket, roomId);
        roomManager.emitToRoom(roomId, 'user-left', {
          userId: socket.id,
          usersCount: roomManager.getRoomSize(roomId)
        });
      }
    }
  });
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