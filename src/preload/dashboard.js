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
    selectOpenTarget: (kind) => ipcRenderer.invoke('library:select-open-target', kind),
    inspectFile: (filePath) => ipcRenderer.invoke('library:inspect-file', filePath),
    pathForFile: (file) => webUtils.getPathForFile(file),
    addPad: (input) => ipcRenderer.invoke('library:add-pad', input),
    updatePad: (id, input) => ipcRenderer.invoke('library:update-pad', id, input),
    deletePad: (id) => ipcRenderer.invoke('library:delete-pad', id),
    addDeck: (title) => ipcRenderer.invoke('library:add-deck', title),
    renameDeck: (id, title) => ipcRenderer.invoke('library:rename-deck', id, title),
    deleteDeck: (id) => ipcRenderer.invoke('library:delete-deck', id),
    setActiveDeck: (id) => ipcRenderer.invoke('library:set-active-deck', id),
    reorderPads: (deckId, orderedIds) => (
      ipcRenderer.invoke('library:reorder-pads', deckId, orderedIds)
    ),
    setGlobalHotkeys: (enabled) => ipcRenderer.invoke('library:set-global-hotkeys', enabled),
    updateSettings: (patch) => ipcRenderer.invoke('library:update-settings', patch),
    setCaptureMode: (enabled) => ipcRenderer.invoke('library:set-capture-mode', enabled),
    revealPad: (id) => ipcRenderer.invoke('library:reveal-pad', id),
    exportBackup: () => ipcRenderer.invoke('library:export-backup'),
    importBackup: () => ipcRenderer.invoke('library:import-backup'),
    checkForUpdates: () => ipcRenderer.invoke('library:check-for-updates'),
    openDataFolder: () => ipcRenderer.invoke('library:open-data-folder'),
    openReleases: () => ipcRenderer.invoke('library:open-releases'),
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
