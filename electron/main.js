const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

// ─────────────────────────────────────────────
// 🔒 FIX 1 — BLOQUEAR MÚLTIPLES INSTANCIAS
// ─────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

// ─────────────────────────────────────────────
// Reload SOLO en desarrollo
// ─────────────────────────────────────────────
if (!app.isPackaged) {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    });
  } catch (_) {}
}

let backendProcess;

// ─────────────────────────────────────────────
// 🕒 FIX 2 — ESPERAR BACKEND CON LÍMITE (NO LOOP)
// ─────────────────────────────────────────────
function waitForBackend(win, retries = 0) {
  if (retries > 20) {
    win.loadURL(`data:text/html,
      <h2>Error</h2>
      <p>No se pudo iniciar el servidor interno.</p>
      <p>Revisa los logs o reinicia la aplicación.</p>
    `);
    return;
  }

  http.get('http://localhost:5000/health', (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Backend listo');
      win.loadURL('http://localhost:5000');
    } else {
      setTimeout(() => waitForBackend(win, retries + 1), 500);
    }
  }).on('error', () => {
    setTimeout(() => waitForBackend(win, retries + 1), 500);
  });
}

// ─────────────────────────────────────────────
// Crear ventana
// ─────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  waitForBackend(win);
}

// ─────────────────────────────────────────────
// 🚀 Iniciar backend (server.js)
// ─────────────────────────────────────────────
function startBackend() {
  let scriptPath;
  let cwdPath;

  if (app.isPackaged) {
    // PRODUCCIÓN
    scriptPath = path.join(process.resourcesPath, 'backend', 'server.js');
    cwdPath = path.join(process.resourcesPath, 'backend');
  } else {
    // DESARROLLO
    scriptPath = path.join(__dirname, '..', 'backend', 'server.js');
    cwdPath = path.join(__dirname, '..', 'backend');
  }

  // 🔍 FIX 3 — LOGS CRÍTICOS DE RUTA
  console.log('🚀 Iniciando backend');
  console.log('📄 BACKEND PATH:', scriptPath);
  console.log('📁 BACKEND EXISTS:', fs.existsSync(scriptPath));

  backendProcess = spawn(process.execPath, [scriptPath], {
    cwd: cwdPath,
    env: {
      ...process.env,
      PORT: 5000,
      NODE_ENV: app.isPackaged ? 'production' : 'development'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // 🔥 FIX 5 — LOGS FORZADOS
  backendProcess.stdout.on('data', (data) => {
    console.log('[BACKEND]', data.toString());
  });

  backendProcess.stderr.on('data', (data) => {
    console.error('[BACKEND ERROR]', data.toString());
  });

  backendProcess.on('close', (code) => {
    console.warn(`⚠️ Backend cerrado con código ${code}`);
  });
}

// ─────────────────────────────────────────────
// Ciclo de vida Electron
// ─────────────────────────────────────────────
app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (backendProcess) {
    console.log('🛑 Cerrando backend');
    backendProcess.kill();
  }
});
