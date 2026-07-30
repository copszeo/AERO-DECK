'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  ipcMain,
  Menu,
  nativeImage,
  Tray,
  shell
} = require('electron');
const { PadStore } = require('./pad-store');
const { PlaybackQueue } = require('./playback-queue');
const { toElectronAccelerator } = require('./hotkey');
const {
  AUDIO_EXTENSIONS,
  VIDEO_EXTENSIONS,
  inspectMediaFile,
  serializePad
} = require('./media');

let mainWindow;
let playerWindow;
let tray;
let store;
let isQuitting = false;
let captureMode = false;
let playerReady = false;
let playerRecoveryTimer = null;
let registrationState = {};
const missingPadIds = new Set();
const playbackQueue = new PlaybackQueue((message) => {
  sendPlaybackStatus({
    id: message.pad.id,
    state: 'stopped',
    currentTime: 0,
    duration: 0
  });
});

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) {
  app.quit();
}

function rendererPath(fileName) {
  return path.join(__dirname, '..', 'renderer', fileName);
}

function assetPath(fileName) {
  return path.join(__dirname, '..', '..', 'assets', fileName);
}

function showDashboard() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createMainWindow();
    return;
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.show();
  mainWindow.focus();
}

function resetCaptureMode() {
  if (!captureMode || !store) return;
  captureMode = false;
  registerGlobalHotkeys();
}

function createMainWindow() {
  const windowInstance = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 650,
    frame: false,
    show: false,
    backgroundColor: '#0c0d13',
    icon: assetPath('icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'dashboard.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false
    }
  });
  mainWindow = windowInstance;

  windowInstance.loadFile(rendererPath('index.html'));
  windowInstance.once('ready-to-show', () => windowInstance.show());
  windowInstance.on('show', () => {
    windowInstance.webContents.send('window:shown');
  });
  windowInstance.on('restore', () => {
    windowInstance.webContents.send('window:shown');
  });
  windowInstance.on('minimize', resetCaptureMode);
  windowInstance.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  windowInstance.webContents.on('will-navigate', (event) => event.preventDefault());
  windowInstance.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
  windowInstance.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      resetCaptureMode();
      windowInstance.hide();
    }
  });
  windowInstance.webContents.on('render-process-gone', resetCaptureMode);
  windowInstance.on('closed', () => {
    if (mainWindow === windowInstance) {
      mainWindow = null;
    }
  });
}

function createPlayerWindow() {
  const windowInstance = new BrowserWindow({
    width: 960,
    height: 600,
    minWidth: 640,
    minHeight: 420,
    frame: false,
    show: false,
    alwaysOnTop: true,
    backgroundColor: '#050507',
    title: 'AERO DECK Player',
    icon: assetPath('icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'player.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false
    }
  });
  playerWindow = windowInstance;
  playerReady = false;

  windowInstance.loadFile(rendererPath('player.html'));
  windowInstance.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  windowInstance.webContents.on('will-navigate', (event) => event.preventDefault());
  windowInstance.webContents.on('render-process-gone', () => {
    playerReady = false;
    if (!isQuitting && !playerRecoveryTimer) {
      playerRecoveryTimer = setTimeout(() => {
        playerRecoveryTimer = null;
        recreatePlayerWindow();
      }, 500);
    }
  });
  windowInstance.webContents.on('unresponsive', () => {
    playerReady = false;
    windowInstance.webContents.reload();
  });
  windowInstance.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      cancelPendingPlayback();
      windowInstance.webContents.send('playback:stop');
      windowInstance.hide();
    }
  });
  windowInstance.on('closed', () => {
    if (playerWindow === windowInstance) {
      playerWindow = null;
      playerReady = false;
    }
  });
}

function recreatePlayerWindow() {
  if (isQuitting) return;
  const previousWindow = playerWindow;
  playerWindow = null;
  playerReady = false;
  if (previousWindow && !previousWindow.isDestroyed()) {
    previousWindow.destroy();
  }
  createPlayerWindow();
}

function cancelPendingPlayback(id = '') {
  return playbackQueue.cancel(id);
}

function presentVideoWindow(source) {
  if (!playerWindow || playerWindow.isDestroyed()) return;
  if (source === 'hotkey') {
    playerWindow.showInactive();
    return;
  }
  if (playerWindow.isMinimized()) {
    playerWindow.restore();
  }
  playerWindow.show();
  playerWindow.focus();
}

function dispatchPlayback(message) {
  if (!playerWindow || playerWindow.isDestroyed()) return;
  playerWindow.webContents.send('playback:play', message);
  if (message.pad.type === 'video') {
    presentVideoWindow(message.source);
  } else if (playerWindow.isVisible()) {
    playerWindow.hide();
  }
}

function queueOrDispatchPlayback(message) {
  if (playerReady) {
    dispatchPlayback(message);
    return false;
  }
  playbackQueue.enqueue(message);
  return true;
}

function createTray() {
  const iconPath = fs.existsSync(assetPath('icon.png'))
    ? assetPath('icon.png')
    : assetPath('icon.svg');
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 20, height: 20 });
  tray = new Tray(trayIcon);
  tray.setToolTip('AERO DECK — Hotkey global aktif');
  tray.on('double-click', showDashboard);
  tray.on('click', showDashboard);
  updateTrayMenu();
}

function updateTrayMenu() {
  if (!tray || !store) {
    return;
  }

  const enabled = store.snapshot().settings.globalHotkeysEnabled;
  const activeLabel = captureMode ? 'dijeda sementara' : (enabled ? 'aktif' : 'nonaktif');
  tray.setToolTip(`AERO DECK — Hotkey global ${activeLabel}`);
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'Buka AERO DECK',
      click: showDashboard
    },
    { type: 'separator' },
    {
      label: 'Hotkey global aktif',
      type: 'checkbox',
      checked: enabled,
      click: (menuItem) => {
        store.setGlobalHotkeysEnabled(menuItem.checked);
        registerGlobalHotkeys();
      }
    },
    {
      label: 'Hentikan semua media',
      click: () => {
        cancelPendingPlayback();
        if (playerWindow && !playerWindow.isDestroyed()) {
          playerWindow.webContents.send('playback:stop');
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Keluar',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]));
}

function getPublicState() {
  const snapshot = store.snapshot();
  const pads = snapshot.pads.map(serializePad);
  missingPadIds.clear();
  for (const pad of pads) {
    if (!pad.exists) missingPadIds.add(pad.id);
  }
  return {
    ...snapshot,
    pads,
    registrations: registrationState,
    captureMode
  };
}

function sendState() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('library:state', getPublicState());
  }
  updateTrayMenu();
}

function registerGlobalHotkeys() {
  globalShortcut.unregisterAll();
  registrationState = {};

  const snapshot = store.snapshot();
  if (!snapshot.settings.globalHotkeysEnabled || captureMode) {
    for (const pad of snapshot.pads) {
      if (pad.hotkey) {
        registrationState[pad.id] = {
          registered: false,
          reason: captureMode ? 'capture' : 'disabled'
        };
      }
    }
    sendState();
    return;
  }

  for (const pad of snapshot.pads) {
    if (!pad.hotkey) {
      continue;
    }

    const accelerator = toElectronAccelerator(pad.hotkey);
    let registered = false;
    try {
      registered = Boolean(
        accelerator && globalShortcut.register(accelerator, () => triggerPad(pad.id, 'hotkey'))
      );
    } catch {
      registered = false;
    }

    registrationState[pad.id] = {
      registered,
      reason: registered ? '' : 'unavailable'
    };
  }
  sendState();
}

function triggerPad(id, source = 'app') {
  const pad = store.getPad(id);
  if (!pad) {
    return { ok: false, error: 'Pad tidak ditemukan.' };
  }
  if (!fs.existsSync(pad.mediaPath)) {
    missingPadIds.add(id);
    sendState();
    sendPlaybackStatus({ id, state: 'error', error: 'File sumber tidak ditemukan.' });
    return { ok: false, reported: true, error: 'File sumber tidak ditemukan.' };
  }
  if (!playerWindow || playerWindow.isDestroyed()) {
    return { ok: false, error: 'Player belum siap.' };
  }

  const publicPad = serializePad(pad);
  const message = { pad: publicPad, source };
  const queued = queueOrDispatchPlayback(message);

  if (missingPadIds.delete(id)) {
    sendState();
  }
  return { ok: true, queued };
}

function sendPlaybackStatus(status) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('playback:status', status);
  }
}

function requireDashboard(event) {
  if (!mainWindow || mainWindow.isDestroyed() || event.sender !== mainWindow.webContents) {
    throw new Error('Permintaan dashboard tidak diizinkan.');
  }
}

function dashboardHandler(channel, handler) {
  ipcMain.handle(channel, (event, ...args) => {
    requireDashboard(event);
    return handler(...args);
  });
}

function validatePadMutation(input, id = '') {
  const existing = id ? store.getPad(id) : null;
  const requestedPath = input?.mediaPath ?? existing?.mediaPath;
  const inspected = inspectMediaFile(requestedPath);
  const requestedType = input?.type ?? existing?.type;
  if (requestedType !== inspected.type) {
    throw new Error('Jenis media tidak sesuai dengan file yang dipilih.');
  }
  return {
    ...input,
    mediaPath: inspected.path,
    type: inspected.type
  };
}

function registerIpcHandlers() {
  dashboardHandler('library:get-state', () => getPublicState());

  dashboardHandler('library:select-media', async (preferredType) => {
    const type = preferredType === 'video' ? 'video' : 'audio';
    const result = await dialog.showOpenDialog(mainWindow, {
      title: type === 'audio' ? 'Pilih file audio' : 'Pilih file video',
      properties: ['openFile'],
      filters: [
        {
          name: type === 'audio' ? 'Audio' : 'Video',
          extensions: type === 'audio' ? AUDIO_EXTENSIONS : VIDEO_EXTENSIONS
        },
        {
          name: 'Semua file media',
          extensions: [...AUDIO_EXTENSIONS, ...VIDEO_EXTENSIONS]
        }
      ]
    });

    if (result.canceled || !result.filePaths[0]) {
      return null;
    }
    return inspectMediaFile(result.filePaths[0]);
  });

  dashboardHandler('library:inspect-file', (filePath) => inspectMediaFile(filePath));

  dashboardHandler('library:add-pad', (input) => {
    const pad = store.addPad(validatePadMutation(input));
    registerGlobalHotkeys();
    return serializePad(pad);
  });

  dashboardHandler('library:update-pad', (id, input) => {
    cancelPendingPlayback(id);
    const pad = store.updatePad(id, validatePadMutation(input, id));
    registerGlobalHotkeys();
    return serializePad(pad);
  });

  dashboardHandler('library:delete-pad', (id) => {
    cancelPendingPlayback(id);
    const pad = store.deletePad(id);
    registerGlobalHotkeys();
    return pad;
  });

  dashboardHandler('library:set-global-hotkeys', (enabled) => {
    store.setGlobalHotkeysEnabled(enabled);
    registerGlobalHotkeys();
    return getPublicState();
  });

  dashboardHandler('library:set-capture-mode', (enabled) => {
    captureMode = Boolean(enabled);
    registerGlobalHotkeys();
    return getPublicState();
  });

  dashboardHandler('library:reveal-pad', (id) => {
    const pad = store.getPad(id);
    if (!pad || !fs.existsSync(pad.mediaPath)) {
      throw new Error('File sumber tidak ditemukan.');
    }
    shell.showItemInFolder(pad.mediaPath);
    return true;
  });

  dashboardHandler('playback:play-pad', (id) => triggerPad(id, 'app'));
  dashboardHandler('playback:stop-all', () => {
    cancelPendingPlayback();
    if (playerWindow && !playerWindow.isDestroyed()) {
      playerWindow.webContents.send('playback:stop');
    }
    return true;
  });

  ipcMain.on('player:ready', (event) => {
    if (!playerWindow || playerWindow.isDestroyed() || event.sender !== playerWindow.webContents) {
      return;
    }
    playerReady = true;
    registerGlobalHotkeys();
    if (playbackQueue.hasPending()) {
      const queuedPlayback = playbackQueue.take();
      dispatchPlayback(queuedPlayback);
    }
  });

  ipcMain.on('playback:status', (event, status) => {
    if (!playerWindow || playerWindow.isDestroyed() || event.sender !== playerWindow.webContents) {
      return;
    }
    if (!status || typeof status.id !== 'string' || typeof status.state !== 'string') {
      return;
    }
    sendPlaybackStatus({
      id: status.id,
      state: status.state,
      currentTime: Number(status.currentTime) || 0,
      duration: Number(status.duration) || 0,
      error: typeof status.error === 'string' ? status.error.slice(0, 240) : ''
    });
  });

  ipcMain.handle('window:action', (event, action) => {
    const target = BrowserWindow.fromWebContents(event.sender);
    if (!target || (target !== mainWindow && target !== playerWindow)) return false;
    if (action === 'minimize') {
      if (target === mainWindow) resetCaptureMode();
      target.minimize();
      return true;
    }
    if (action === 'maximize') {
      target.isMaximized() ? target.unmaximize() : target.maximize();
      return true;
    }
    if (action === 'close') {
      target.close();
      return true;
    }
    if (action === 'hide-player' && target === playerWindow) {
      cancelPendingPlayback();
      target.webContents.send('playback:stop');
      target.hide();
      return true;
    }
    if (action === 'toggle-always-on-top' && target === playerWindow) {
      target.setAlwaysOnTop(!target.isAlwaysOnTop());
      return target.isAlwaysOnTop();
    }
    if (action === 'toggle-fullscreen' && target === playerWindow) {
      target.setFullScreen(!target.isFullScreen());
      return target.isFullScreen();
    }
    if (action === 'dismiss-player' && target === playerWindow) {
      if (target.isFullScreen()) {
        target.setFullScreen(false);
        return 'fullscreen-exited';
      }
      cancelPendingPlayback();
      target.webContents.send('playback:stop');
      target.hide();
      return 'hidden';
    }
    return false;
  });
}

if (singleInstanceLock) {
  app.whenReady().then(() => {
    store = new PadStore(path.join(app.getPath('userData'), 'aero-deck-library.json'));
    store.load();
    registerIpcHandlers();
    createPlayerWindow();
    createMainWindow();
    createTray();

    app.on('activate', () => {
      if (!mainWindow) {
        createMainWindow();
      } else {
        mainWindow.show();
      }
    });
  });
}

app.on('second-instance', showDashboard);

app.on('before-quit', () => {
  isQuitting = true;
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // The tray owns the app lifecycle on Windows.
});
