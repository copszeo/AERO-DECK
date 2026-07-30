'use strict';

const { contextBridge, ipcRenderer, webUtils } = require('electron');

function subscribe(channel, callback) {
  const handler = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

contextBridge.exposeInMainWorld('aeroDeck', {
  library: {
    getState: () => ipcRenderer.invoke('library:get-state'),
    selectMedia: (type) => ipcRenderer.invoke('library:select-media', type),
    inspectFile: (filePath) => ipcRenderer.invoke('library:inspect-file', filePath),
    pathForFile: (file) => webUtils.getPathForFile(file),
    addPad: (input) => ipcRenderer.invoke('library:add-pad', input),
    updatePad: (id, input) => ipcRenderer.invoke('library:update-pad', id, input),
    deletePad: (id) => ipcRenderer.invoke('library:delete-pad', id),
    setGlobalHotkeys: (enabled) => ipcRenderer.invoke('library:set-global-hotkeys', enabled),
    setCaptureMode: (enabled) => ipcRenderer.invoke('library:set-capture-mode', enabled),
    revealPad: (id) => ipcRenderer.invoke('library:reveal-pad', id),
    onState: (callback) => subscribe('library:state', callback)
  },
  playback: {
    playPad: (id) => ipcRenderer.invoke('playback:play-pad', id),
    stopAll: () => ipcRenderer.invoke('playback:stop-all'),
    onStatus: (callback) => subscribe('playback:status', callback)
  },
  window: {
    action: (action) => ipcRenderer.invoke('window:action', action),
    onShown: (callback) => subscribe('window:shown', callback)
  }
});
