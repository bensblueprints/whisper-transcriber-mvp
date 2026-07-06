'use strict';
const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('api', {
  setupStatus: () => ipcRenderer.invoke('setup:status'),
  setupEnsure: (model) => ipcRenderer.invoke('setup:ensure', { model }),
  pickFile: () => ipcRenderer.invoke('dialog:pickFile'),
  transcribe: (filePath, model, language) =>
    ipcRenderer.invoke('transcribe:start', { filePath, model, language }),
  historyList: () => ipcRenderer.invoke('history:list'),
  historyLoad: (id) => ipcRenderer.invoke('history:load', id),
  historyDelete: (id) => ipcRenderer.invoke('history:delete', id),
  exportSave: (id, format) => ipcRenderer.invoke('export:save', { id, format }),
  openFolder: (dir) => ipcRenderer.invoke('shell:openFolder', dir),
  pathForFile: (file) => webUtils.getPathForFile(file),

  onSetupProgress: (cb) => ipcRenderer.on('setup:progress', (_e, p) => cb(p)),
  onJobStatus: (cb) => ipcRenderer.on('job:status', (_e, p) => cb(p)),
  onJobProgress: (cb) => ipcRenderer.on('job:progress', (_e, p) => cb(p))
});
