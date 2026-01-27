// Expose minimal safe APIs if needed later
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('AppEnv', {
  apiBase: process.env.REACT_APP_API_BASE || 'http://localhost:5000',
});
