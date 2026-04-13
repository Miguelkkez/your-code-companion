const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronStore', {
  get: (key) => ipcRenderer.invoke('store-get', key),
  set: (key, data) => ipcRenderer.invoke('store-set', key, data),
  getDataPath: () => ipcRenderer.invoke('get-data-path'),
});
