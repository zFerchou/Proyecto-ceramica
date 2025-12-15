const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess;

function getBackendPath() {
  if (!app.isPackaged) {
    return path.join(process.cwd(), 'backend', 'server.js');
  }

  return path.join(process.resourcesPath, 'backend', 'server.js');
}

function startBackend() {
  const backendPath = getBackendPath();

  console.log('🚀 Backend path:', backendPath);

  if (!fs.existsSync(backendPath)) {
    throw new Error(`❌ Backend NO encontrado: ${backendPath}`);
  }

  backendProcess = fork(backendPath, [], {
    env: {
      ...process.env,
      NODE_ENV: 'production'
    },
    silent: false
  });

  backendProcess.on('error', (err) => {
    console.error('❌ Backend error:', err);
  });

  backendProcess.on('exit', (code) => {
    console.error('❌ Backend exited with code:', code);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true
    }
  });

  mainWindow.loadURL('http://127.0.0.1:5000');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackend();

  // ⏳ damos tiempo real al backend
  setTimeout(createWindow, 2000);
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});
