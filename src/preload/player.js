'use strict';

const { contextBridge, ipcRenderer } = require('electron');

function subscribe(channel, callback) {
  const handler = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

contextBridge.exposeInMainWorld('aeroDeck', {
  playback: {
    ready: () => ipcRenderer.send('player:ready'),
    sendStatus: (status) => ipcRenderer.send('playback:status', status),
    onPlay: (callback) => subscribe('playback:play', callback),
    onStop: (callback) => subscribe('playback:stop', callback)
  },
  window: {
    action: (action) => ipcRenderer.invoke('window:action', action)
  }
});
