const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('geminiAPI', {
  // Connection
  connect: (settings) => ipcRenderer.invoke('connect', settings),
  disconnect: () => ipcRenderer.invoke('disconnect'),
  
  // Commands
  sendCommand: (command) => ipcRenderer.invoke('send-command', command),
  getStatus: () => ipcRenderer.invoke('get-status'),
  testConnection: (ip, port) => ipcRenderer.invoke('test-connection', ip, port),
  
  // Event listeners
  onConnectionStatus: (callback) => {
    ipcRenderer.on('connection-status', (event, data) => callback(data));
  },
  
  onAmpStatus: (callback) => {
    ipcRenderer.on('amp-status', (event, data) => callback(data));
  },
  
  onAmpBanner: (callback) => {
    ipcRenderer.on('amp-banner', (event, data) => callback(data));
  },
  
  onAmpTrip: (callback) => {
    ipcRenderer.on('amp-trip', (event, data) => callback(data));
  },
  
  onAmpPTT: (callback) => {
    ipcRenderer.on('amp-ptt', (event, data) => callback(data));
  },
  
  onAmpResponse: (callback) => {
    ipcRenderer.on('amp-response', (event, data) => callback(data));
  },
  
  onLog: (callback) => {
    ipcRenderer.on('log', (event, data) => callback(data));
  }
});
