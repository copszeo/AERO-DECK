'use strict';

const api = window.aeroDeck;

const ui = {
  activeDeckTitle: document.querySelector('#activeDeckTitle'),
  actionBuilderLimit: document.querySelector('#actionBuilderLimit'),
  actionColorOptions: document.querySelector('#actionColorOptions'),
  actionEditorModal: document.querySelector('#actionEditorModal'),
  actionEditorTitle: document.querySelector('#actionEditorTitle'),
  actionForm: document.querySelector('#actionForm'),
  actionFormError: document.querySelector('#actionFormError'),
  actionHotkeyHelp: document.querySelector('#actionHotkeyHelp'),
  actionHotkeyRecorder: document.querySelector('#actionHotkeyRecorder'),
  actionHotkeyValue: document.querySelector('#actionHotkeyValue'),
  actionRootFields: document.querySelector('#actionRootFields'),
  actionSingleKeyWarning: document.querySelector('#actionSingleKeyWarning'),
  actionStepList: document.querySelector('#actionStepList'),
  actionTitleInput: document.querySelector('#actionTitleInput'),
  actionTypeHelp: document.querySelector('#actionTypeHelp'),
  actionTypeSelect: document.querySelector('#actionTypeSelect'),
  addActionButton: document.querySelector('#addActionButton'),
  addActionStepButton: document.querySelector('#addActionStepButton'),
  addDeckButton: document.querySelector('#addDeckButton'),
  addPadButton: document.querySelector('#addPadButton'),
  appDataPath: document.querySelector('#appDataPath'),
  appVersion: document.querySelector('#appVersion'),
  automationBuilder: document.querySelector('#automationBuilder'),
  cancelActionEditorButton: document.querySelector('#cancelActionEditorButton'),
  cancelDeckButton: document.querySelector('#cancelDeckButton'),
  cancelDeleteButton: document.querySelector('#cancelDeleteButton'),
  cancelEditorButton: document.querySelector('#cancelEditorButton'),
  checkUpdatesButton: document.querySelector('#checkUpdatesButton'),
  clearHotkeyButton: document.querySelector('#clearHotkeyButton'),
  clearActionHotkeyButton: document.querySelector('#clearActionHotkeyButton'),
  clearStopAllHotkeyButton: document.querySelector('#clearStopAllHotkeyButton'),
  closeActionEditorButton: document.querySelector('#closeActionEditorButton'),
  closeDeckModalButton: document.querySelector('#closeDeckModalButton'),
  closeEditorButton: document.querySelector('#closeEditorButton'),
  closeGuideButton: document.querySelector('#closeGuideButton'),
  closeSettingsButton: document.querySelector('#closeSettingsButton'),
  colorOptions: document.querySelector('#colorOptions'),
  confirmDeleteButton: document.querySelector('#confirmDeleteButton'),
  confirmMessage: document.querySelector('#confirmMessage'),
  confirmModal: document.querySelector('#confirmModal'),
  confirmTitle: document.querySelector('#confirmTitle'),
  deckForm: document.querySelector('#deckForm'),
  deckGrid: document.querySelector('#deckGrid'),
  deckModal: document.querySelector('#deckModal'),
  deckModalDescription: document.querySelector('#deckModalDescription'),
  deckModalTitle: document.querySelector('#deckModalTitle'),
  deckTabs: document.querySelector('#deckTabs'),
  deckTitleInput: document.querySelector('#deckTitleInput'),
  deleteDeckButton: document.querySelector('#deleteDeckButton'),
  doneSettingsButton: document.querySelector('#doneSettingsButton'),
  dropOverlay: document.querySelector('#dropOverlay'),
  editorModal: document.querySelector('#editorModal'),
  editorTitle: document.querySelector('#editorTitle'),
  emptyAddActionButton: document.querySelector('#emptyAddActionButton'),
  emptyAddButton: document.querySelector('#emptyAddButton'),
  emptyState: document.querySelector('#emptyState'),
  exportBackupButton: document.querySelector('#exportBackupButton'),
  footerStopButton: document.querySelector('#footerStopButton'),
  globalHotkeyToggle: document.querySelector('#globalHotkeyToggle'),
  globalStatusMain: document.querySelector('#globalStatusMain'),
  globalStatusSide: document.querySelector('#globalStatusSide'),
  guidePanel: document.querySelector('#guidePanel'),
  hotkeyHealth: document.querySelector('#hotkeyHealth'),
  hotkeyHelp: document.querySelector('#hotkeyHelp'),
  hotkeyRecorder: document.querySelector('#hotkeyRecorder'),
  hotkeyValue: document.querySelector('#hotkeyValue'),
  importBackupButton: document.querySelector('#importBackupButton'),
  launchAtLoginToggle: document.querySelector('#launchAtLoginToggle'),
  loopInput: document.querySelector('#loopInput'),
  mediaFileButton: document.querySelector('#mediaFileButton'),
  nowPlaying: document.querySelector('#nowPlaying'),
  nowPlayingArt: document.querySelector('#nowPlayingArt'),
  nowPlayingTitle: document.querySelector('#nowPlayingTitle'),
  nowProgressBar: document.querySelector('#nowProgressBar'),
  nowTime: document.querySelector('#nowTime'),
  openDataFolderButton: document.querySelector('#openDataFolderButton'),
  openPlayerGuide: document.querySelector('#openPlayerGuide'),
  openReleasesButton: document.querySelector('#openReleasesButton'),
  openSettingsButton: document.querySelector('#openSettingsButton'),
  padForm: document.querySelector('#padForm'),
  padTitleInput: document.querySelector('#padTitleInput'),
  playbackModeOptions: document.querySelector('#playbackModeOptions'),
  registeredSummary: document.querySelector('#registeredSummary'),
  renameDeckButton: document.querySelector('#renameDeckButton'),
  saveDeckButton: document.querySelector('#saveDeckButton'),
  saveActionButton: document.querySelector('#saveActionButton'),
  savePadButton: document.querySelector('#savePadButton'),
  searchInput: document.querySelector('#searchInput'),
  selectedFileMeta: document.querySelector('#selectedFileMeta'),
  selectedFileName: document.querySelector('#selectedFileName'),
  settingsModal: document.querySelector('#settingsModal'),
  sidebarPadCount: document.querySelector('#sidebarPadCount'),
  singleKeyWarning: document.querySelector('#singleKeyWarning'),
  startMinimizedToggle: document.querySelector('#startMinimizedToggle'),
  stopAllButton: document.querySelector('#stopAllButton'),
  stopAllHotkeyHelp: document.querySelector('#stopAllHotkeyHelp'),
  stopAllHotkeyRecorder: document.querySelector('#stopAllHotkeyRecorder'),
  stopAllHotkeyValue: document.querySelector('#stopAllHotkeyValue'),
  toastStack: document.querySelector('#toastStack'),
  totalActions: document.querySelector('#totalActions'),
  totalAudio: document.querySelector('#totalAudio'),
  totalVideo: document.querySelector('#totalVideo'),
  visiblePadSummary: document.querySelector('#visiblePadSummary'),
  volumeInput: document.querySelector('#volumeInput'),
  volumeValue: document.querySelector('#volumeValue')
};

const colors = ['#7c5cff', '#1fc6a4', '#ff6b8a', '#ffad42', '#4c8dff', '#b861e8'];
const playbackModes = new Set(['exclusive', 'restart', 'toggle', 'overlap']);
const automationTypes = new Set(['sequence', 'parallel', 'random', 'toggle']);
const allowedWebsiteProtocols = new Set([
  'discord:',
  'http:',
  'https:',
  'mailto:',
  'obsidian:',
  'spotify:',
  'steam:'
]);
const actionRootTypes = new Set([
  'open',
  'close',
  'website',
  'hotkey',
  'text',
  'multimedia',
  'switch-deck',
  ...automationTypes
]);
const actionChildTypes = new Set([
  'media',
  'open',
  'close',
  'website',
  'hotkey',
  'text',
  'multimedia',
  'switch-deck',
  'delay'
]);
const actionTypeMeta = Object.freeze({
  open: { label: 'Buka', summary: 'Buka file, aplikasi, atau folder' },
  close: { label: 'Tutup', summary: 'Tutup aplikasi yang dipilih' },
  website: { label: 'Website / URI', summary: 'Buka alamat web atau aplikasi' },
  hotkey: { label: 'Hotkey', summary: 'Kirim shortcut keyboard' },
  text: { label: 'Teks', summary: 'Ketik teks otomatis' },
  multimedia: { label: 'Media OS', summary: 'Kontrol pemutar media Windows' },
  'switch-deck': { label: 'Pindah deck', summary: 'Aktifkan deck lain' },
  sequence: { label: 'Rangkaian', summary: 'Jalankan langkah secara berurutan' },
  parallel: { label: 'Bersamaan', summary: 'Jalankan semua langkah bersamaan' },
  random: { label: 'Acak', summary: 'Jalankan salah satu pilihan' },
  toggle: { label: 'Beralih', summary: 'Bergantian antara dua keadaan' },
  media: { label: 'Media', summary: 'Jalankan pad media' },
  delay: { label: 'Jeda', summary: 'Tunggu sebelum langkah berikutnya' }
});
const multimediaCommands = Object.freeze({
  previous: 'Track sebelumnya',
  'play-pause': 'Putar / jeda',
  next: 'Track berikutnya',
  stop: 'Hentikan media',
  mute: 'Mute / unmute',
  'volume-up': 'Naikkan volume',
  'volume-down': 'Turunkan volume'
});
const appShell = document.querySelector('.app-shell');

let library = normalizeState();
let editor = emptyEditor();
let actionEditor = emptyActionEditor();
let deckEditorMode = 'add';
let pendingConfirmation = null;
let playback = new Map();
let activePlaybackIds = new Set();
let actionErrorMessages = new Map();
let actionErrorTimers = new Map();
let playbackFocusId = '';
let draggedPadId = '';
let dragDepth = 0;
let settingsRecording = false;
let settingsHotkeyBeforeRecording = '';
let returnFocus = null;

function normalizeState(nextState = {}) {
  const settings = {
    globalHotkeysEnabled: true,
    stopAllHotkey: '',
    launchAtLogin: false,
    startMinimized: false,
    activeDeckId: '',
    ...(nextState.settings || {})
  };
  const decks = Array.isArray(nextState.decks) ? nextState.decks : [];

  if (!settings.activeDeckId && decks[0]) {
    settings.activeDeckId = decks[0].id;
  }

  return {
    pads: Array.isArray(nextState.pads) ? nextState.pads : [],
    decks,
    registrations: nextState.registrations || {},
    stopAllRegistration: nextState.stopAllRegistration || null,
    settings,
    captureMode: Boolean(nextState.captureMode),
    hotkeysSuspended: Boolean(nextState.hotkeysSuspended),
    appInfo: nextState.appInfo || {}
  };
}

function emptyEditor() {
  return {
    id: '',
    deckId: '',
    type: 'audio',
    file: null,
    hotkey: '',
    color: colors[0],
    playbackMode: 'exclusive',
    recording: false
  };
}

function createActionId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `aero-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function firstMediaPadId() {
  return activePads().find((pad) => pad.type === 'audio' || pad.type === 'video')?.id || '';
}

function firstDeckId() {
  return activeDeckId() || library.decks[0]?.id || '';
}

function preferredChildActionType() {
  return firstMediaPadId() ? 'media' : 'delay';
}

function actionStepLimit(type) {
  return type === 'parallel' ? 8 : 32;
}

function defaultActionNode(type = 'open') {
  const safeType = actionChildTypes.has(type) || actionRootTypes.has(type) ? type : 'open';
  const base = {
    type: safeType,
    _uiKey: createActionId()
  };

  if (safeType === 'media') {
    return { ...base, padId: firstMediaPadId() };
  }
  if (safeType === 'open') {
    return { ...base, target: '', _openKind: 'file' };
  }
  if (safeType === 'close') {
    return { ...base, target: '', force: false, _openKind: 'file' };
  }
  if (safeType === 'website') {
    return { ...base, url: 'https://' };
  }
  if (safeType === 'hotkey') {
    return { ...base, hotkey: '' };
  }
  if (safeType === 'text') {
    return { ...base, text: '', pressEnter: false };
  }
  if (safeType === 'multimedia') {
    return { ...base, command: 'play-pause' };
  }
  if (safeType === 'switch-deck') {
    return { ...base, deckId: firstDeckId() };
  }
  if (safeType === 'delay') {
    return { ...base, ms: 1000 };
  }
  if (safeType === 'toggle') {
    return {
      ...base,
      id: createActionId(),
      actions: [
        defaultActionNode(preferredChildActionType()),
        defaultActionNode(preferredChildActionType())
      ]
    };
  }
  return {
    ...base,
    actions: [defaultActionNode(preferredChildActionType())]
  };
}

function hydrateActionNode(input, fallbackType = 'open') {
  const source = input && typeof input === 'object' ? input : {};
  const allowed = actionRootTypes.has(source.type) || actionChildTypes.has(source.type);
  const type = allowed ? source.type : fallbackType;
  const node = {
    ...source,
    type,
    _uiKey: createActionId()
  };

  if (type === 'open' || type === 'close') {
    node.target = String(source.target || '');
    node._openKind = 'file';
  }
  if (type === 'close') {
    node.force = Boolean(source.force);
  }
  if (type === 'toggle' && !node.id) {
    node.id = createActionId();
  }
  if (automationTypes.has(type)) {
    const sourceActions = Array.isArray(source.actions) ? source.actions : [];
    node.actions = sourceActions.map((child) => hydrateActionNode(child, 'media'));
    const requiredLength = type === 'toggle' ? 2 : 1;
    while (node.actions.length < requiredLength) {
      node.actions.push(defaultActionNode(preferredChildActionType()));
    }
    if (type === 'toggle') {
      node.actions = node.actions.slice(0, 2);
    } else {
      node.actions = node.actions.slice(0, actionStepLimit(type));
    }
  }
  return node;
}

function emptyActionEditor() {
  return {
    id: '',
    deckId: '',
    hotkey: '',
    color: colors[0],
    recording: false,
    action: defaultActionNode('open')
  };
}

function svg(paths) {
  const namespace = 'http://www.w3.org/2000/svg';
  const element = document.createElementNS(namespace, 'svg');
  element.setAttribute('viewBox', '0 0 24 24');
  element.setAttribute('aria-hidden', 'true');
  for (const pathData of paths) {
    const path = document.createElementNS(namespace, pathData.tag || 'path');
    for (const [name, value] of Object.entries(pathData)) {
      if (name !== 'tag') path.setAttribute(name, value);
    }
    element.append(path);
  }
  return element;
}

function audioIcon() {
  return svg([{ d: 'M5 9v6M9 6v12M13 3v18M17 7v10M21 10v4' }]);
}

function videoIcon() {
  return svg([
    { tag: 'rect', x: '3', y: '5', width: '14', height: '14', rx: '3' },
    { d: 'm17 10 4-2v8l-4-2' }
  ]);
}

function actionIcon(type = '') {
  if (type === 'open') {
    return svg([
      { d: 'M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z' },
      { d: 'm10 12 2-2 2 2M12 10v5' }
    ]);
  }
  if (type === 'close') {
    return svg([
      { tag: 'rect', x: '4', y: '4', width: '16', height: '16', rx: '3' },
      { d: 'm9 9 6 6M15 9l-6 6' }
    ]);
  }
  if (type === 'website') {
    return svg([
      { tag: 'circle', cx: '12', cy: '12', r: '9' },
      { d: 'M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18' }
    ]);
  }
  if (type === 'hotkey') {
    return svg([
      { tag: 'rect', x: '3', y: '6', width: '18', height: '13', rx: '3' },
      { d: 'M7 10h.01M11 10h.01M15 10h.01M7 14h.01M11 14h6' }
    ]);
  }
  if (type === 'text') {
    return svg([{ d: 'M5 5h14M12 5v14M8 19h8' }]);
  }
  if (type === 'multimedia') {
    return svg([
      { d: 'm8 6 10 6-10 6Z' },
      { d: 'M4 6v12' }
    ]);
  }
  if (type === 'switch-deck') {
    return svg([
      { tag: 'rect', x: '3', y: '4', width: '18', height: '16', rx: '3' },
      { d: 'm8 12 3-3v2h5v2h-5v2Z' }
    ]);
  }
  if (type === 'sequence') {
    return svg([
      { d: 'M7 6h13M7 12h13M7 18h13' },
      { d: 'M3.5 6h.01M3.5 12h.01M3.5 18h.01' }
    ]);
  }
  if (type === 'parallel') {
    return svg([
      { d: 'M5 5v14M19 5v14M5 8h14M5 16h14' },
      { d: 'm9 12 2-2v4Zm6 0-2-2v4Z' }
    ]);
  }
  if (type === 'random') {
    return svg([
      { d: 'M4 7h3c4 0 6 10 10 10h3M17 14l3 3-3 3M4 17h3c1.5 0 2.7-1.4 3.8-3M13 8c1.1-.7 2.3-1 4.2-1H20M17 4l3 3-3 3' }
    ]);
  }
  if (type === 'toggle') {
    return svg([
      { d: 'M7 7h10l-2.5-2.5M17 17H7l2.5 2.5' },
      { d: 'm17 7-2.5 2.5M7 17l2.5-2.5' }
    ]);
  }
  return svg([{ d: 'm13 2-7 11h6l-1 9 7-12h-6Z' }]);
}

function editIcon() {
  return svg([{ d: 'm14 5 5 5M4 20l3.5-.8L18 8.7a2 2 0 0 0-2.7-2.7L4.8 16.5Z' }]);
}

function folderIcon() {
  return svg([
    { d: 'M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z' },
    { d: 'M9 13h6M12 10v6' }
  ]);
}

function trashIcon() {
  return svg([
    { d: 'M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5' }
  ]);
}

function gripIcon() {
  return svg([
    { d: 'M9 7h.01M15 7h.01M9 12h.01M15 12h.01M9 17h.01M15 17h.01' }
  ]);
}

function cleanError(error) {
  const message = String(error?.message || error || 'Terjadi kesalahan.');
  return message
    .replace(/^Error invoking remote method '[^']+': Error:\s*/i, '')
    .replace(/^Error:\s*/i, '');
}

function ensureSuccess(result, fallbackMessage) {
  if (result?.ok === false) {
    throw new Error(result.error || fallbackMessage);
  }
  return result;
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast${type === 'error' ? ' is-error' : ''}`;

  const icon = document.createElement('span');
  icon.className = 'toast-icon';
  icon.textContent = type === 'error' ? '!' : '✓';

  const copy = document.createElement('span');
  copy.textContent = message;
  toast.append(icon, copy);
  ui.toastStack.append(toast);

  window.setTimeout(() => toast.remove(), 3600);
}

function formatTime(seconds) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = Math.floor(safeSeconds % 60);
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function localHotkeyFromEvent(event) {
  if (event.repeat) return '';

  let key = event.key;
  if (/^Key[A-Z]$/.test(event.code)) key = event.code.slice(3);
  if (/^Digit[0-9]$/.test(event.code)) key = event.code.slice(5);
  if (event.code === 'Space' || key === ' ') key = 'Space';
  if (key.length === 1 && /[a-z0-9]/i.test(key)) key = key.toUpperCase();
  if (!/^[A-Z0-9]$/.test(key) && !/^F([1-9]|1[0-2])$/.test(key) && key !== 'Space') {
    return '';
  }

  return [
    event.ctrlKey ? 'Ctrl' : '',
    event.altKey ? 'Alt' : '',
    event.shiftKey ? 'Shift' : '',
    event.metaKey ? 'Win' : '',
    key
  ].filter(Boolean).join('+');
}

function isFormTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

function activeDeck() {
  return library.decks.find((deck) => deck.id === library.settings.activeDeckId)
    || library.decks[0]
    || null;
}

function activeDeckId() {
  return activeDeck()?.id || '';
}

function padsForDeck(deckId) {
  if (!deckId) return library.pads;
  return library.pads.filter((pad) => {
    if (pad.deckId) return pad.deckId === deckId;
    return library.decks.length <= 1;
  });
}

function activePads() {
  return padsForDeck(activeDeckId());
}

function getPad(id) {
  return library.pads.find((pad) => pad.id === id);
}

function registrationFor(pad) {
  return library.registrations?.[pad.id] || null;
}

function isPlaybackActive(status) {
  if (!status) return false;
  if (Number.isFinite(Number(status.activeCount))) {
    return Number(status.activeCount) > 0;
  }
  return ['loading', 'playing', 'paused'].includes(status.state);
}

function playbackCount(status) {
  if (!status) return 0;
  if (Number.isFinite(Number(status.activeCount))) {
    return Math.max(0, Number(status.activeCount));
  }
  return isPlaybackActive(status) ? 1 : 0;
}

function shortTarget(target) {
  const value = String(target || '');
  return value.split(/[\\/]/).filter(Boolean).at(-1) || value || 'Belum dipilih';
}

function actionSummary(action) {
  if (!action || typeof action !== 'object') return 'Aksi belum dikonfigurasi';
  if (action.type === 'open') return `Buka • ${shortTarget(action.target)}`;
  if (action.type === 'close') {
    return `Tutup${action.force ? ' paksa' : ''} • ${shortTarget(action.target)}`;
  }
  if (action.type === 'website') {
    try {
      return `Website • ${new URL(action.url).hostname || action.url}`;
    } catch {
      return `Website • ${action.url || 'Belum diatur'}`;
    }
  }
  if (action.type === 'hotkey') return `Kirim hotkey • ${action.hotkey || 'Belum diatur'}`;
  if (action.type === 'text') {
    const text = String(action.text || '').replace(/\s+/g, ' ').trim();
    const excerpt = text.length > 34 ? `${text.slice(0, 34)}…` : text;
    return `Ketik teks • ${excerpt || (action.pressEnter ? 'Enter' : 'Kosong')}`;
  }
  if (action.type === 'multimedia') {
    return `Media OS • ${multimediaCommands[action.command] || action.command || 'Belum diatur'}`;
  }
  if (action.type === 'switch-deck') {
    const deck = library.decks.find((item) => item.id === action.deckId);
    return `Pindah deck • ${deck?.title || 'Deck tidak ditemukan'}`;
  }
  if (automationTypes.has(action.type)) {
    const count = Array.isArray(action.actions) ? action.actions.length : 0;
    const unit = action.type === 'random' ? 'pilihan' : (action.type === 'toggle' ? 'keadaan' : 'langkah');
    return `${actionTypeMeta[action.type]?.label || 'Automasi'} • ${count} ${unit}`;
  }
  return actionTypeMeta[action.type]?.summary || 'Aksi Windows';
}

function padSearchText(pad) {
  if (pad.type === 'action') {
    return `${pad.title} ${pad.hotkey} ${actionSummary(pad.action)} ${actionTypeMeta[pad.action?.type]?.label || ''}`;
  }
  return `${pad.title} ${pad.fileName} ${pad.hotkey}`;
}

function actionStatusMessage(pad, status) {
  if (pad.type !== 'action') return '';
  if (isPlaybackActive(status)) return 'Menjalankan aksi…';
  const error = actionErrorMessages.get(pad.id);
  return error ? `Gagal • ${error}` : actionSummary(pad.action);
}

function clearActionError(id) {
  actionErrorMessages.delete(id);
  const timer = actionErrorTimers.get(id);
  if (timer) window.clearTimeout(timer);
  actionErrorTimers.delete(id);
}

function rememberActionError(id, message) {
  clearActionError(id);
  actionErrorMessages.set(id, String(message || 'Aksi gagal dijalankan.'));
  actionErrorTimers.set(id, window.setTimeout(() => {
    actionErrorMessages.delete(id);
    actionErrorTimers.delete(id);
    renderLibrary();
  }, 7000));
}

function makeDeckTab(deck) {
  const current = deck.id === activeDeckId();
  const count = padsForDeck(deck.id).length;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `deck-tab${current ? ' is-active' : ''}`;
  button.dataset.deckId = deck.id;
  button.setAttribute('role', 'tab');
  button.setAttribute('aria-selected', String(current));
  button.tabIndex = current ? 0 : -1;

  const title = document.createElement('span');
  title.textContent = deck.title;
  const badge = document.createElement('small');
  badge.textContent = String(count);
  badge.setAttribute('aria-label', `${count} pad`);
  button.append(title, badge);

  button.addEventListener('click', () => selectDeck(deck.id));
  button.addEventListener('keydown', handleDeckTabKeydown);
  return button;
}

function renderDecks() {
  ui.deckTabs.replaceChildren(...library.decks.map(makeDeckTab));
  const deck = activeDeck();
  ui.activeDeckTitle.textContent = deck?.title || 'Belum ada deck';
  ui.renameDeckButton.disabled = !deck;
  ui.deleteDeckButton.disabled = !deck || library.decks.length <= 1;
  ui.deleteDeckButton.title = library.decks.length <= 1
    ? 'Deck terakhir tidak dapat dihapus'
    : 'Hapus deck';
}

function handleDeckTabKeydown(event) {
  const tabs = [...ui.deckTabs.querySelectorAll('[role="tab"]')];
  const index = tabs.indexOf(event.currentTarget);
  let nextIndex = -1;

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    nextIndex = (index + 1) % tabs.length;
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    nextIndex = (index - 1 + tabs.length) % tabs.length;
  } else if (event.key === 'Home') {
    nextIndex = 0;
  } else if (event.key === 'End') {
    nextIndex = tabs.length - 1;
  }

  if (nextIndex < 0) return;
  event.preventDefault();
  tabs[nextIndex].focus();
  selectDeck(tabs[nextIndex].dataset.deckId);
}

async function selectDeck(id) {
  if (!id || id === activeDeckId()) return;
  const tab = ui.deckTabs.querySelector(`[data-deck-id="${CSS.escape(id)}"]`);
  if (tab) tab.disabled = true;
  try {
    ensureSuccess(await api.library.setActiveDeck(id), 'Deck tidak dapat dibuka.');
    ui.searchInput.value = '';
    renderLibrary();
  } catch (error) {
    showToast(cleanError(error), 'error');
  } finally {
    if (tab) tab.disabled = false;
  }
}

function makePadCard(pad, allowReorder) {
  const status = playback.get(pad.id);
  const isAction = pad.type === 'action';
  const hasRevealTarget = isAction && ['open', 'close'].includes(pad.action?.type);
  const sourceMissing = (!isAction || hasRevealTarget) && !pad.exists;
  const isActive = isPlaybackActive(status);
  const hasActionError = isAction && actionErrorMessages.has(pad.id);
  const typeLabel = isAction
    ? (actionTypeMeta[pad.action?.type]?.label || 'Aksi')
    : (pad.type === 'audio' ? 'Audio' : 'Video');
  const article = document.createElement('article');
  article.className = [
    'pad-card',
    isAction ? 'is-action' : '',
    !isAction && (activePlaybackIds.has(pad.id) || isActive) ? 'is-playing' : '',
    isAction && isActive ? 'is-running' : '',
    hasActionError ? 'has-action-error' : '',
    sourceMissing ? 'is-missing' : ''
  ].filter(Boolean).join(' ');
  article.dataset.padId = pad.id;
  article.style.setProperty('--pad-color', pad.color);
  article.addEventListener('dragover', handlePadDragOver);
  article.addEventListener('dragleave', clearDropPosition);
  article.addEventListener('drop', handlePadDrop);

  const hitArea = document.createElement('button');
  hitArea.type = 'button';
  hitArea.className = 'pad-hit-area';
  hitArea.setAttribute(
    'aria-label',
    `${pad.title}, ${typeLabel}, hotkey ${pad.hotkey || 'belum diatur'}`
  );
  if (isAction) {
    hitArea.setAttribute('aria-busy', String(isActive));
  }
  hitArea.addEventListener('click', () => playPad(pad.id));
  hitArea.addEventListener('keydown', (event) => {
    if (event.key === 'Delete') {
      event.preventDefault();
      askDeletePad(pad.id);
    }
    if (event.key === 'F2') {
      event.preventDefault();
      if (isAction) openActionEditor(pad);
      else openEditor(pad);
    }
  });

  const top = document.createElement('span');
  top.className = 'pad-top';

  const badge = document.createElement('span');
  badge.className = `media-badge${isAction ? ' action-badge' : ''}`;
  badge.append(
    isAction
      ? actionIcon(pad.action?.type)
      : (pad.type === 'audio' ? audioIcon() : videoIcon())
  );
  const badgeText = document.createElement('span');
  badgeText.textContent = typeLabel;
  badge.append(badgeText);

  const hotkey = document.createElement('span');
  hotkey.className = 'pad-hotkey';
  hotkey.textContent = pad.hotkey || '—';
  const registration = registrationFor(pad);
  if (pad.hotkey && library.settings.globalHotkeysEnabled && registration && !registration.registered && !library.captureMode) {
    hotkey.title = 'Hotkey tidak dapat didaftarkan oleh Windows';
  }
  top.append(badge, hotkey);

  const visual = document.createElement('span');
  visual.className = 'pad-visual';
  visual.append(
    isAction
      ? actionIcon(pad.action?.type)
      : (pad.type === 'audio' ? audioIcon() : videoIcon())
  );
  const activeCount = playbackCount(status);
  if (!isAction && activeCount > 1) {
    const count = document.createElement('span');
    count.className = 'pad-playing-count';
    count.textContent = `${activeCount}×`;
    count.setAttribute('aria-label', `${activeCount} pemutaran aktif`);
    visual.append(count);
  }

  const copy = document.createElement('span');
  copy.className = 'pad-copy';
  const title = document.createElement('strong');
  title.textContent = pad.title;
  const description = document.createElement('span');
  description.className = isAction ? 'action-card-summary' : '';
  description.textContent = isAction
    ? actionStatusMessage(pad, status)
    : (pad.exists ? pad.fileName : 'File sumber tidak ditemukan');
  if (hasActionError) {
    description.title = actionErrorMessages.get(pad.id);
  }
  copy.append(title, description);

  hitArea.append(top, visual, copy);

  if (sourceMissing) {
    const missing = document.createElement('span');
    missing.className = 'missing-indicator';
    missing.textContent = isAction ? '⚠ TARGET HILANG' : '⚠ FILE HILANG';
    hitArea.append(missing);
  }

  const actions = document.createElement('div');
  actions.className = 'pad-actions';
  const dragHandle = padAction(
    allowReorder ? 'Tarik untuk mengurutkan pad' : 'Bersihkan pencarian untuk mengurutkan',
    gripIcon(),
    () => {},
    'pad-drag-handle'
  );
  dragHandle.draggable = allowReorder;
  dragHandle.disabled = !allowReorder;
  dragHandle.addEventListener('dragstart', (event) => beginPadDrag(event, pad.id));
  dragHandle.addEventListener('dragend', endPadDrag);
  dragHandle.addEventListener('keydown', (event) => handlePadReorderKeydown(event, pad.id));

  actions.append(dragHandle);
  actions.append(
    padAction(
      isAction ? 'Edit aksi' : 'Edit media',
      editIcon(),
      () => (isAction ? openActionEditor(pad) : openEditor(pad))
    )
  );
  if (!isAction || hasRevealTarget) {
    actions.append(
      padAction(
        isAction ? 'Tampilkan target' : 'Tampilkan file',
        folderIcon(),
        () => revealPad(pad.id)
      )
    );
  }
  actions.append(
    padAction(isAction ? 'Hapus aksi' : 'Hapus media', trashIcon(), () => askDeletePad(pad.id), 'delete')
  );

  const progress = document.createElement('div');
  progress.className = `pad-progress${isAction ? ' action-progress' : ''}`;
  const progressValue = document.createElement('span');
  const percentage = isAction
    ? (isActive ? 100 : 0)
    : (status?.duration ? (status.currentTime / status.duration) * 100 : 0);
  progressValue.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
  progress.append(progressValue);

  article.append(hitArea, actions, progress);
  return article;
}

function padAction(label, icon, handler, extraClass = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `pad-action ${extraClass}`.trim();
  button.setAttribute('aria-label', label);
  button.title = label;
  button.append(icon);
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    handler();
  });
  return button;
}

function makeAddCard(kind = 'media') {
  const isAction = kind === 'action';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `add-pad-card${isAction ? ' add-action-card' : ''}`;
  const plus = document.createElement('span');
  plus.textContent = isAction ? '↯' : '+';
  const title = document.createElement('strong');
  title.textContent = isAction ? 'Tambah aksi' : 'Tambah media';
  const subtitle = document.createElement('small');
  subtitle.textContent = isAction ? 'Windows & automasi' : 'Audio atau video';
  button.append(plus, title, subtitle);
  button.addEventListener('click', () => (isAction ? openActionEditor() : openEditor()));
  return button;
}

function makeNoResults() {
  const message = document.createElement('div');
  message.className = 'empty-state';
  message.style.minHeight = '220px';
  const title = document.createElement('h2');
  title.textContent = 'Pad tidak ditemukan';
  const copy = document.createElement('p');
  copy.textContent = 'Coba kata pencarian lain atau bersihkan kolom pencarian.';
  message.append(title, copy);
  return message;
}

function renderLibrary() {
  renderDecks();
  renderSettings();

  const pads = activePads();
  const query = ui.searchInput.value.trim().toLocaleLowerCase('id');
  const visiblePads = pads.filter((pad) => {
    if (!query) return true;
    return padSearchText(pad).toLocaleLowerCase('id').includes(query);
  });

  ui.deckGrid.replaceChildren();
  ui.emptyState.hidden = pads.length > 0 || Boolean(query);
  ui.deckGrid.hidden = pads.length === 0 && !query;

  if (query && visiblePads.length === 0) {
    ui.deckGrid.append(makeNoResults());
  } else {
    for (const pad of visiblePads) {
      ui.deckGrid.append(makePadCard(pad, !query));
    }
    if (pads.length > 0 && !query) {
      ui.deckGrid.append(makeAddCard('media'), makeAddCard('action'));
    }
  }

  const audioCount = pads.filter((pad) => pad.type === 'audio').length;
  const videoCount = pads.filter((pad) => pad.type === 'video').length;
  const actionCount = pads.filter((pad) => pad.type === 'action').length;
  ui.totalActions.textContent = String(actionCount);
  ui.totalAudio.textContent = String(audioCount);
  ui.totalVideo.textContent = String(videoCount);
  ui.sidebarPadCount.textContent = String(pads.length);
  ui.visiblePadSummary.textContent = query
    ? `${visiblePads.length} hasil`
    : `${pads.length} pad`;

  renderGlobalStatus();
  renderNowPlaying();
}

function renderGlobalStatus() {
  const enabled = Boolean(library.settings.globalHotkeysEnabled);
  const assigned = activePads().filter((pad) => pad.hotkey);
  const registered = assigned.filter((pad) => registrationFor(pad)?.registered);
  const failed = assigned.filter((pad) => {
    const state = registrationFor(pad);
    return enabled && state && !state.registered && state.reason === 'unavailable';
  });
  const stopAllFailed = Boolean(
    library.settings.stopAllHotkey &&
    library.stopAllRegistration &&
    !library.stopAllRegistration.registered &&
    library.stopAllRegistration.reason === 'unavailable'
  );

  ui.globalHotkeyToggle.checked = enabled;
  ui.hotkeyHealth.classList.toggle('has-error', failed.length > 0 || stopAllFailed);
  ui.globalStatusMain.title = '';

  if (library.captureMode) {
    ui.globalStatusMain.textContent = 'Hotkey dijeda sementara';
    ui.globalStatusSide.textContent = 'Dijeda';
    ui.registeredSummary.textContent = 'Dialog pengaturan sedang terbuka';
    ui.hotkeyHealth.lastChild.textContent = ' Dijeda saat mengedit';
    return;
  }

  if (library.hotkeysSuspended) {
    const label = 'Input sedang dikirim — hotkey dijeda singkat';
    ui.hotkeyHealth.classList.remove('has-error');
    ui.globalStatusMain.textContent = label;
    ui.globalStatusMain.title = label;
    ui.globalStatusSide.textContent = 'Dijeda singkat';
    ui.registeredSummary.textContent = 'Mencegah aksi memicu pad lain';
    ui.hotkeyHealth.lastChild.textContent = ' Input sedang dikirim';
    return;
  }

  if (!enabled) {
    ui.globalStatusMain.textContent = 'Hotkey pad nonaktif';
    ui.globalStatusSide.textContent = stopAllFailed ? 'Perlu dicek' : 'Nonaktif';
    ui.registeredSummary.textContent = stopAllFailed
      ? 'Hotkey Stop All tidak tersedia'
      : (library.settings.stopAllHotkey ? 'Stop All tetap aktif' : 'Pad hanya merespons saat aplikasi aktif');
    ui.hotkeyHealth.lastChild.textContent = stopAllFailed
      ? ' Ganti hotkey Stop All'
      : ' Hotkey pad dijeda';
    return;
  }

  if (stopAllFailed) {
    ui.globalStatusMain.textContent = 'Hotkey Stop All bermasalah';
    ui.globalStatusSide.textContent = 'Perlu dicek';
    ui.registeredSummary.textContent = 'Ganti tombol darurat yang dipakai aplikasi lain';
    ui.hotkeyHealth.lastChild.textContent = ' Stop All tidak tersedia';
    return;
  }

  ui.globalStatusSide.textContent = failed.length ? 'Bermasalah' : 'Aktif';
  if (failed.length) {
    ui.globalStatusMain.textContent = `${failed.length} hotkey bermasalah`;
    ui.registeredSummary.textContent = 'Ganti tombol yang dipakai aplikasi lain';
    ui.hotkeyHealth.lastChild.textContent = ` ${failed.length} tombol tidak tersedia`;
  } else {
    ui.globalStatusMain.textContent = 'Hotkey global aktif';
    ui.registeredSummary.textContent = assigned.length
      ? `${registered.length} tombol siap di latar belakang`
      : 'Tambahkan hotkey pada pad';
    ui.hotkeyHealth.lastChild.textContent = ' Semua sistem siap';
  }
}

function renderNowPlaying() {
  for (const id of [...activePlaybackIds]) {
    const pad = getPad(id);
    if (!pad || pad.type === 'action' || !isPlaybackActive(playback.get(id))) {
      activePlaybackIds.delete(id);
    }
  }

  let focusId = playbackFocusId;
  if (!activePlaybackIds.has(focusId)) {
    focusId = [...activePlaybackIds].at(-1) || '';
    playbackFocusId = focusId;
  }

  const status = playback.get(focusId);
  const pad = getPad(focusId);
  const visible = Boolean(pad && pad.type !== 'action' && status && activePlaybackIds.size);
  ui.nowPlaying.hidden = !visible;
  if (!visible) return;

  const totalInstances = [...activePlaybackIds]
    .reduce((total, id) => total + playbackCount(playback.get(id)), 0);
  const extraPads = Math.max(0, activePlaybackIds.size - 1);
  const ownInstances = playbackCount(status);
  let suffix = '';
  if (extraPads) suffix = ` • +${extraPads} pad aktif`;
  else if (ownInstances > 1) suffix = ` • ${ownInstances} pemutaran`;

  ui.nowPlayingTitle.textContent = `${pad.title}${suffix}`;
  ui.nowPlayingArt.style.setProperty('--now-color', pad.color);
  const percentage = status.duration ? (status.currentTime / status.duration) * 100 : 0;
  ui.nowProgressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
  ui.nowTime.textContent = totalInstances > 1
    ? `${totalInstances} aktif`
    : `${formatTime(status.currentTime)} / ${formatTime(status.duration)}`;
}

function updatePlaybackUi(status) {
  const pad = getPad(status.id);
  const isAction = pad?.type === 'action';
  const card = [...ui.deckGrid.querySelectorAll('.pad-card')]
    .find((element) => element.dataset.padId === status.id);
  if (card) {
    card.classList.toggle('is-playing', !isAction && activePlaybackIds.has(status.id));
    card.classList.toggle('is-running', isAction && isPlaybackActive(status));
    card.classList.toggle('has-action-error', isAction && actionErrorMessages.has(status.id));
    if (isAction) {
      card.querySelector('.pad-hit-area')
        ?.setAttribute('aria-busy', String(isPlaybackActive(status)));
    }
    const progress = card.querySelector('.pad-progress span');
    if (progress) {
      const percentage = isAction
        ? (isPlaybackActive(status) ? 100 : 0)
        : (status.duration ? (status.currentTime / status.duration) * 100 : 0);
      progress.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
    }

    const visual = card.querySelector('.pad-visual');
    const oldCount = visual?.querySelector('.pad-playing-count');
    const count = isAction ? 0 : playbackCount(status);
    if (oldCount && count <= 1) oldCount.remove();
    if (oldCount && count > 1) oldCount.textContent = `${count}×`;
    if (visual && !oldCount && count > 1) {
      const badge = document.createElement('span');
      badge.className = 'pad-playing-count';
      badge.textContent = `${count}×`;
      badge.setAttribute('aria-label', `${count} pemutaran aktif`);
      visual.append(badge);
    }

    const summary = card.querySelector('.action-card-summary');
    if (summary && pad) {
      summary.textContent = actionStatusMessage(pad, status);
      summary.title = actionErrorMessages.get(status.id) || '';
    }
  }
  renderNowPlaying();
}

async function playPad(id) {
  const pad = getPad(id);
  if (!pad) return;

  const previous = playback.get(id);
  if (pad.type === 'action') {
    clearActionError(id);
    playback.set(id, {
      ...previous,
      id,
      state: 'loading',
      currentTime: 0,
      duration: 0,
      activeCount: 1
    });
    renderLibrary();

    try {
      const result = await api.playback.playPad(id);
      if (!result?.ok && !result?.reported) {
        throw new Error(result?.error || 'Aksi tidak dapat dijalankan.');
      }
    } catch (error) {
      if (previous) playback.set(id, previous);
      else playback.delete(id);
      renderLibrary();
      showToast(cleanError(error), 'error');
    }
    return;
  }

  const wasActive = activePlaybackIds.has(id);
  const mode = playbackModes.has(pad.playbackMode) ? pad.playbackMode : 'exclusive';
  const togglingOff = mode === 'toggle' && wasActive;

  if (mode === 'exclusive') {
    for (const activeId of [...activePlaybackIds]) {
      const activeStatus = playback.get(activeId) || {};
      playback.set(activeId, { ...activeStatus, id: activeId, state: 'stopped', activeCount: 0, currentTime: 0 });
    }
    activePlaybackIds.clear();
  }

  if (togglingOff) {
    playback.set(id, {
      ...previous,
      id,
      state: 'stopped',
      currentTime: 0,
      activeCount: 0
    });
    activePlaybackIds.delete(id);
    if (playbackFocusId === id) playbackFocusId = '';
  } else {
    const optimisticCount = mode === 'overlap' && wasActive
      ? Math.max(1, playbackCount(previous)) + 1
      : 1;
    const optimistic = {
      ...previous,
      id,
      state: 'loading',
      currentTime: mode === 'restart' ? 0 : previous?.currentTime || 0,
      duration: previous?.duration || 0,
      activeCount: optimisticCount
    };
    playback.set(id, optimistic);
    activePlaybackIds.add(id);
    playbackFocusId = id;
  }
  renderLibrary();

  try {
    const result = await api.playback.playPad(id);
    if (!result?.ok && !result?.reported) {
      throw new Error(result?.error || 'Media tidak dapat diputar.');
    }
  } catch (error) {
    if (previous) playback.set(id, previous);
    else playback.delete(id);
    if (wasActive) activePlaybackIds.add(id);
    else activePlaybackIds.delete(id);
    if (wasActive) playbackFocusId = id;
    renderLibrary();
    showToast(cleanError(error), 'error');
  }
}

async function stopAll() {
  try {
    ensureSuccess(await api.playback.stopAll(), 'Media tidak dapat dihentikan.');
    for (const [id, status] of playback) {
      playback.set(id, { ...status, state: 'stopped', activeCount: 0, currentTime: 0 });
    }
    activePlaybackIds.clear();
    playbackFocusId = '';
    renderLibrary();
  } catch (error) {
    showToast(cleanError(error), 'error');
  }
}

async function revealPad(id) {
  try {
    ensureSuccess(await api.library.revealPad(id), 'Lokasi file tidak dapat dibuka.');
  } catch (error) {
    showToast(cleanError(error), 'error');
  }
}

function setEditorType(type) {
  editor.type = type === 'video' ? 'video' : 'audio';
  for (const button of document.querySelectorAll('.type-option')) {
    const active = button.dataset.type === editor.type;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-checked', String(active));
  }
}

function setEditorFile(file) {
  editor.file = file;
  ui.mediaFileButton.classList.toggle('has-file', Boolean(file));
  ui.selectedFileName.textContent = file?.fileName || 'Pilih file media';
  ui.selectedFileMeta.textContent = file
    ? `${file.type === 'audio' ? 'Audio' : 'Video'} • ${file.path}`
    : 'Klik untuk mencari file di komputer';

  if (file) {
    setEditorType(file.type);
    if (!ui.padTitleInput.value.trim()) {
      ui.padTitleInput.value = file.name;
    }
  }
}

function padHotkeyConflict(value) {
  if (!value) return null;
  return padsForDeck(editor.deckId || activeDeckId()).find(
    (pad) => pad.id !== editor.id && pad.hotkey && pad.hotkey === value
  ) || null;
}

function setEditorHotkey(value) {
  editor.hotkey = value || '';
  editor.recording = false;
  ui.hotkeyRecorder.classList.remove('is-recording');
  ui.hotkeyValue.textContent = editor.hotkey || 'Tekan tombol...';
  ui.singleKeyWarning.hidden = !editor.hotkey || editor.hotkey.includes('+');

  const conflict = padHotkeyConflict(editor.hotkey);
  const reserved = editor.hotkey && editor.hotkey === library.settings.stopAllHotkey;
  if (conflict) {
    ui.hotkeyHelp.textContent = `Tombol ini sudah digunakan oleh “${conflict.title}”.`;
  } else if (reserved) {
    ui.hotkeyHelp.textContent = 'Tombol ini digunakan untuk Hentikan semua.';
  } else {
    ui.hotkeyHelp.textContent = 'Bisa A–Z, 0–9, F1–F12, atau kombinasi Ctrl/Alt/Shift.';
  }
  ui.hotkeyHelp.style.color = conflict || reserved ? '#ff8295' : '';
}

function setEditorColor(color) {
  editor.color = colors.includes(color) ? color : colors[0];
  for (const swatch of ui.colorOptions.querySelectorAll('.color-swatch')) {
    const selected = swatch.dataset.color === editor.color;
    swatch.classList.toggle('is-selected', selected);
    swatch.setAttribute('aria-pressed', String(selected));
  }
}

function setEditorPlaybackMode(mode) {
  editor.playbackMode = playbackModes.has(mode) ? mode : 'exclusive';
  for (const button of ui.playbackModeOptions.querySelectorAll('[data-playback-mode]')) {
    const active = button.dataset.playbackMode === editor.playbackMode;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-checked', String(active));
    button.tabIndex = active ? 0 : -1;
  }
}

function anyModalOpen() {
  return [ui.editorModal, ui.actionEditorModal, ui.deckModal, ui.settingsModal, ui.confirmModal]
    .some((modal) => !modal.hidden);
}

async function syncCaptureMode() {
  appShell.inert = anyModalOpen();
  try {
    await api.library.setCaptureMode(anyModalOpen());
  } catch (error) {
    showToast(cleanError(error), 'error');
  }
}

async function openEditor(pad = null, selectedFile = null) {
  if (pad?.type === 'action') {
    return openActionEditor(pad);
  }
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  editor = emptyEditor();
  editor.deckId = pad?.deckId || activeDeckId();
  if (pad) {
    editor.id = pad.id;
    editor.type = pad.type;
    editor.file = {
      path: pad.mediaPath,
      type: pad.type,
      name: pad.title,
      fileName: pad.fileName
    };
    editor.hotkey = pad.hotkey;
    editor.color = pad.color;
    editor.playbackMode = pad.playbackMode || 'exclusive';
  }

  ui.editorTitle.textContent = pad ? 'Edit media pad' : 'Tambah audio atau video';
  ui.padTitleInput.value = pad?.title || '';
  ui.volumeInput.value = String(Math.round((pad?.volume ?? 1) * 100));
  ui.volumeValue.textContent = `${ui.volumeInput.value}%`;
  ui.loopInput.checked = Boolean(pad?.loop);
  setEditorType(editor.type);
  setEditorFile(selectedFile || editor.file);
  setEditorHotkey(editor.hotkey);
  setEditorColor(editor.color);
  setEditorPlaybackMode(editor.playbackMode);
  ui.editorModal.hidden = false;
  await syncCaptureMode();
  window.setTimeout(() => (pad ? ui.padTitleInput : ui.mediaFileButton).focus(), 20);
}

async function closeEditor() {
  if (ui.editorModal.hidden) return;
  editor.recording = false;
  ui.editorModal.hidden = true;
  await syncCaptureMode();
  returnFocus?.focus();
  returnFocus = null;
}

async function chooseMedia() {
  try {
    const file = await api.library.selectMedia(editor.type);
    if (file) setEditorFile(file);
  } catch (error) {
    showToast(cleanError(error), 'error');
  }
}

async function inspectDroppedFile(file) {
  try {
    const filePath = api.library.pathForFile(file);
    const inspected = await api.library.inspectFile(filePath);
    if (!ui.editorModal.hidden) {
      setEditorFile(inspected);
      showToast('File media pada editor diperbarui.');
    } else {
      await openEditor(null, inspected);
    }
  } catch (error) {
    showToast(cleanError(error), 'error');
  }
}

async function savePad(event) {
  event.preventDefault();
  if (!editor.file) {
    showToast('Pilih file audio atau video terlebih dahulu.', 'error');
    ui.mediaFileButton.focus();
    return;
  }

  const conflict = padHotkeyConflict(editor.hotkey);
  if (conflict) {
    showToast(`Hotkey ${editor.hotkey} sudah digunakan oleh “${conflict.title}”.`, 'error');
    ui.hotkeyRecorder.focus();
    return;
  }
  if (editor.hotkey && editor.hotkey === library.settings.stopAllHotkey) {
    showToast(`${editor.hotkey} dipakai sebagai hotkey Hentikan semua.`, 'error');
    ui.hotkeyRecorder.focus();
    return;
  }

  const input = {
    title: ui.padTitleInput.value,
    type: editor.type,
    mediaPath: editor.file.path,
    hotkey: editor.hotkey,
    color: editor.color,
    volume: Number(ui.volumeInput.value) / 100,
    loop: ui.loopInput.checked,
    deckId: editor.deckId || activeDeckId(),
    playbackMode: editor.playbackMode
  };

  ui.savePadButton.disabled = true;
  try {
    if (editor.id) {
      ensureSuccess(await api.library.updatePad(editor.id, input), 'Perubahan pad tidak dapat disimpan.');
    } else {
      ensureSuccess(await api.library.addPad(input), 'Media tidak dapat ditambahkan.');
    }
    const message = editor.id ? 'Perubahan pad disimpan.' : 'Media berhasil ditambahkan ke deck.';
    await closeEditor();
    showToast(message);
  } catch (error) {
    showToast(cleanError(error), 'error');
  } finally {
    ui.savePadButton.disabled = false;
  }
}

function makeActionSelect(options, value, onChange) {
  const select = document.createElement('select');
  select.className = 'form-select';
  for (const optionData of options) {
    const option = document.createElement('option');
    option.value = optionData.value;
    option.textContent = optionData.label;
    option.disabled = Boolean(optionData.disabled);
    select.append(option);
  }
  select.value = value;
  select.addEventListener('change', () => onChange(select.value));
  return select;
}

function makeActionInput(value, placeholder, onInput, options = {}) {
  const input = document.createElement('input');
  input.className = 'action-text-input';
  input.type = options.type || 'text';
  input.value = value ?? '';
  input.placeholder = placeholder;
  input.autocomplete = 'off';
  input.spellcheck = options.spellcheck ?? false;
  if (options.min !== undefined) input.min = String(options.min);
  if (options.max !== undefined) input.max = String(options.max);
  if (options.step !== undefined) input.step = String(options.step);
  if (options.maxLength !== undefined) input.maxLength = options.maxLength;
  input.addEventListener('input', () => onInput(input.value));
  return input;
}

function wrapActionField(labelText, control, helpText = '') {
  const label = document.createElement('label');
  label.className = 'form-field action-config-field';
  const title = document.createElement('span');
  title.className = 'field-label';
  title.textContent = labelText;
  label.append(title, control);
  if (helpText) {
    const help = document.createElement('small');
    help.className = 'field-help';
    help.textContent = helpText;
    label.append(help);
  }
  return label;
}

function makeActionCheck(labelText, helpText, checked, onChange) {
  const label = document.createElement('label');
  label.className = 'action-check-row';
  const copy = document.createElement('span');
  const strong = document.createElement('strong');
  strong.textContent = labelText;
  const small = document.createElement('small');
  small.textContent = helpText;
  copy.append(strong, small);

  const switchWrap = document.createElement('span');
  switchWrap.className = 'switch';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = Boolean(checked);
  input.addEventListener('change', () => onChange(input.checked));
  const track = document.createElement('span');
  track.className = 'switch-track';
  const thumb = document.createElement('span');
  thumb.className = 'switch-thumb';
  track.append(thumb);
  switchWrap.append(input, track);
  label.append(copy, switchWrap);
  return label;
}

function makeTargetPicker(node, kind, titleText) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `file-picker action-target-picker${node.target ? ' has-file' : ''}`;

  const icon = document.createElement('span');
  icon.className = 'file-picker-icon';
  icon.append(folderIcon());

  const copy = document.createElement('span');
  copy.className = 'file-picker-copy';
  const title = document.createElement('strong');
  title.textContent = node.target ? shortTarget(node.target) : titleText;
  const detail = document.createElement('small');
  detail.textContent = node.target || (
    kind === 'folder'
      ? 'Pilih folder lokal dari komputer'
      : 'Pilih aplikasi atau file lokal dari komputer'
  );
  copy.append(title, detail);

  const browse = document.createElement('span');
  browse.className = 'browse-label';
  browse.textContent = 'Pilih';
  button.append(icon, copy, browse);
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const selected = await api.library.selectOpenTarget(kind);
      if (!selected) return;
      node.target = selected.path;
      node._openKind = kind;
      clearActionFormError();
      renderActionBuilder();
    } catch (error) {
      showActionFormError(cleanError(error));
    } finally {
      button.disabled = false;
    }
  });
  return button;
}

function mediaPadOptions(selectedId) {
  const pads = padsForDeck(actionEditor.deckId || activeDeckId())
    .filter((pad) => pad.type === 'audio' || pad.type === 'video');
  const options = pads.map((pad) => ({
    value: pad.id,
    label: `${pad.type === 'audio' ? 'Audio' : 'Video'} — ${pad.title}`
  }));
  if (!options.length) {
    options.push({
      value: '',
      label: 'Belum ada pad media di deck ini',
      disabled: true
    });
  } else if (selectedId && !pads.some((pad) => pad.id === selectedId)) {
    options.unshift({
      value: selectedId,
      label: 'Pad media tidak ditemukan',
      disabled: true
    });
  }
  return options;
}

function renderActionLeafFields(node) {
  const fields = document.createElement('div');
  fields.className = 'action-leaf-fields';

  if (node.type === 'media') {
    const select = makeActionSelect(
      mediaPadOptions(node.padId),
      node.padId || '',
      (value) => {
        node.padId = value;
        clearActionFormError();
      }
    );
    fields.append(wrapActionField(
      'Pad media',
      select,
      'Hanya pad audio/video pada deck aktif yang dapat dipilih.'
    ));
    return fields;
  }

  if (node.type === 'open') {
    const kindSelect = makeActionSelect(
      [
        { value: 'file', label: 'File atau aplikasi' },
        { value: 'folder', label: 'Folder' }
      ],
      node._openKind || 'file',
      (value) => {
        if (node._openKind !== value) {
          node._openKind = value;
          node.target = '';
          renderActionBuilder();
        }
      }
    );
    fields.append(wrapActionField('Jenis target', kindSelect));
    fields.append(wrapActionField(
      'Target yang dibuka',
      makeTargetPicker(
        node,
        node._openKind || 'file',
        node._openKind === 'folder' ? 'Pilih folder' : 'Pilih file atau aplikasi'
      )
    ));
    return fields;
  }

  if (node.type === 'close') {
    const targetField = wrapActionField(
      'Aplikasi yang ditutup',
      makeTargetPicker(node, 'file', 'Pilih executable aplikasi'),
      'Pilih file aplikasi atau executable yang prosesnya ingin ditutup.'
    );
    targetField.classList.add('action-field-wide');
    fields.append(targetField);
    fields.append(makeActionCheck(
      'Paksa tutup jika aplikasi tidak merespons',
      'Gunakan dengan hati-hati karena perubahan yang belum disimpan dapat hilang.',
      node.force,
      (checked) => {
        node.force = checked;
        clearActionFormError();
      }
    ));
    return fields;
  }

  if (node.type === 'website') {
    const input = makeActionInput(
      node.url,
      'https://contoh.com',
      (value) => {
        node.url = value;
        clearActionFormError();
      },
      { spellcheck: false, maxLength: 2048 }
    );
    fields.append(wrapActionField(
      'Alamat website atau URI',
      input,
      'Mendukung HTTP(S), mailto, Discord, Obsidian, Spotify, dan Steam.'
    ));
    return fields;
  }

  if (node.type === 'hotkey') {
    const input = makeActionInput(
      node.hotkey,
      'Contoh: Ctrl+Shift+S',
      (value) => {
        node.hotkey = value;
        clearActionFormError();
      },
      { maxLength: 80 }
    );
    fields.append(wrapActionField(
      'Hotkey yang dikirim',
      input,
      'Hotkey ini dikirim ke aplikasi yang sedang aktif; berbeda dari hotkey pemicu pad.'
    ));
    return fields;
  }

  if (node.type === 'text') {
    const textarea = document.createElement('textarea');
    textarea.className = 'action-textarea';
    textarea.rows = 4;
    textarea.maxLength = 4000;
    textarea.placeholder = 'Tulis teks yang akan diketik…';
    textarea.value = node.text || '';
    textarea.addEventListener('input', () => {
      node.text = textarea.value;
      clearActionFormError();
    });
    const textField = wrapActionField(
      'Teks',
      textarea,
      'Teks akan diketik pada aplikasi yang sedang aktif.'
    );
    textField.classList.add('action-field-wide');
    fields.append(textField);
    fields.append(makeActionCheck(
      'Tekan Enter setelah mengetik',
      'Cocok untuk mengirim chat atau menjalankan perintah.',
      node.pressEnter,
      (checked) => {
        node.pressEnter = checked;
        clearActionFormError();
      }
    ));
    return fields;
  }

  if (node.type === 'multimedia') {
    const select = makeActionSelect(
      Object.entries(multimediaCommands).map(([value, label]) => ({ value, label })),
      node.command || 'play-pause',
      (value) => {
        node.command = value;
        clearActionFormError();
      }
    );
    fields.append(wrapActionField(
      'Perintah multimedia',
      select,
      'Dikirim ke pemutar media Windows yang sedang aktif.'
    ));
    return fields;
  }

  if (node.type === 'switch-deck') {
    const options = library.decks.map((deck) => ({
      value: deck.id,
      label: deck.title
    }));
    const select = makeActionSelect(options, node.deckId || '', (value) => {
      node.deckId = value;
      clearActionFormError();
    });
    fields.append(wrapActionField(
      'Deck tujuan',
      select,
      'Hotkey deck aktif akan diperbarui setelah perpindahan.'
    ));
    return fields;
  }

  if (node.type === 'delay') {
    const input = makeActionInput(
      node.ms,
      '1000',
      (value) => {
        node.ms = value;
        clearActionFormError();
      },
      { type: 'number', min: 0, max: 60000, step: 50 }
    );
    fields.append(wrapActionField(
      'Durasi jeda (milidetik)',
      input,
      'Nilai 1000 sama dengan satu detik; maksimum 60000.'
    ));
  }
  return fields;
}

function stepTypeOptions() {
  return [
    { value: 'media', label: 'Putar pad media' },
    { value: 'open', label: 'Buka file / aplikasi / folder' },
    { value: 'close', label: 'Tutup aplikasi' },
    { value: 'website', label: 'Buka website / URI' },
    { value: 'hotkey', label: 'Kirim hotkey' },
    { value: 'text', label: 'Ketik teks' },
    { value: 'multimedia', label: 'Kontrol multimedia' },
    { value: 'switch-deck', label: 'Pindah deck' },
    { value: 'delay', label: 'Jeda' }
  ];
}

function makeStepControl(label, textValue, handler, disabled = false, className = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `step-control ${className}`.trim();
  button.setAttribute('aria-label', label);
  button.title = label;
  button.textContent = textValue;
  button.disabled = disabled;
  button.addEventListener('click', handler);
  return button;
}

function moveActionStep(index, offset) {
  const actions = actionEditor.action.actions;
  const targetIndex = index + offset;
  if (!Array.isArray(actions) || targetIndex < 0 || targetIndex >= actions.length) return;
  [actions[index], actions[targetIndex]] = [actions[targetIndex], actions[index]];
  renderActionBuilder();
  window.setTimeout(() => {
    ui.actionStepList
      .querySelector(`[data-step-key="${CSS.escape(actions[targetIndex]._uiKey)}"] .step-type-select`)
      ?.focus();
  }, 0);
}

function removeActionStep(index) {
  const actions = actionEditor.action.actions;
  if (!Array.isArray(actions) || actions.length <= 1 || actionEditor.action.type === 'toggle') {
    return;
  }
  actions.splice(index, 1);
  clearActionFormError();
  renderActionBuilder();
}

function renderActionSteps() {
  const action = actionEditor.action;
  const steps = Array.isArray(action.actions) ? action.actions : [];
  const isToggle = action.type === 'toggle';
  const cards = steps.map((step, index) => {
    const card = document.createElement('article');
    card.className = 'automation-step';
    card.dataset.stepKey = step._uiKey;

    const header = document.createElement('div');
    header.className = 'automation-step-header';
    const indexWrap = document.createElement('div');
    indexWrap.className = 'automation-step-index';
    const number = document.createElement('span');
    number.textContent = String(index + 1).padStart(2, '0');
    const label = document.createElement('strong');
    label.textContent = isToggle
      ? (index === 0 ? 'Keadaan pertama' : 'Keadaan kedua')
      : (action.type === 'random' ? `Pilihan ${index + 1}` : `Langkah ${index + 1}`);
    indexWrap.append(number, label);

    const controls = document.createElement('div');
    controls.className = 'automation-step-controls';
    controls.append(
      makeStepControl('Pindahkan ke atas', '↑', () => moveActionStep(index, -1), index === 0),
      makeStepControl('Pindahkan ke bawah', '↓', () => moveActionStep(index, 1), index === steps.length - 1),
      makeStepControl(
        'Hapus langkah',
        '×',
        () => removeActionStep(index),
        isToggle || steps.length <= 1,
        'remove-step'
      )
    );
    header.append(indexWrap, controls);

    const typeSelect = makeActionSelect(stepTypeOptions(), step.type, (value) => {
      action.actions[index] = defaultActionNode(value);
      clearActionFormError();
      renderActionBuilder();
    });
    typeSelect.classList.add('step-type-select');
    const typeField = wrapActionField('Jenis langkah', typeSelect);

    const body = document.createElement('div');
    body.className = 'automation-step-body';
    body.append(typeField, renderActionLeafFields(step));
    card.append(header, body);
    return card;
  });
  ui.actionStepList.replaceChildren(...cards);
}

function renderActionBuilder() {
  const action = actionEditor.action;
  const automated = automationTypes.has(action.type);
  ui.actionTypeSelect.value = action.type;
  ui.actionTypeHelp.textContent = actionTypeMeta[action.type]?.summary || 'Konfigurasikan aksi.';
  ui.actionRootFields.hidden = automated;
  ui.automationBuilder.hidden = !automated;
  ui.actionRootFields.replaceChildren();

  if (!automated) {
    ui.actionRootFields.append(renderActionLeafFields(action));
    ui.actionBuilderLimit.textContent = '';
    return;
  }

  renderActionSteps();
  const count = action.actions.length;
  const isToggle = action.type === 'toggle';
  const maxSteps = actionStepLimit(action.type);
  ui.addActionStepButton.hidden = isToggle;
  ui.addActionStepButton.disabled = isToggle || count >= maxSteps;
  ui.actionBuilderLimit.textContent = isToggle
    ? 'Tepat 2 keadaan'
    : `${count} dari ${maxSteps} ${action.type === 'random' ? 'pilihan' : 'langkah'}`;
}

function actionPadHotkeyConflict(value) {
  if (!value) return null;
  return padsForDeck(actionEditor.deckId || activeDeckId()).find(
    (pad) => pad.id !== actionEditor.id && pad.hotkey && pad.hotkey === value
  ) || null;
}

function setActionEditorHotkey(value) {
  actionEditor.hotkey = value || '';
  actionEditor.recording = false;
  ui.actionHotkeyRecorder.classList.remove('is-recording');
  ui.actionHotkeyValue.textContent = actionEditor.hotkey || 'Tekan tombol...';
  ui.actionSingleKeyWarning.hidden = !actionEditor.hotkey || actionEditor.hotkey.includes('+');

  const conflict = actionPadHotkeyConflict(actionEditor.hotkey);
  const reserved = actionEditor.hotkey && actionEditor.hotkey === library.settings.stopAllHotkey;
  if (conflict) {
    ui.actionHotkeyHelp.textContent = `Tombol ini sudah digunakan oleh “${conflict.title}”.`;
  } else if (reserved) {
    ui.actionHotkeyHelp.textContent = 'Tombol ini digunakan untuk Hentikan semua.';
  } else {
    ui.actionHotkeyHelp.textContent = 'Pemicu ini tetap bekerja saat AERO DECK berada di latar belakang.';
  }
  ui.actionHotkeyHelp.style.color = conflict || reserved ? '#ff8295' : '';
}

function setActionEditorColor(color) {
  actionEditor.color = colors.includes(color) ? color : colors[0];
  for (const swatch of ui.actionColorOptions.querySelectorAll('.color-swatch')) {
    const selected = swatch.dataset.color === actionEditor.color;
    swatch.classList.toggle('is-selected', selected);
    swatch.setAttribute('aria-pressed', String(selected));
  }
}

function clearActionFormError() {
  ui.actionFormError.hidden = true;
  ui.actionFormError.textContent = '';
}

function showActionFormError(message, focusTarget = null) {
  ui.actionFormError.textContent = message;
  ui.actionFormError.hidden = false;
  if (focusTarget instanceof HTMLElement) {
    focusTarget.focus();
  } else {
    ui.actionFormError.scrollIntoView({ block: 'nearest' });
  }
}

async function openActionEditor(pad = null) {
  if (pad && pad.type !== 'action') {
    return openEditor(pad);
  }
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  actionEditor = emptyActionEditor();
  actionEditor.deckId = pad?.deckId || activeDeckId();
  if (pad) {
    actionEditor.id = pad.id;
    actionEditor.hotkey = pad.hotkey || '';
    actionEditor.color = pad.color || colors[0];
    actionEditor.action = hydrateActionNode(pad.action, 'open');
  }

  ui.actionEditorTitle.textContent = pad ? 'Edit pad aksi' : 'Tambah aksi';
  ui.actionTitleInput.value = pad?.title || '';
  setActionEditorHotkey(actionEditor.hotkey);
  setActionEditorColor(actionEditor.color);
  clearActionFormError();
  renderActionBuilder();
  ui.actionEditorModal.hidden = false;
  await syncCaptureMode();
  window.setTimeout(() => ui.actionTitleInput.focus(), 20);
}

async function closeActionEditor() {
  if (ui.actionEditorModal.hidden) return;
  actionEditor.recording = false;
  ui.actionEditorModal.hidden = true;
  await syncCaptureMode();
  returnFocus?.focus();
  returnFocus = null;
}

function normalizeActionHotkey(value) {
  const aliases = new Map([
    ['CONTROL', 'Ctrl'],
    ['CTRL', 'Ctrl'],
    ['ALT', 'Alt'],
    ['OPTION', 'Alt'],
    ['SHIFT', 'Shift'],
    ['WIN', 'Win'],
    ['WINDOWS', 'Win'],
    ['META', 'Win'],
    ['SUPER', 'Win']
  ]);
  const primaryAliases = new Map([
    ['RETURN', 'Enter'],
    ['ESC', 'Escape'],
    ['SPACEBAR', 'Space'],
    ['ARROWLEFT', 'Left'],
    ['ARROWRIGHT', 'Right'],
    ['ARROWUP', 'Up'],
    ['ARROWDOWN', 'Down']
  ]);
  const namedKeys = new Map([
    'BACKSPACE TAB ENTER PAUSE CAPSLOCK ESCAPE SPACE PAGEUP PAGEDOWN END HOME LEFT UP RIGHT DOWN INSERT DELETE'
      .split(' ')
      .map((key) => [key, `${key[0]}${key.slice(1).toLowerCase()}`])
  ]);
  namedKeys.set('PAGEUP', 'PageUp');
  namedKeys.set('PAGEDOWN', 'PageDown');
  namedKeys.set('CAPSLOCK', 'CapsLock');

  const parts = String(value || '').split('+').map((part) => part.trim()).filter(Boolean);
  if (!parts.length || parts.length > 5) return '';
  const modifiers = new Set();
  let primary = '';

  for (const part of parts) {
    const upper = part.toUpperCase();
    const modifier = aliases.get(upper);
    if (modifier) {
      modifiers.add(modifier);
      continue;
    }
    if (primary) return '';
    if (/^[A-Z0-9]$/.test(upper)) {
      primary = upper;
    } else if (/^F([1-9]|1[0-9]|2[0-4])$/.test(upper)) {
      primary = upper;
    } else {
      const normalizedName = primaryAliases.get(upper) || namedKeys.get(upper);
      if (!normalizedName) return '';
      primary = normalizedName;
    }
  }
  if (!primary) return '';
  return ['Ctrl', 'Alt', 'Shift', 'Win']
    .filter((modifier) => modifiers.has(modifier))
    .concat(primary)
    .join('+');
}

function serializeActionNode(node, options = {}) {
  const type = String(node?.type || '');
  const child = options.child === true;
  if (child && !actionChildTypes.has(type)) {
    throw new Error('Automasi bertingkat belum didukung.');
  }
  if (!child && !actionRootTypes.has(type)) {
    throw new Error('Pilih jenis aksi utama yang didukung.');
  }

  if (type === 'media') {
    const pad = padsForDeck(actionEditor.deckId).find((item) => item.id === node.padId);
    if (!pad || (pad.type !== 'audio' && pad.type !== 'video')) {
      throw new Error('Pilih pad audio atau video yang masih tersedia di deck ini.');
    }
    return { type, padId: pad.id };
  }

  if (type === 'open') {
    const target = String(node.target || '').trim();
    if (!target) throw new Error('Pilih file, aplikasi, atau folder yang akan dibuka.');
    return { type, target };
  }

  if (type === 'close') {
    const target = String(node.target || '').trim();
    if (!target) throw new Error('Pilih executable aplikasi yang akan ditutup.');
    return { type, target, force: Boolean(node.force) };
  }

  if (type === 'website') {
    const rawUrl = String(node.url || '').trim();
    let parsed;
    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new Error('Alamat website tidak valid. Contoh: https://example.com');
    }
    if (!allowedWebsiteProtocols.has(parsed.protocol)) {
      throw new Error('Protokol URL/URI ini belum didukung.');
    }
    if (['http:', 'https:'].includes(parsed.protocol) && !parsed.hostname) {
      throw new Error('Website HTTP(S) harus memiliki nama host yang valid.');
    }
    if (!['http:', 'https:'].includes(parsed.protocol) && rawUrl === parsed.protocol) {
      throw new Error('URI harus memiliki tujuan setelah nama protokol.');
    }
    return { type, url: parsed.href };
  }

  if (type === 'hotkey') {
    const hotkey = normalizeActionHotkey(node.hotkey);
    if (!hotkey) {
      throw new Error('Hotkey tidak valid. Contoh yang didukung: Ctrl+Shift+S.');
    }
    return { type, hotkey };
  }

  if (type === 'text') {
    const text = String(node.text || '');
    const pressEnter = Boolean(node.pressEnter);
    if (!text && !pressEnter) {
      throw new Error('Isi teks atau aktifkan opsi Tekan Enter.');
    }
    if (text.length > 4000) {
      throw new Error('Teks tidak boleh lebih dari 4000 karakter.');
    }
    return { type, text, pressEnter };
  }

  if (type === 'multimedia') {
    const command = String(node.command || '');
    if (!Object.hasOwn(multimediaCommands, command)) {
      throw new Error('Pilih perintah multimedia yang valid.');
    }
    return { type, command };
  }

  if (type === 'switch-deck') {
    const deckId = String(node.deckId || '');
    if (!library.decks.some((deck) => deck.id === deckId)) {
      throw new Error('Pilih deck tujuan yang masih tersedia.');
    }
    return { type, deckId };
  }

  if (type === 'delay') {
    const ms = Number(node.ms);
    if (!Number.isInteger(ms) || ms < 0 || ms > 60000) {
      throw new Error('Durasi jeda harus bilangan bulat antara 0 dan 60000 ms.');
    }
    return { type, ms };
  }

  if (automationTypes.has(type)) {
    const actions = Array.isArray(node.actions) ? node.actions : [];
    const maxSteps = actionStepLimit(type);
    if (type === 'toggle' && actions.length !== 2) {
      throw new Error('Aksi Beralih harus memiliki tepat dua keadaan.');
    }
    if (type !== 'toggle' && (actions.length < 1 || actions.length > maxSteps)) {
      const unit = type === 'random' ? 'pilihan' : 'langkah';
      throw new Error(`${actionTypeMeta[type].label} harus memiliki 1–${maxSteps} ${unit}.`);
    }
    const serializedActions = actions.map((childAction, index) => {
      try {
        return serializeActionNode(childAction, { child: true });
      } catch (error) {
        const unit = type === 'random' ? 'Pilihan' : (type === 'toggle' ? 'Keadaan' : 'Langkah');
        throw new Error(`${unit} ${index + 1}: ${cleanError(error)}`);
      }
    });
    const output = { type, actions: serializedActions };
    if (type === 'toggle') {
      output.id = String(node.id || createActionId());
    }
    return output;
  }

  throw new Error('Jenis aksi belum didukung.');
}

async function saveActionPad(event) {
  event.preventDefault();
  clearActionFormError();
  const title = ui.actionTitleInput.value.trim();
  if (!title) {
    showActionFormError('Masukkan nama pad aksi terlebih dahulu.', ui.actionTitleInput);
    return;
  }

  const conflict = actionPadHotkeyConflict(actionEditor.hotkey);
  if (conflict) {
    showActionFormError(
      `Hotkey ${actionEditor.hotkey} sudah digunakan oleh “${conflict.title}”.`,
      ui.actionHotkeyRecorder
    );
    return;
  }
  if (actionEditor.hotkey && actionEditor.hotkey === library.settings.stopAllHotkey) {
    showActionFormError(
      `${actionEditor.hotkey} dipakai sebagai hotkey Hentikan semua.`,
      ui.actionHotkeyRecorder
    );
    return;
  }

  let action;
  try {
    action = serializeActionNode(actionEditor.action);
  } catch (error) {
    showActionFormError(cleanError(error));
    return;
  }

  const input = {
    type: 'action',
    title,
    hotkey: actionEditor.hotkey,
    color: actionEditor.color,
    deckId: actionEditor.deckId || activeDeckId(),
    action
  };

  ui.saveActionButton.disabled = true;
  try {
    if (actionEditor.id) {
      ensureSuccess(
        await api.library.updatePad(actionEditor.id, input),
        'Perubahan aksi tidak dapat disimpan.'
      );
    } else {
      ensureSuccess(await api.library.addPad(input), 'Aksi tidak dapat ditambahkan.');
    }
    const message = actionEditor.id ? 'Perubahan aksi disimpan.' : 'Aksi berhasil ditambahkan ke deck.';
    await closeActionEditor();
    showToast(message);
  } catch (error) {
    const message = cleanError(error);
    showActionFormError(message);
    showToast(message, 'error');
  } finally {
    ui.saveActionButton.disabled = false;
  }
}

async function openDeckModal(mode) {
  const deck = activeDeck();
  if (mode === 'rename' && !deck) return;
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  deckEditorMode = mode === 'rename' ? 'rename' : 'add';
  const renaming = deckEditorMode === 'rename';
  ui.deckModalTitle.textContent = renaming ? 'Ubah nama deck' : 'Buat deck baru';
  ui.deckModalDescription.textContent = renaming
    ? 'Nama baru langsung terlihat pada selector deck.'
    : 'Beri nama yang mudah dikenali saat sedang live.';
  ui.deckTitleInput.value = renaming ? deck.title : '';
  ui.saveDeckButton.textContent = renaming ? 'Simpan nama' : 'Buat deck';
  ui.deckModal.hidden = false;
  await syncCaptureMode();
  window.setTimeout(() => {
    ui.deckTitleInput.focus();
    ui.deckTitleInput.select();
  }, 20);
}

async function closeDeckModal() {
  if (ui.deckModal.hidden) return;
  ui.deckModal.hidden = true;
  await syncCaptureMode();
  returnFocus?.focus();
  returnFocus = null;
}

async function saveDeck(event) {
  event.preventDefault();
  const title = ui.deckTitleInput.value.trim();
  if (!title) {
    showToast('Masukkan nama deck terlebih dahulu.', 'error');
    ui.deckTitleInput.focus();
    return;
  }

  ui.saveDeckButton.disabled = true;
  try {
    if (deckEditorMode === 'rename') {
      const deck = activeDeck();
      if (!deck) throw new Error('Deck aktif tidak ditemukan.');
      ensureSuccess(await api.library.renameDeck(deck.id, title), 'Nama deck tidak dapat diubah.');
      showToast('Nama deck diperbarui.');
    } else {
      const created = ensureSuccess(await api.library.addDeck(title), 'Deck baru tidak dapat dibuat.');
      if (created?.id) {
        ensureSuccess(await api.library.setActiveDeck(created.id), 'Deck baru tidak dapat dibuka.');
      }
      showToast('Deck baru berhasil dibuat.');
    }
    await closeDeckModal();
  } catch (error) {
    showToast(cleanError(error), 'error');
  } finally {
    ui.saveDeckButton.disabled = false;
  }
}

async function askDeletePad(id) {
  const pad = getPad(id);
  if (!pad) return;
  const isAction = pad.type === 'action';
  pendingConfirmation = { kind: 'pad', id };
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  ui.confirmTitle.textContent = isAction ? 'Hapus aksi?' : 'Hapus media?';
  ui.confirmMessage.textContent = isAction
    ? `Hapus aksi “${pad.title}” dari deck ini?`
    : `Hapus media “${pad.title}”? File asli di komputer tidak akan dihapus.`;
  ui.confirmDeleteButton.textContent = isAction ? 'Hapus aksi' : 'Hapus media';
  ui.confirmModal.hidden = false;
  await syncCaptureMode();
  ui.cancelDeleteButton.focus();
}

async function askDeleteDeck() {
  const deck = activeDeck();
  if (!deck) return;
  if (library.decks.length <= 1) {
    showToast('Deck terakhir tidak dapat dihapus.', 'error');
    return;
  }

  const padCount = padsForDeck(deck.id).length;
  pendingConfirmation = { kind: 'deck', id: deck.id };
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  ui.confirmTitle.textContent = 'Hapus deck?';
  ui.confirmMessage.textContent = padCount
    ? `Hapus “${deck.title}” beserta ${padCount} pad di dalamnya? File media asli tetap aman.`
    : `Hapus deck kosong “${deck.title}”?`;
  ui.confirmDeleteButton.textContent = 'Hapus deck';
  ui.confirmModal.hidden = false;
  await syncCaptureMode();
  ui.cancelDeleteButton.focus();
}

async function closeDeleteConfirmation() {
  if (ui.confirmModal.hidden) return;
  pendingConfirmation = null;
  ui.confirmModal.hidden = true;
  await syncCaptureMode();
  returnFocus?.focus();
  returnFocus = null;
}

async function confirmDelete() {
  if (!pendingConfirmation) return;
  const pending = { ...pendingConfirmation };
  ui.confirmDeleteButton.disabled = true;
  try {
    if (pending.kind === 'deck') {
      ensureSuccess(await api.library.deleteDeck(pending.id), 'Deck tidak dapat dihapus.');
      showToast('Deck dihapus. File media asli tetap aman.');
    } else {
      const deletedPad = getPad(pending.id);
      ensureSuccess(await api.library.deletePad(pending.id), 'Pad tidak dapat dihapus.');
      activePlaybackIds.delete(pending.id);
      playback.delete(pending.id);
      clearActionError(pending.id);
      if (playbackFocusId === pending.id) playbackFocusId = '';
      showToast(
        deletedPad?.type === 'action'
          ? 'Aksi dihapus dari deck.'
          : 'Media dihapus. File asli tetap aman.'
      );
    }
    await closeDeleteConfirmation();
  } catch (error) {
    showToast(cleanError(error), 'error');
  } finally {
    ui.confirmDeleteButton.disabled = false;
  }
}

function renderSettings() {
  const settings = library.settings;
  if (!settingsRecording) {
    ui.stopAllHotkeyValue.textContent = settings.stopAllHotkey || 'Belum diatur';
  }
  ui.launchAtLoginToggle.checked = Boolean(settings.launchAtLogin);
  ui.startMinimizedToggle.checked = Boolean(settings.startMinimized);
  ui.startMinimizedToggle.disabled = false;
  ui.appVersion.textContent = library.appInfo.version ? `v${library.appInfo.version}` : '—';
  ui.appDataPath.textContent = library.appInfo.dataPath || '—';
  ui.appDataPath.title = library.appInfo.dataPath || '';
}

async function openSettings() {
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  settingsRecording = false;
  ui.stopAllHotkeyRecorder.classList.remove('is-recording');
  ui.settingsModal.hidden = false;
  renderSettings();
  await syncCaptureMode();
  window.setTimeout(() => ui.closeSettingsButton.focus(), 20);
}

async function closeSettings() {
  if (ui.settingsModal.hidden) return;
  settingsRecording = false;
  ui.stopAllHotkeyRecorder.classList.remove('is-recording');
  ui.settingsModal.hidden = true;
  await syncCaptureMode();
  returnFocus?.focus();
  returnFocus = null;
}

function beginStopAllHotkeyRecording() {
  settingsRecording = true;
  settingsHotkeyBeforeRecording = library.settings.stopAllHotkey || '';
  ui.stopAllHotkeyRecorder.classList.add('is-recording');
  ui.stopAllHotkeyValue.textContent = 'Tekan tombol atau kombinasi…';
  ui.stopAllHotkeyHelp.textContent = 'Tekan Esc untuk membatalkan.';
  ui.stopAllHotkeyHelp.style.color = '';
  ui.stopAllHotkeyRecorder.focus();
}

function cancelStopAllHotkeyRecording() {
  settingsRecording = false;
  ui.stopAllHotkeyRecorder.classList.remove('is-recording');
  ui.stopAllHotkeyValue.textContent = settingsHotkeyBeforeRecording || 'Belum diatur';
  ui.stopAllHotkeyHelp.textContent = 'Klik lalu tekan tombol atau kombinasi yang ingin digunakan.';
  ui.stopAllHotkeyHelp.style.color = '';
}

async function saveStopAllHotkey(value) {
  const conflict = value
    ? activePads().find((pad) => pad.hotkey === value)
    : null;
  if (conflict) {
    cancelStopAllHotkeyRecording();
    ui.stopAllHotkeyHelp.textContent = `Tombol ini dipakai oleh pad “${conflict.title}”.`;
    ui.stopAllHotkeyHelp.style.color = '#ff8295';
    showToast(`Hotkey ${value} sudah digunakan oleh pad.`, 'error');
    return;
  }

  settingsRecording = false;
  ui.stopAllHotkeyRecorder.classList.remove('is-recording');
  ui.stopAllHotkeyValue.textContent = value || 'Belum diatur';
  ui.stopAllHotkeyRecorder.disabled = true;
  try {
    ensureSuccess(
      await api.library.updateSettings({ stopAllHotkey: value || '' }),
      'Hotkey Hentikan semua tidak dapat disimpan.'
    );
    ui.stopAllHotkeyHelp.textContent = value
      ? 'Hotkey darurat siap digunakan dari aplikasi mana pun.'
      : 'Klik lalu tekan tombol atau kombinasi yang ingin digunakan.';
    ui.stopAllHotkeyHelp.style.color = '';
    showToast(value ? 'Hotkey Hentikan semua disimpan.' : 'Hotkey Hentikan semua dihapus.');
  } catch (error) {
    ui.stopAllHotkeyValue.textContent = library.settings.stopAllHotkey || 'Belum diatur';
    showToast(cleanError(error), 'error');
  } finally {
    ui.stopAllHotkeyRecorder.disabled = false;
  }
}

async function updateBooleanSetting(input, key, successMessage) {
  const nextValue = input.checked;
  input.disabled = true;
  try {
    ensureSuccess(await api.library.updateSettings({ [key]: nextValue }), 'Pengaturan tidak dapat disimpan.');
    showToast(successMessage(nextValue));
  } catch (error) {
    input.checked = !nextValue;
    showToast(cleanError(error), 'error');
  } finally {
    input.disabled = false;
  }
}

async function runButtonTask(button, task) {
  button.disabled = true;
  button.classList.add('is-busy');
  try {
    await task();
  } catch (error) {
    showToast(cleanError(error), 'error');
  } finally {
    button.disabled = false;
    button.classList.remove('is-busy');
  }
}

function operationCanceled(result) {
  return Boolean(result?.canceled || result?.cancelled);
}

async function exportBackup() {
  await runButtonTask(ui.exportBackupButton, async () => {
    const result = ensureSuccess(await api.library.exportBackup(), 'Cadangan tidak dapat diekspor.');
    if (operationCanceled(result)) return;
    showToast(result?.filePath || result?.path
      ? `Cadangan disimpan di ${result.filePath || result.path}`
      : 'Cadangan berhasil diekspor.');
  });
}

async function importBackup() {
  await runButtonTask(ui.importBackupButton, async () => {
    const result = ensureSuccess(await api.library.importBackup(), 'Cadangan tidak dapat diimpor.');
    if (operationCanceled(result)) return;
    showToast('Cadangan berhasil dipulihkan.');
  });
}

async function checkForUpdates() {
  await runButtonTask(ui.checkUpdatesButton, async () => {
    const result = ensureSuccess(await api.library.checkForUpdates(), 'Pembaruan tidak dapat diperiksa.');
    if (result?.hasUpdate || result?.updateAvailable || result?.available) {
      const version = result.latestVersion || result.version;
      showToast(version
        ? `AERO DECK ${version} tersedia. Buka halaman rilis untuk mengunduh.`
        : 'Versi baru AERO DECK tersedia.');
      return;
    }
    showToast(result?.message || 'AERO DECK sudah menggunakan versi terbaru.');
  });
}

async function openDataFolder() {
  await runButtonTask(ui.openDataFolderButton, async () => {
    ensureSuccess(await api.library.openDataFolder(), 'Folder data tidak dapat dibuka.');
  });
}

async function openReleases() {
  await runButtonTask(ui.openReleasesButton, async () => {
    ensureSuccess(await api.library.openReleases(), 'Halaman rilis tidak dapat dibuka.');
  });
}

function beginPadDrag(event, id) {
  if (!event.currentTarget.draggable) {
    event.preventDefault();
    return;
  }
  draggedPadId = id;
  event.stopPropagation();
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('application/x-aero-deck-pad', id);
  event.dataTransfer.setData('text/plain', id);
  const card = event.currentTarget.closest('.pad-card');
  window.requestAnimationFrame(() => card?.classList.add('is-dragging'));
}

function endPadDrag() {
  draggedPadId = '';
  clearAllDropPositions();
  for (const card of ui.deckGrid.querySelectorAll('.pad-card')) {
    card.classList.remove('is-dragging');
  }
}

function dropAfterCard(event, card) {
  const rect = card.getBoundingClientRect();
  const mostlySameRow = Math.abs(event.clientY - (rect.top + rect.height / 2)) < rect.height * 0.35;
  return mostlySameRow
    ? event.clientX > rect.left + rect.width / 2
    : event.clientY > rect.top + rect.height / 2;
}

function handlePadDragOver(event) {
  if (!draggedPadId || event.currentTarget.dataset.padId === draggedPadId) return;
  event.preventDefault();
  event.stopPropagation();
  event.dataTransfer.dropEffect = 'move';
  clearAllDropPositions();
  event.currentTarget.classList.add(dropAfterCard(event, event.currentTarget) ? 'drop-after' : 'drop-before');
}

function clearDropPosition(event) {
  event.currentTarget.classList.remove('drop-before', 'drop-after');
}

function clearAllDropPositions() {
  for (const card of ui.deckGrid.querySelectorAll('.pad-card')) {
    card.classList.remove('drop-before', 'drop-after');
  }
}

async function handlePadDrop(event) {
  if (!draggedPadId) return;
  event.preventDefault();
  event.stopPropagation();
  const targetId = event.currentTarget.dataset.padId;
  const placeAfter = dropAfterCard(event, event.currentTarget);
  clearAllDropPositions();
  if (!targetId || targetId === draggedPadId) {
    endPadDrag();
    return;
  }

  await reorderPadRelativeTo(draggedPadId, targetId, placeAfter);
  endPadDrag();
}

async function reorderPadRelativeTo(sourceId, targetId, placeAfter) {
  const deckId = activeDeckId();
  const currentIds = activePads().map((pad) => pad.id);
  const sourceIndex = currentIds.indexOf(sourceId);
  if (sourceIndex < 0 || !currentIds.includes(targetId)) return;

  const orderedIds = currentIds.filter((id) => id !== sourceId);
  const targetIndex = orderedIds.indexOf(targetId);
  orderedIds.splice(targetIndex + (placeAfter ? 1 : 0), 0, sourceId);
  if (orderedIds.every((id, index) => id === currentIds[index])) return;

  const originalPads = [...library.pads];
  const byId = new Map(library.pads.map((pad) => [pad.id, pad]));
  const otherPads = library.pads.filter((pad) => !currentIds.includes(pad.id));
  library.pads = [...otherPads, ...orderedIds.map((id) => byId.get(id)).filter(Boolean)];
  renderLibrary();

  try {
    ensureSuccess(await api.library.reorderPads(deckId, orderedIds), 'Urutan pad tidak dapat disimpan.');
    showToast('Urutan pad disimpan.');
  } catch (error) {
    library.pads = originalPads;
    renderLibrary();
    showToast(cleanError(error), 'error');
  }
}

function handlePadReorderKeydown(event, id) {
  const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
  const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
  if (!backward && !forward) return;
  event.preventDefault();

  const ids = activePads().map((pad) => pad.id);
  const index = ids.indexOf(id);
  const nextIndex = Math.max(0, Math.min(ids.length - 1, index + (backward ? -1 : 1)));
  if (nextIndex === index) return;
  const targetId = ids[nextIndex];
  reorderPadRelativeTo(id, targetId, forward).then(() => {
    ui.deckGrid.querySelector(`[data-pad-id="${CSS.escape(id)}"] .pad-drag-handle`)?.focus();
  });
}

function hasExternalFiles(event) {
  return [...(event.dataTransfer?.types || [])].includes('Files');
}

function handleKeyboard(event) {
  if (!ui.actionEditorModal.hidden) {
    if (actionEditor.recording) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === 'Escape') {
        setActionEditorHotkey(actionEditor.hotkey);
        return;
      }
      const hotkey = localHotkeyFromEvent(event);
      if (hotkey) setActionEditorHotkey(hotkey);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeActionEditor();
    }
    return;
  }

  if (!ui.editorModal.hidden) {
    if (editor.recording) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === 'Escape') {
        setEditorHotkey(editor.hotkey);
        return;
      }
      const hotkey = localHotkeyFromEvent(event);
      if (hotkey) setEditorHotkey(hotkey);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeEditor();
    }
    return;
  }

  if (!ui.settingsModal.hidden) {
    if (settingsRecording) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === 'Escape') {
        cancelStopAllHotkeyRecording();
        return;
      }
      const hotkey = localHotkeyFromEvent(event);
      if (hotkey) saveStopAllHotkey(hotkey);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSettings();
    }
    return;
  }

  if (!ui.deckModal.hidden) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDeckModal();
    }
    return;
  }

  if (!ui.confirmModal.hidden) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDeleteConfirmation();
    }
    return;
  }

  if (!ui.guidePanel.hidden && event.key === 'Escape') {
    event.preventDefault();
    ui.guidePanel.hidden = true;
    ui.openPlayerGuide.focus();
    return;
  }

  if (event.ctrlKey && event.key === ',') {
    event.preventDefault();
    openSettings();
    return;
  }

  if (event.key === 'Escape' && activePlaybackIds.size) {
    event.preventDefault();
    stopAll();
    return;
  }

  const hotkey = localHotkeyFromEvent(event);
  if (hotkey && hotkey === library.settings.stopAllHotkey && !isFormTarget(event.target)) {
    if (!library.stopAllRegistration?.registered) {
      event.preventDefault();
      stopAll();
    }
    return;
  }

  const pad = hotkey ? activePads().find((item) => item.hotkey === hotkey) : null;
  if (pad) {
    const registration = registrationFor(pad);
    if (library.settings.globalHotkeysEnabled && registration?.registered) {
      return;
    }
    if (!isFormTarget(event.target)) {
      event.preventDefault();
      playPad(pad.id);
      return;
    }
  }

  if (event.ctrlKey && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    ui.searchInput.focus();
    ui.searchInput.select();
  }
}

function bindEvents() {
  ui.addPadButton.addEventListener('click', () => openEditor());
  ui.addActionButton.addEventListener('click', () => openActionEditor());
  ui.emptyAddButton.addEventListener('click', () => openEditor());
  ui.emptyAddActionButton.addEventListener('click', () => openActionEditor());
  ui.closeEditorButton.addEventListener('click', closeEditor);
  ui.cancelEditorButton.addEventListener('click', closeEditor);
  ui.mediaFileButton.addEventListener('click', chooseMedia);
  ui.padForm.addEventListener('submit', savePad);
  ui.closeActionEditorButton.addEventListener('click', closeActionEditor);
  ui.cancelActionEditorButton.addEventListener('click', closeActionEditor);
  ui.actionForm.addEventListener('submit', saveActionPad);
  ui.actionTypeSelect.addEventListener('change', () => {
    const nextType = ui.actionTypeSelect.value;
    if (!actionRootTypes.has(nextType)) return;
    actionEditor.action = defaultActionNode(nextType);
    clearActionFormError();
    renderActionBuilder();
  });
  ui.addActionStepButton.addEventListener('click', () => {
    const actions = actionEditor.action.actions;
    if (!automationTypes.has(actionEditor.action.type)
      || actionEditor.action.type === 'toggle'
      || !Array.isArray(actions)
      || actions.length >= actionStepLimit(actionEditor.action.type)) {
      return;
    }
    actions.push(defaultActionNode(preferredChildActionType()));
    clearActionFormError();
    renderActionBuilder();
    window.setTimeout(() => {
      ui.actionStepList.querySelector('.automation-step:last-child .step-type-select')?.focus();
    }, 0);
  });
  ui.actionHotkeyRecorder.addEventListener('click', () => {
    actionEditor.recording = true;
    ui.actionHotkeyRecorder.classList.add('is-recording');
    ui.actionHotkeyValue.textContent = 'Tekan tombol atau kombinasi…';
    ui.actionHotkeyRecorder.focus();
  });
  ui.clearActionHotkeyButton.addEventListener('click', () => setActionEditorHotkey(''));
  ui.stopAllButton.addEventListener('click', stopAll);
  ui.footerStopButton.addEventListener('click', stopAll);
  ui.searchInput.addEventListener('input', renderLibrary);
  ui.cancelDeleteButton.addEventListener('click', closeDeleteConfirmation);
  ui.confirmDeleteButton.addEventListener('click', confirmDelete);

  ui.addDeckButton.addEventListener('click', () => openDeckModal('add'));
  ui.renameDeckButton.addEventListener('click', () => openDeckModal('rename'));
  ui.deleteDeckButton.addEventListener('click', askDeleteDeck);
  ui.closeDeckModalButton.addEventListener('click', closeDeckModal);
  ui.cancelDeckButton.addEventListener('click', closeDeckModal);
  ui.deckForm.addEventListener('submit', saveDeck);

  ui.openSettingsButton.addEventListener('click', openSettings);
  ui.closeSettingsButton.addEventListener('click', closeSettings);
  ui.doneSettingsButton.addEventListener('click', closeSettings);
  ui.stopAllHotkeyRecorder.addEventListener('click', beginStopAllHotkeyRecording);
  ui.clearStopAllHotkeyButton.addEventListener('click', () => saveStopAllHotkey(''));
  ui.launchAtLoginToggle.addEventListener('change', () => updateBooleanSetting(
    ui.launchAtLoginToggle,
    'launchAtLogin',
    (enabled) => enabled ? 'AERO DECK akan berjalan bersama Windows.' : 'Startup bersama Windows dinonaktifkan.'
  ));
  ui.startMinimizedToggle.addEventListener('change', () => updateBooleanSetting(
    ui.startMinimizedToggle,
    'startMinimized',
    (enabled) => enabled ? 'AERO DECK akan mulai di system tray.' : 'Dashboard akan tampil saat aplikasi dimulai.'
  ));
  ui.exportBackupButton.addEventListener('click', exportBackup);
  ui.importBackupButton.addEventListener('click', importBackup);
  ui.checkUpdatesButton.addEventListener('click', checkForUpdates);
  ui.openDataFolderButton.addEventListener('click', openDataFolder);
  ui.openReleasesButton.addEventListener('click', openReleases);

  ui.hotkeyRecorder.addEventListener('click', () => {
    editor.recording = true;
    ui.hotkeyRecorder.classList.add('is-recording');
    ui.hotkeyValue.textContent = 'Tekan tombol atau kombinasi…';
    ui.hotkeyRecorder.focus();
  });

  ui.clearHotkeyButton.addEventListener('click', () => setEditorHotkey(''));

  for (const option of document.querySelectorAll('.type-option')) {
    option.addEventListener('click', () => {
      const nextType = option.dataset.type;
      if (editor.file && editor.file.type !== nextType) {
        setEditorFile(null);
        showToast('Pilih ulang file yang sesuai dengan jenis media.');
      }
      setEditorType(nextType);
    });
  }

  for (const option of ui.playbackModeOptions.querySelectorAll('[data-playback-mode]')) {
    option.addEventListener('click', () => setEditorPlaybackMode(option.dataset.playbackMode));
    option.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const options = [...ui.playbackModeOptions.querySelectorAll('[data-playback-mode]')];
      const current = options.indexOf(option);
      const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
      const next = options[(current + direction + options.length) % options.length];
      setEditorPlaybackMode(next.dataset.playbackMode);
      next.focus();
    });
  }

  for (const swatch of ui.colorOptions.querySelectorAll('.color-swatch')) {
    swatch.addEventListener('click', () => setEditorColor(swatch.dataset.color));
  }
  for (const swatch of ui.actionColorOptions.querySelectorAll('.color-swatch')) {
    swatch.addEventListener('click', () => setActionEditorColor(swatch.dataset.color));
  }

  ui.volumeInput.addEventListener('input', () => {
    ui.volumeValue.textContent = `${ui.volumeInput.value}%`;
  });

  ui.globalHotkeyToggle.addEventListener('change', async () => {
    const nextValue = ui.globalHotkeyToggle.checked;
    ui.globalHotkeyToggle.disabled = true;
    try {
      ensureSuccess(
        await api.library.updateSettings({ globalHotkeysEnabled: nextValue }),
        'Hotkey global tidak dapat diperbarui.'
      );
      showToast(nextValue ? 'Hotkey global aktif di latar belakang.' : 'Hotkey global dijeda.');
    } catch (error) {
      ui.globalHotkeyToggle.checked = !nextValue;
      showToast(cleanError(error), 'error');
    } finally {
      ui.globalHotkeyToggle.disabled = false;
    }
  });

  ui.openPlayerGuide.addEventListener('click', () => {
    ui.guidePanel.hidden = false;
    ui.closeGuideButton.focus();
  });
  ui.closeGuideButton.addEventListener('click', () => {
    ui.guidePanel.hidden = true;
    ui.openPlayerGuide.focus();
  });

  for (const button of document.querySelectorAll('[data-window-action]')) {
    button.addEventListener('click', () => api.window.action(button.dataset.windowAction));
  }

  ui.editorModal.addEventListener('mousedown', (event) => {
    if (event.target === ui.editorModal) closeEditor();
  });
  ui.actionEditorModal.addEventListener('mousedown', (event) => {
    if (event.target === ui.actionEditorModal) closeActionEditor();
  });
  ui.deckModal.addEventListener('mousedown', (event) => {
    if (event.target === ui.deckModal) closeDeckModal();
  });
  ui.settingsModal.addEventListener('mousedown', (event) => {
    if (event.target === ui.settingsModal) closeSettings();
  });

  document.addEventListener('keydown', handleKeyboard);

  window.addEventListener('dragenter', (event) => {
    if (!hasExternalFiles(event)) return;
    event.preventDefault();
    if (!ui.actionEditorModal.hidden
      || !ui.confirmModal.hidden
      || !ui.deckModal.hidden
      || !ui.settingsModal.hidden) return;
    dragDepth += 1;
    ui.dropOverlay.classList.add('is-visible');
  });
  window.addEventListener('dragover', (event) => {
    if (hasExternalFiles(event)) event.preventDefault();
  });
  window.addEventListener('dragleave', (event) => {
    if (!hasExternalFiles(event)) return;
    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) ui.dropOverlay.classList.remove('is-visible');
  });
  window.addEventListener('drop', (event) => {
    if (!hasExternalFiles(event)) return;
    event.preventDefault();
    dragDepth = 0;
    ui.dropOverlay.classList.remove('is-visible');
    if (!ui.actionEditorModal.hidden
      || !ui.confirmModal.hidden
      || !ui.deckModal.hidden
      || !ui.settingsModal.hidden) {
      showToast('Selesaikan dialog yang sedang terbuka terlebih dahulu.', 'error');
      return;
    }
    const file = event.dataTransfer?.files?.[0];
    if (file) inspectDroppedFile(file);
  });
}

function bindIpc() {
  api.library.onState((nextState) => {
    library = normalizeState(nextState);
    renderLibrary();
  });

  api.playback.onStatus((status) => {
    const previous = playback.get(status.id);
    const pad = getPad(status.id);
    const isAction = pad?.type === 'action';
    playback.set(status.id, status);

    if (!isAction && isPlaybackActive(status)) {
      activePlaybackIds.add(status.id);
      playbackFocusId = status.id;
    } else {
      activePlaybackIds.delete(status.id);
    }

    if (status.state === 'error') {
      if (isAction) {
        rememberActionError(status.id, status.error || 'Aksi tidak dapat dijalankan.');
      }
      showToast(
        status.error || (isAction ? 'Aksi tidak dapat dijalankan.' : 'Media tidak dapat diputar.'),
        'error'
      );
    } else if (isAction && status.state === 'loading') {
      clearActionError(status.id);
    }

    if (!previous
      || previous.state !== status.state
      || playbackCount(previous) !== playbackCount(status)) {
      renderLibrary();
    } else {
      updatePlaybackUi(status);
    }
  });

  api.window.onShown(() => {
    if (anyModalOpen()) {
      api.library.setCaptureMode(true);
    }
  });
}

async function start() {
  bindEvents();
  bindIpc();
  try {
    library = normalizeState(await api.library.getState());
    renderLibrary();
    document.documentElement.dataset.aeroDashboardReady = 'true';
  } catch (error) {
    showToast(`AERO DECK gagal memuat koleksi: ${cleanError(error)}`, 'error');
  }
}

start();
