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
  net,
  nativeImage,
  Tray,
  shell
} = require('electron');
const { PadStore } = require('./pad-store');
const { createActionRunner } = require('./action-runner');
const { createWindowsActionAdapter } = require('./actions/windows-adapter');
const { PlaybackQueue } = require('./playback-queue');
const { toElectronAccelerator } = require('./hotkey');
const { isNewerVersion } = require('./version');
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
let actionRunner;
let isQuitting = false;
let captureMode = false;
let playerReady = false;
let playerRecoveryTimer = null;
let registrationState = Object.create(null);
let globalHotkeySuspensionDepth = 0;
let inputActionQueue = Promise.resolve();
let stopAllRegistration = {
  registered: false,
  reason: 'unavailable'
};
let initialWindowCreated = false;
const missingPadIds = new Set();
const activeActionCounts = new Map();
const smokeTestEnabled = process.env.AERO_DECK_SMOKE_TEST === '1';
const smokeWindowsReady = new Set();
let smokeFailed = false;
const RELEASES_URL = 'https://github.com/copszeo/AERO-DECK/releases';
const LATEST_RELEASE_API = 'https://api.github.com/repos/copszeo/AERO-DECK/releases/latest';
const UPDATE_CHECK_TIMEOUT_MS = 10_000;
const playbackQueue = new PlaybackQueue((message) => {
  sendPlaybackStatus({
    id: message.pad.id,
    state: 'stopped',
    instanceId: '',
    activeCount: 0,
    currentTime: 0,
    duration: 0
  });
});

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.setAppUserModelId('id.aerodeck.app');

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) {
  app.quit();
}

function rendererPath(fileName) {
  return path.join(__dirname, '..', 'renderer', fileName);
}

function failSmokeTest(message) {
  if (!smokeTestEnabled || smokeFailed) return;
  smokeFailed = true;
  process.exitCode = 1;
  console.error(`AERO_DECK_SMOKE_ERROR ${message}`);
  isQuitting = true;
  app.quit();
}

function observeSmokeWindow(windowInstance, name, readinessExpression) {
  if (!smokeTestEnabled) return;

  windowInstance.webContents.on('did-fail-load', (_event, code, description) => {
    failSmokeTest(`${name} gagal dimuat (${code}): ${description}`);
  });
  windowInstance.webContents.on('render-process-gone', (_event, details) => {
    failSmokeTest(`${name} renderer berhenti: ${details.reason}`);
  });
  windowInstance.webContents.on('preload-error', (_event, preloadPath, error) => {
    failSmokeTest(`${name} preload gagal (${preloadPath}): ${error.message}`);
  });
  windowInstance.webContents.on('console-message', (_event, details, legacyMessage) => {
    const level = typeof details === 'object' ? details.level : details;
    const message = typeof details === 'object' ? details.message : legacyMessage;
    if (level === 'error' || level === 3) {
      failSmokeTest(`${name} console: ${String(message).slice(0, 400)}`);
    }
  });
  windowInstance.webContents.once('did-finish-load', async () => {
    try {
      const ready = await windowInstance.webContents.executeJavaScript(
        `new Promise((resolve) => {
          const deadline = Date.now() + 5000;
          const check = () => {
            let isReady = false;
            try {
              isReady = Boolean(${readinessExpression});
            } catch {
              isReady = false;
            }
            if (isReady || Date.now() >= deadline) {
              resolve(isReady);
              return;
            }
            setTimeout(check, 50);
          };
          check();
        })`,
        true
      );
      if (!ready) {
        failSmokeTest(`${name} tidak mencapai kondisi siap.`);
        return;
      }
      smokeWindowsReady.add(name);
      if (smokeWindowsReady.size === 2 && !smokeFailed) {
        console.log('AERO_DECK_SMOKE_READY');
        setTimeout(() => {
          isQuitting = true;
          app.quit();
        }, 200);
      }
    } catch (error) {
      failSmokeTest(`${name} tidak dapat diperiksa: ${error.message}`);
    }
  });
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
  const isInitialWindow = !initialWindowCreated;
  const startHidden = isInitialWindow && (
    smokeTestEnabled ||
    process.argv.includes('--hidden') ||
    store?.snapshot().settings.startMinimized
  );
  initialWindowCreated = true;
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
  observeSmokeWindow(
    windowInstance,
    'dashboard',
    "window.aeroDeck && document.documentElement.dataset.aeroDashboardReady === 'true'"
  );

  windowInstance.loadFile(rendererPath('index.html'));
  windowInstance.once('ready-to-show', () => {
    if (!startHidden) {
      windowInstance.show();
    }
  });
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
  observeSmokeWindow(
    windowInstance,
    'player',
    "window.aeroDeck && document.documentElement.dataset.aeroPlayerReady === 'true'"
  );

  windowInstance.loadFile(rendererPath('player.html'));
  windowInstance.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  windowInstance.webContents.on('will-navigate', (event) => event.preventDefault());
  windowInstance.webContents.on('render-process-gone', () => {
    playerReady = false;
    resetPlaybackStatuses();
    if (!isQuitting && !playerRecoveryTimer) {
      playerRecoveryTimer = setTimeout(() => {
        playerRecoveryTimer = null;
        recreatePlayerWindow();
      }, 500);
    }
  });
  windowInstance.webContents.on('unresponsive', () => {
    playerReady = false;
    resetPlaybackStatuses();
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

function stopAllPlayback() {
  cancelPendingPlayback();
  actionRunner?.cancelAll();
  if (playerWindow && !playerWindow.isDestroyed()) {
    playerWindow.webContents.send('playback:stop');
  }
  return true;
}

function createApplicationActionRunner() {
  const inputAdapter = process.platform === 'win32'
    ? createWindowsActionAdapter()
    : {};
  const adapter = {
    ...inputAdapter,
    async open(target) {
      const error = await shell.openPath(target);
      if (error) throw new Error(error);
      return true;
    },
    async website(url) {
      await shell.openExternal(url);
      return true;
    },
    hotkey(value, context) {
      if (typeof inputAdapter.hotkey !== 'function') {
        throw new Error('Aksi kirim hotkey hanya tersedia di Windows.');
      }
      return runSerializedInput(
        () => withGlobalHotkeysSuspended(() => inputAdapter.hotkey(value, context)),
        context.signal
      );
    },
    text(value, context) {
      if (typeof inputAdapter.text !== 'function') {
        throw new Error('Aksi ketik teks hanya tersedia di Windows.');
      }
      return runSerializedInput(
        () => withGlobalHotkeysSuspended(() => inputAdapter.text(value, context)),
        context.signal
      );
    },
    multimedia(value, context) {
      if (typeof inputAdapter.multimedia !== 'function') {
        throw new Error('Aksi multimedia hanya tersedia di Windows.');
      }
      return runSerializedInput(
        () => inputAdapter.multimedia(value, context),
        context.signal
      );
    }
  };

  return createActionRunner({
    adapter,
    playMedia(action, context) {
      const mediaPad = store.getPad(action.padId);
      if (!mediaPad || !['audio', 'video'].includes(mediaPad.type)) {
        throw new Error('Media yang dirujuk aksi tidak ditemukan.');
      }
      const executionPad = {
        ...mediaPad,
        ...(action.playbackMode ? { playbackMode: action.playbackMode } : {}),
        ...(action.volume !== undefined ? { volume: action.volume } : {})
      };
      const result = triggerMediaPad(
        executionPad,
        context.metadata.source === 'hotkey' ? 'hotkey' : 'app'
      );
      if (!result.ok) throw new Error(result.error);
      return result;
    },
    switchDeck(deckId) {
      const deck = store.setActiveDeck(deckId);
      registerGlobalHotkeys();
      return deck;
    }
  });
}

function runSerializedInput(callback, signal) {
  const pending = inputActionQueue
    .catch(() => {})
    .then(() => {
      if (isQuitting) {
        const error = new Error('AERO DECK sedang ditutup.');
        error.name = 'AbortError';
        throw error;
      }
      if (signal?.aborted) {
        const reason = signal.reason;
        if (reason instanceof Error) throw reason;
        const error = new Error('Aksi input dibatalkan.');
        error.name = 'AbortError';
        throw error;
      }
      return callback();
    });
  inputActionQueue = pending.catch(() => {});
  return pending;
}

async function withGlobalHotkeysSuspended(callback) {
  const firstSuspension = globalHotkeySuspensionDepth === 0;
  globalHotkeySuspensionDepth += 1;
  if (firstSuspension && store) {
    registerGlobalHotkeys();
  }
  try {
    return await callback();
  } finally {
    globalHotkeySuspensionDepth = Math.max(0, globalHotkeySuspensionDepth - 1);
    if (globalHotkeySuspensionDepth === 0 && store && !isQuitting) {
      registerGlobalHotkeys();
    }
  }
}

function resetPlaybackStatuses() {
  cancelPendingPlayback();
  if (!store) return;
  for (const pad of store.snapshot().pads) {
    if (!['audio', 'video'].includes(pad.type)) continue;
    sendPlaybackStatus({
      id: pad.id,
      state: 'stopped',
      instanceId: '',
      activeCount: 0,
      currentTime: 0,
      duration: 0
    });
  }
}

function stopPadPlayback(id) {
  cancelPendingPlayback(id);
  if (playerWindow && !playerWindow.isDestroyed()) {
    playerWindow.webContents.send('playback:stop', { id });
  }
}

function applyLoginItemSettings(options = {}) {
  const strict = options.strict === true;
  const settings = store?.snapshot().settings;
  const supported = process.platform === 'win32' && app.isPackaged;
  if (!settings || !supported) {
    return {
      supported: process.platform === 'win32',
      applied: false
    };
  }

  try {
    app.setLoginItemSettings({
      openAtLogin: Boolean(settings.launchAtLogin),
      path: process.execPath,
      args: settings.startMinimized ? ['--hidden'] : []
    });
    const appliedSettings = app.getLoginItemSettings({
      path: process.execPath,
      args: settings.startMinimized ? ['--hidden'] : []
    });
    if (Boolean(appliedSettings.openAtLogin) !== Boolean(settings.launchAtLogin)) {
      throw new Error('Windows tidak menerapkan perubahan startup.');
    }
    return {
      supported: true,
      applied: true
    };
  } catch (error) {
    if (strict) {
      throw new Error('Pengaturan startup Windows tidak dapat diterapkan.', {
        cause: error
      });
    }
    return {
      supported: true,
      applied: false
    };
  }
}

async function checkForUpdates() {
  const currentVersion = app.getVersion();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPDATE_CHECK_TIMEOUT_MS);
  let response;
  try {
    response = await net.fetch(LATEST_RELEASE_API, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': `AERO-DECK/${currentVersion}`
      },
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Pemeriksaan update melewati batas waktu.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    throw new Error('Pemeriksaan update belum dapat tersambung ke GitHub.');
  }
  const release = await response.json();
  const latestVersion = String(release.tag_name || '').replace(/^v/i, '');
  if (!latestVersion) {
    throw new Error('Versi rilis terbaru tidak dapat dibaca.');
  }
  return {
    currentVersion,
    latestVersion,
    hasUpdate: isNewerVersion(latestVersion, currentVersion),
    url: typeof release.html_url === 'string' ? release.html_url : RELEASES_URL,
    publishedAt: typeof release.published_at === 'string' ? release.published_at : ''
  };
}

function writeJsonAtomic(filePath, value) {
  const tempPath = `${filePath}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    fs.renameSync(tempPath, filePath);
  } finally {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

async function exportLibraryBackup() {
  const date = new Date().toISOString().slice(0, 10);
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export backup AERO DECK',
    defaultPath: `AERO-DECK-backup-${date}.aerodeck.json`,
    filters: [
      { name: 'Backup AERO DECK', extensions: ['json'] }
    ]
  });
  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  const backup = store.exportBackup();
  writeJsonAtomic(result.filePath, {
    format: 'aero-deck-backup',
    appVersion: app.getVersion(),
    exportedAt: new Date().toISOString(),
    ...backup
  });
  return {
    canceled: false,
    filePath: result.filePath
  };
}

async function importLibraryBackup() {
  const selected = await dialog.showOpenDialog(mainWindow, {
    title: 'Import backup AERO DECK',
    properties: ['openFile'],
    filters: [
      { name: 'Backup AERO DECK', extensions: ['json'] }
    ]
  });
  if (selected.canceled || !selected.filePaths[0]) {
    return { canceled: true };
  }

  const filePath = selected.filePaths[0];
  const stats = fs.statSync(filePath);
  if (stats.size > 10 * 1024 * 1024) {
    throw new Error('File backup terlalu besar atau bukan backup AERO DECK.');
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    throw new Error('File backup bukan JSON yang valid.');
  }
  if (parsed?.format && parsed.format !== 'aero-deck-backup') {
    throw new Error('Format backup tidak dikenali.');
  }
  const importedPads = Array.isArray(parsed?.pads) ? parsed.pads : [];
  const importedActionCount = importedPads.filter(
    (pad) => pad?.type === 'action'
  ).length;

  const confirmation = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    title: 'Ganti seluruh library?',
    message: 'Import akan mengganti deck, pad, dan pengaturan saat ini.',
    detail: [
      `Backup ini berisi ${importedActionCount} action pad yang dapat membuka atau menutup aplikasi, mengetik, dan mengirim hotkey.`,
      'Import hanya file dari sumber yang benar-benar kamu percaya.',
      'AERO DECK akan membuat salinan cadangan otomatis. File media asli tidak akan diubah.'
    ].join('\n\n'),
    buttons: ['Batal', 'Import dan ganti'],
    defaultId: 0,
    cancelId: 0,
    noLink: true
  });
  if (confirmation.response !== 1) {
    return { canceled: true };
  }

  stopAllPlayback();
  actionRunner.resetToggleState();
  const snapshot = store.importBackup(parsed);
  applyLoginItemSettings();
  registerGlobalHotkeys();
  return {
    canceled: false,
    filePath,
    deckCount: snapshot.decks.length,
    padCount: snapshot.pads.length
  };
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
  if (
    message.pad.type === 'audio' &&
    message.pad.playbackMode === 'exclusive' &&
    playerWindow.isVisible()
  ) {
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
  const activeLabel = captureMode || globalHotkeySuspensionDepth > 0
    ? 'dijeda sementara'
    : (enabled ? 'aktif' : 'nonaktif');
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
      click: stopAllPlayback
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
    stopAllRegistration,
    captureMode,
    hotkeysSuspended: globalHotkeySuspensionDepth > 0,
    appInfo: {
      version: app.getVersion(),
      dataPath: store.filePath,
      platform: process.platform,
      packaged: app.isPackaged,
      loginItemSupported: process.platform === 'win32'
    }
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
  if (isQuitting) return;
  registrationState = Object.create(null);
  const globalHotkeysSuspended = globalHotkeySuspensionDepth > 0;
  stopAllRegistration = {
    registered: false,
    reason: captureMode
      ? 'capture'
      : (globalHotkeysSuspended ? 'suspended' : 'unavailable')
  };

  const snapshot = store.snapshot();
  const activePads = snapshot.pads.filter(
    (pad) => pad.deckId === snapshot.settings.activeDeckId
  );

  if (!captureMode && !globalHotkeysSuspended && snapshot.settings.stopAllHotkey) {
    const accelerator = toElectronAccelerator(snapshot.settings.stopAllHotkey);
    let registered = false;
    try {
      registered = Boolean(
        accelerator && globalShortcut.register(accelerator, stopAllPlayback)
      );
    } catch {
      registered = false;
    }
    stopAllRegistration = {
      registered,
      reason: registered ? '' : 'unavailable'
    };
  }

  if (!snapshot.settings.globalHotkeysEnabled || captureMode || globalHotkeysSuspended) {
    for (const pad of activePads) {
      if (pad.hotkey) {
        registrationState[pad.id] = {
          registered: false,
          reason: captureMode
            ? 'capture'
            : (globalHotkeysSuspended ? 'suspended' : 'disabled')
        };
      }
    }
    sendState();
    return;
  }

  for (const pad of activePads) {
    if (!pad.hotkey) {
      continue;
    }

    const accelerator = toElectronAccelerator(pad.hotkey);
    let registered = false;
    try {
      registered = Boolean(
        accelerator && globalShortcut.register(accelerator, () => {
          void triggerPad(pad.id, 'hotkey');
        })
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

function triggerMediaPad(pad, source = 'app') {
  if (!fs.existsSync(pad.mediaPath)) {
    missingPadIds.add(pad.id);
    sendState();
    sendPlaybackStatus({
      id: pad.id,
      state: 'error',
      activeCount: 0,
      error: 'File sumber tidak ditemukan.'
    });
    return { ok: false, reported: true, error: 'File sumber tidak ditemukan.' };
  }
  if (!playerWindow || playerWindow.isDestroyed()) {
    return { ok: false, error: 'Player belum siap.' };
  }

  const publicPad = serializePad(pad);
  const message = { pad: publicPad, source };
  const queued = queueOrDispatchPlayback(message);

  if (missingPadIds.delete(pad.id)) {
    sendState();
  }
  return { ok: true, queued };
}

async function triggerActionPad(pad, source) {
  if (activeActionCounts.has(pad.id)) {
    return {
      ok: false,
      error: 'Aksi ini masih berjalan.'
    };
  }
  if (
    ['open', 'close'].includes(pad.action?.type)
    && !fs.existsSync(pad.action.target)
  ) {
    sendState();
    sendPlaybackStatus({
      id: pad.id,
      state: 'error',
      activeCount: 0,
      currentTime: 0,
      duration: 0,
      error: 'Target aplikasi, file, atau folder tidak ditemukan.'
    });
    return {
      ok: false,
      reported: true,
      error: 'Target aplikasi, file, atau folder tidak ditemukan.'
    };
  }
  const activeCount = (activeActionCounts.get(pad.id) || 0) + 1;
  activeActionCounts.set(pad.id, activeCount);
  sendPlaybackStatus({
    id: pad.id,
    state: 'loading',
    activeCount,
    currentTime: 0,
    duration: 0
  });

  let finalState = 'stopped';
  let finalError = '';
  try {
    const result = await actionRunner.run(pad.action, {
      metadata: {
        rootPadId: pad.id,
        source
      }
    });
    return { ok: true, result };
  } catch (error) {
    if (error?.name === 'AbortError') {
      return {
        ok: false,
        canceled: true,
        reported: true,
        error: 'Aksi dibatalkan.'
      };
    }
    const message = error instanceof Error
      ? error.message.slice(0, 240)
      : 'Aksi tidak dapat dijalankan.';
    finalState = 'error';
    finalError = message;
    return { ok: false, reported: true, error: message };
  } finally {
    const remaining = Math.max(0, (activeActionCounts.get(pad.id) || 1) - 1);
    if (remaining) activeActionCounts.set(pad.id, remaining);
    else activeActionCounts.delete(pad.id);
    sendPlaybackStatus({
      id: pad.id,
      state: remaining ? 'loading' : finalState,
      activeCount: remaining,
      currentTime: 0,
      duration: 0,
      error: remaining ? '' : finalError
    });
  }
}

async function triggerPad(id, source = 'app') {
  const pad = store.getPad(id);
  if (!pad) {
    return { ok: false, error: 'Pad tidak ditemukan.' };
  }
  if (pad.deckId !== store.snapshot().settings.activeDeckId) {
    return { ok: false, error: 'Pad tidak berada di deck yang sedang aktif.' };
  }
  if (pad.type === 'action') {
    return triggerActionPad(pad, source);
  }
  return triggerMediaPad(pad, source);
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
  const requestedType = input?.type ?? existing?.type;
  if (requestedType === 'action') {
    return {
      ...input,
      type: 'action'
    };
  }
  const requestedPath = input?.mediaPath ?? existing?.mediaPath;
  const inspected = inspectMediaFile(requestedPath);
  if (requestedType !== inspected.type) {
    throw new Error('Jenis media tidak sesuai dengan file yang dipilih.');
  }
  return {
    ...input,
    mediaPath: inspected.path,
    type: inspected.type
  };
}

function actionReferencesMedia(action, padId) {
  if (!action || typeof action !== 'object') return false;
  if (action.type === 'media' && action.padId === padId) return true;
  return Array.isArray(action.actions)
    && action.actions.some((child) => actionReferencesMedia(child, padId));
}

function cancelRunsAffectedByPad(padId, snapshot) {
  actionRunner.cancelRootPad(padId);
  for (const pad of snapshot.pads) {
    if (
      pad.type === 'action'
      && actionReferencesMedia(pad.action, padId)
    ) {
      actionRunner.cancelRootPad(pad.id);
    }
  }
  actionRunner.resetToggleStateForRoot(padId);
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

  dashboardHandler('library:select-open-target', async (targetKind) => {
    const chooseFolder = targetKind === 'folder';
    const result = await dialog.showOpenDialog(mainWindow, {
      title: chooseFolder
        ? 'Pilih folder yang akan dibuka'
        : 'Pilih aplikasi atau file yang akan dibuka',
      properties: [chooseFolder ? 'openDirectory' : 'openFile']
    });
    if (result.canceled || !result.filePaths[0]) {
      return null;
    }
    const targetPath = path.resolve(result.filePaths[0]);
    if (/^(?:\\\\|\/\/)/.test(targetPath)) {
      throw new Error('Target jaringan atau device path tidak didukung.');
    }
    return {
      path: targetPath,
      name: path.basename(targetPath),
      kind: chooseFolder ? 'folder' : 'file'
    };
  });

  dashboardHandler('library:inspect-file', (filePath) => inspectMediaFile(filePath));

  dashboardHandler('library:add-pad', (input) => {
    const pad = store.addPad(validatePadMutation(input));
    registerGlobalHotkeys();
    return serializePad(pad);
  });

  dashboardHandler('library:update-pad', (id, input) => {
    const previousSnapshot = store.snapshot();
    const pad = store.updatePad(id, validatePadMutation(input, id));
    cancelRunsAffectedByPad(id, previousSnapshot);
    stopPadPlayback(id);
    registerGlobalHotkeys();
    return serializePad(pad);
  });

  dashboardHandler('library:delete-pad', (id) => {
    const previousSnapshot = store.snapshot();
    const pad = store.deletePad(id);
    cancelRunsAffectedByPad(id, previousSnapshot);
    stopPadPlayback(id);
    registerGlobalHotkeys();
    return pad;
  });

  dashboardHandler('library:add-deck', (title) => {
    const deck = store.addDeck(title);
    registerGlobalHotkeys();
    return deck;
  });

  dashboardHandler('library:rename-deck', (id, title) => {
    const deck = store.renameDeck(id, title);
    sendState();
    return deck;
  });

  dashboardHandler('library:delete-deck', (id) => {
    const deck = store.deleteDeck(id);
    stopAllPlayback();
    actionRunner.resetToggleState();
    registerGlobalHotkeys();
    return deck;
  });

  dashboardHandler('library:set-active-deck', (id) => {
    const deck = store.setActiveDeck(id);
    stopAllPlayback();
    registerGlobalHotkeys();
    return deck;
  });

  dashboardHandler('library:reorder-pads', (deckId, orderedIds) => {
    const pads = store.reorderPads(deckId, orderedIds);
    sendState();
    return pads;
  });

  dashboardHandler('library:set-global-hotkeys', (enabled) => {
    store.setGlobalHotkeysEnabled(enabled);
    registerGlobalHotkeys();
    return getPublicState();
  });

  dashboardHandler('library:update-settings', (patch) => {
    const previousSettings = store.snapshot().settings;
    store.updateSettings(patch);
    try {
      if (
        Object.hasOwn(patch || {}, 'launchAtLogin') ||
        Object.hasOwn(patch || {}, 'startMinimized')
      ) {
        applyLoginItemSettings({ strict: true });
      }
    } catch (error) {
      store.updateSettings(previousSettings);
      applyLoginItemSettings();
      registerGlobalHotkeys();
      throw error;
    }
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
    const targetPath = pad?.type === 'action' && ['open', 'close'].includes(pad.action?.type)
      ? pad.action.target
      : pad?.mediaPath;
    if (!targetPath || !fs.existsSync(targetPath)) {
      throw new Error('File sumber tidak ditemukan.');
    }
    shell.showItemInFolder(targetPath);
    return true;
  });

  dashboardHandler('library:export-backup', () => exportLibraryBackup());
  dashboardHandler('library:import-backup', () => importLibraryBackup());
  dashboardHandler('library:check-for-updates', () => checkForUpdates());
  dashboardHandler('library:open-data-folder', () => {
    shell.showItemInFolder(store.filePath);
    return true;
  });
  dashboardHandler('library:open-releases', async () => {
    await shell.openExternal(RELEASES_URL);
    return true;
  });

  dashboardHandler('playback:play-pad', (id) => triggerPad(id, 'app'));
  dashboardHandler('playback:stop-all', () => {
    return stopAllPlayback();
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
      instanceId: typeof status.instanceId === 'string'
        ? status.instanceId.slice(0, 96)
        : '',
      activeCount: Math.max(0, Math.min(1000, Number(status.activeCount) || 0)),
      currentTime: Number(status.currentTime) || 0,
      duration: Number(status.duration) || 0,
      error: typeof status.error === 'string' ? status.error.slice(0, 240) : ''
    });
    const pad = store.getPad(status.id);
    if (
      pad?.type === 'video' &&
      status.state === 'loading' &&
      Number(status.activeCount) > 0
    ) {
      presentVideoWindow(status.source === 'hotkey' ? 'hotkey' : 'app');
    }
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
    if (smokeTestEnabled) {
      setTimeout(() => failSmokeTest('batas waktu 20 detik terlampaui.'), 20_000);
    }
    store = new PadStore(path.join(app.getPath('userData'), 'aero-deck-library.json'));
    store.load();
    actionRunner = createApplicationActionRunner();
    applyLoginItemSettings();
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
  actionRunner?.cancelAll();
  cancelPendingPlayback();
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // The tray owns the app lifecycle on Windows.
});
