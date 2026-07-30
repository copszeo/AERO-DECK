'use strict';

const api = window.aeroDeck;

const ui = {
  addPadButton: document.querySelector('#addPadButton'),
  cancelDeleteButton: document.querySelector('#cancelDeleteButton'),
  cancelEditorButton: document.querySelector('#cancelEditorButton'),
  clearHotkeyButton: document.querySelector('#clearHotkeyButton'),
  closeEditorButton: document.querySelector('#closeEditorButton'),
  closeGuideButton: document.querySelector('#closeGuideButton'),
  colorOptions: document.querySelector('#colorOptions'),
  confirmDeleteButton: document.querySelector('#confirmDeleteButton'),
  confirmMessage: document.querySelector('#confirmMessage'),
  confirmModal: document.querySelector('#confirmModal'),
  deckGrid: document.querySelector('#deckGrid'),
  dropOverlay: document.querySelector('#dropOverlay'),
  editorModal: document.querySelector('#editorModal'),
  editorTitle: document.querySelector('#editorTitle'),
  emptyAddButton: document.querySelector('#emptyAddButton'),
  emptyState: document.querySelector('#emptyState'),
  footerStopButton: document.querySelector('#footerStopButton'),
  globalHotkeyToggle: document.querySelector('#globalHotkeyToggle'),
  globalStatusMain: document.querySelector('#globalStatusMain'),
  globalStatusSide: document.querySelector('#globalStatusSide'),
  guidePanel: document.querySelector('#guidePanel'),
  hotkeyHealth: document.querySelector('#hotkeyHealth'),
  hotkeyHelp: document.querySelector('#hotkeyHelp'),
  hotkeyRecorder: document.querySelector('#hotkeyRecorder'),
  hotkeyValue: document.querySelector('#hotkeyValue'),
  loopInput: document.querySelector('#loopInput'),
  mediaFileButton: document.querySelector('#mediaFileButton'),
  nowPlaying: document.querySelector('#nowPlaying'),
  nowPlayingArt: document.querySelector('#nowPlayingArt'),
  nowPlayingTitle: document.querySelector('#nowPlayingTitle'),
  nowProgressBar: document.querySelector('#nowProgressBar'),
  nowTime: document.querySelector('#nowTime'),
  openPlayerGuide: document.querySelector('#openPlayerGuide'),
  padForm: document.querySelector('#padForm'),
  padTitleInput: document.querySelector('#padTitleInput'),
  registeredSummary: document.querySelector('#registeredSummary'),
  savePadButton: document.querySelector('#savePadButton'),
  searchInput: document.querySelector('#searchInput'),
  selectedFileMeta: document.querySelector('#selectedFileMeta'),
  selectedFileName: document.querySelector('#selectedFileName'),
  sidebarPadCount: document.querySelector('#sidebarPadCount'),
  singleKeyWarning: document.querySelector('#singleKeyWarning'),
  stopAllButton: document.querySelector('#stopAllButton'),
  toastStack: document.querySelector('#toastStack'),
  totalAudio: document.querySelector('#totalAudio'),
  totalPads: document.querySelector('#totalPads'),
  totalVideo: document.querySelector('#totalVideo'),
  visiblePadSummary: document.querySelector('#visiblePadSummary'),
  volumeInput: document.querySelector('#volumeInput'),
  volumeValue: document.querySelector('#volumeValue')
};

const colors = ['#7c5cff', '#1fc6a4', '#ff6b8a', '#ffad42', '#4c8dff', '#b861e8'];
const appShell = document.querySelector('.app-shell');

let library = {
  pads: [],
  registrations: {},
  settings: { globalHotkeysEnabled: true },
  captureMode: false
};
let editor = emptyEditor();
let pendingDeleteId = '';
let playback = new Map();
let currentPlaybackId = '';
let dragDepth = 0;
let returnFocus = null;

function emptyEditor() {
  return {
    id: '',
    type: 'audio',
    file: null,
    hotkey: '',
    color: colors[0],
    recording: false
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

function editIcon() {
  return svg([
    { d: 'm14 5 5 5M4 20l3.5-.8L18 8.7a2 2 0 0 0-2.7-2.7L4.8 16.5Z' }
  ]);
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

function cleanError(error) {
  const message = String(error?.message || error || 'Terjadi kesalahan.');
  return message
    .replace(/^Error invoking remote method '[^']+': Error:\s*/i, '')
    .replace(/^Error:\s*/i, '');
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

function getPad(id) {
  return library.pads.find((pad) => pad.id === id);
}

function registrationFor(pad) {
  return library.registrations?.[pad.id] || null;
}

function makePadCard(pad) {
  const status = playback.get(pad.id);
  const isPlaying = status && ['loading', 'playing'].includes(status.state);
  const article = document.createElement('article');
  article.className = [
    'pad-card',
    isPlaying ? 'is-playing' : '',
    !pad.exists ? 'is-missing' : ''
  ].filter(Boolean).join(' ');
  article.dataset.padId = pad.id;
  article.style.setProperty('--pad-color', pad.color);

  const hitArea = document.createElement('button');
  hitArea.type = 'button';
  hitArea.className = 'pad-hit-area';
  hitArea.setAttribute(
    'aria-label',
    `${pad.title}, ${pad.type === 'audio' ? 'audio' : 'video'}, hotkey ${pad.hotkey || 'belum diatur'}`
  );
  hitArea.addEventListener('click', () => playPad(pad.id));
  hitArea.addEventListener('keydown', (event) => {
    if (event.key === 'Delete') {
      event.preventDefault();
      askDelete(pad.id);
    }
    if (event.key === 'F2') {
      event.preventDefault();
      openEditor(pad);
    }
  });

  const top = document.createElement('span');
  top.className = 'pad-top';

  const badge = document.createElement('span');
  badge.className = 'media-badge';
  badge.append(pad.type === 'audio' ? audioIcon() : videoIcon());
  const badgeText = document.createElement('span');
  badgeText.textContent = pad.type;
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
  visual.append(pad.type === 'audio' ? audioIcon() : videoIcon());

  const copy = document.createElement('span');
  copy.className = 'pad-copy';
  const title = document.createElement('strong');
  title.textContent = pad.title;
  const fileName = document.createElement('span');
  fileName.textContent = pad.exists ? pad.fileName : 'File sumber tidak ditemukan';
  copy.append(title, fileName);

  hitArea.append(top, visual, copy);

  if (!pad.exists) {
    const missing = document.createElement('span');
    missing.className = 'missing-indicator';
    missing.textContent = '⚠ FILE HILANG';
    hitArea.append(missing);
  }

  const actions = document.createElement('div');
  actions.className = 'pad-actions';
  actions.append(
    padAction('Edit pad', editIcon(), () => openEditor(pad)),
    padAction('Tampilkan file', folderIcon(), () => revealPad(pad.id)),
    padAction('Hapus pad', trashIcon(), () => askDelete(pad.id), 'delete')
  );

  const progress = document.createElement('div');
  progress.className = 'pad-progress';
  const progressValue = document.createElement('span');
  const percentage = status?.duration ? (status.currentTime / status.duration) * 100 : 0;
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

function makeAddCard() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'add-pad-card';
  const plus = document.createElement('span');
  plus.textContent = '+';
  const title = document.createElement('strong');
  title.textContent = 'Tambah media';
  const subtitle = document.createElement('small');
  subtitle.textContent = 'Audio atau video';
  button.append(plus, title, subtitle);
  button.addEventListener('click', () => openEditor());
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
  const query = ui.searchInput.value.trim().toLocaleLowerCase('id');
  const visiblePads = library.pads.filter((pad) => {
    if (!query) return true;
    return `${pad.title} ${pad.fileName} ${pad.hotkey}`.toLocaleLowerCase('id').includes(query);
  });

  ui.deckGrid.replaceChildren();
  ui.emptyState.hidden = library.pads.length > 0 || Boolean(query);
  ui.deckGrid.hidden = library.pads.length === 0 && !query;

  if (query && visiblePads.length === 0) {
    ui.deckGrid.append(makeNoResults());
  } else {
    for (const pad of visiblePads) {
      ui.deckGrid.append(makePadCard(pad));
    }
    if (library.pads.length > 0 && !query) {
      ui.deckGrid.append(makeAddCard());
    }
  }

  const audioCount = library.pads.filter((pad) => pad.type === 'audio').length;
  const videoCount = library.pads.length - audioCount;
  ui.totalPads.textContent = String(library.pads.length);
  ui.totalAudio.textContent = String(audioCount);
  ui.totalVideo.textContent = String(videoCount);
  ui.sidebarPadCount.textContent = String(library.pads.length);
  ui.visiblePadSummary.textContent = query
    ? `${visiblePads.length} hasil`
    : `${library.pads.length} pad`;

  renderGlobalStatus();
  renderNowPlaying();
}

function renderGlobalStatus() {
  const enabled = Boolean(library.settings.globalHotkeysEnabled);
  const assigned = library.pads.filter((pad) => pad.hotkey);
  const registered = assigned.filter((pad) => registrationFor(pad)?.registered);
  const failed = assigned.filter((pad) => {
    const state = registrationFor(pad);
    return enabled && state && !state.registered && state.reason === 'unavailable';
  });

  ui.globalHotkeyToggle.checked = enabled;
  ui.hotkeyHealth.classList.toggle('has-error', failed.length > 0);

  if (library.captureMode) {
    ui.globalStatusMain.textContent = 'Hotkey dijeda sementara';
    ui.globalStatusSide.textContent = 'Dijeda';
    ui.registeredSummary.textContent = 'Editor sedang terbuka';
    ui.hotkeyHealth.lastChild.textContent = ' Dijeda saat mengedit';
    return;
  }

  if (!enabled) {
    ui.globalStatusMain.textContent = 'Hotkey global nonaktif';
    ui.globalStatusSide.textContent = 'Nonaktif';
    ui.registeredSummary.textContent = 'Pad hanya merespons saat aplikasi aktif';
    ui.hotkeyHealth.lastChild.textContent = ' Hotkey global dijeda';
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
      : 'Tambahkan hotkey pada media pad';
    ui.hotkeyHealth.lastChild.textContent = ' Semua sistem siap';
  }
}

function renderNowPlaying() {
  const status = playback.get(currentPlaybackId);
  const pad = getPad(currentPlaybackId);
  const visible = Boolean(pad && status && ['loading', 'playing', 'paused'].includes(status.state));
  ui.nowPlaying.hidden = !visible;
  if (!visible) return;

  ui.nowPlayingTitle.textContent = pad.title;
  ui.nowPlayingArt.style.setProperty('--now-color', pad.color);
  const percentage = status.duration ? (status.currentTime / status.duration) * 100 : 0;
  ui.nowProgressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
  ui.nowTime.textContent = `${formatTime(status.currentTime)} / ${formatTime(status.duration)}`;
}

function updatePlaybackUi(status) {
  const card = [...ui.deckGrid.querySelectorAll('.pad-card')]
    .find((element) => element.dataset.padId === status.id);
  if (card) {
    card.classList.toggle('is-playing', ['loading', 'playing'].includes(status.state));
    const progress = card.querySelector('.pad-progress span');
    if (progress) {
      const percentage = status.duration ? (status.currentTime / status.duration) * 100 : 0;
      progress.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
    }
  }
  renderNowPlaying();
}

async function playPad(id) {
  const pad = getPad(id);
  if (!pad) return;

  currentPlaybackId = id;
  playback.set(id, { id, state: 'loading', currentTime: 0, duration: 0 });
  renderLibrary();

  try {
    const result = await api.playback.playPad(id);
    if (!result?.ok && !result?.reported) {
      throw new Error(result?.error || 'Media tidak dapat diputar.');
    }
  } catch (error) {
    playback.set(id, { id, state: 'error', currentTime: 0, duration: 0 });
    renderLibrary();
    showToast(cleanError(error), 'error');
  }
}

async function stopAll() {
  try {
    await api.playback.stopAll();
    for (const [id, status] of playback) {
      playback.set(id, { ...status, state: 'stopped', currentTime: 0 });
    }
    currentPlaybackId = '';
    renderLibrary();
  } catch (error) {
    showToast(cleanError(error), 'error');
  }
}

async function revealPad(id) {
  try {
    await api.library.revealPad(id);
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

function setEditorHotkey(value) {
  editor.hotkey = value || '';
  editor.recording = false;
  ui.hotkeyRecorder.classList.remove('is-recording');
  ui.hotkeyValue.textContent = editor.hotkey || 'Tekan tombol...';
  ui.singleKeyWarning.hidden = !editor.hotkey || editor.hotkey.includes('+');

  const conflict = library.pads.find(
    (pad) => pad.id !== editor.id && pad.hotkey && pad.hotkey === editor.hotkey
  );
  ui.hotkeyHelp.textContent = conflict
    ? `Tombol ini sudah digunakan oleh “${conflict.title}”.`
    : 'Bisa A–Z, 0–9, F1–F12, atau kombinasi Ctrl/Alt/Shift.';
  ui.hotkeyHelp.style.color = conflict ? '#ff8295' : '';
}

function setEditorColor(color) {
  editor.color = colors.includes(color) ? color : colors[0];
  for (const swatch of ui.colorOptions.querySelectorAll('.color-swatch')) {
    swatch.classList.toggle('is-selected', swatch.dataset.color === editor.color);
  }
}

async function openEditor(pad = null, selectedFile = null) {
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  editor = emptyEditor();
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
  ui.editorModal.hidden = false;
  appShell.inert = true;

  try {
    await api.library.setCaptureMode(true);
  } catch (error) {
    showToast(cleanError(error), 'error');
  }
  window.setTimeout(() => (pad ? ui.padTitleInput : ui.mediaFileButton).focus(), 20);
}

async function closeEditor() {
  if (ui.editorModal.hidden) return;
  editor.recording = false;
  ui.editorModal.hidden = true;
  appShell.inert = false;
  try {
    await api.library.setCaptureMode(false);
  } catch (error) {
    showToast(cleanError(error), 'error');
  }
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

  const conflict = library.pads.find(
    (pad) => pad.id !== editor.id && pad.hotkey && pad.hotkey === editor.hotkey
  );
  if (conflict) {
    showToast(`Hotkey ${editor.hotkey} sudah digunakan oleh “${conflict.title}”.`, 'error');
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
    loop: ui.loopInput.checked
  };

  ui.savePadButton.disabled = true;
  try {
    if (editor.id) {
      await api.library.updatePad(editor.id, input);
    } else {
      await api.library.addPad(input);
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

async function askDelete(id) {
  const pad = getPad(id);
  if (!pad) return;
  pendingDeleteId = id;
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  ui.confirmMessage.textContent = `Hapus pad “${pad.title}”? File asli di komputer tidak akan dihapus.`;
  ui.confirmModal.hidden = false;
  appShell.inert = true;
  await api.library.setCaptureMode(true);
  ui.cancelDeleteButton.focus();
}

async function closeDeleteConfirmation() {
  if (ui.confirmModal.hidden) return;
  pendingDeleteId = '';
  ui.confirmModal.hidden = true;
  appShell.inert = false;
  await api.library.setCaptureMode(false);
  returnFocus?.focus();
  returnFocus = null;
}

async function deletePad() {
  if (!pendingDeleteId) return;
  const id = pendingDeleteId;
  try {
    await api.library.deletePad(id);
    if (currentPlaybackId === id) await stopAll();
    await closeDeleteConfirmation();
    showToast('Pad dihapus. File asli tetap aman.');
  } catch (error) {
    showToast(cleanError(error), 'error');
  }
}

function handleKeyboard(event) {
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

  if (!ui.confirmModal.hidden) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDeleteConfirmation();
    }
    return;
  }

  if (event.key === 'Escape' && currentPlaybackId) {
    event.preventDefault();
    stopAll();
    return;
  }

  const hotkey = localHotkeyFromEvent(event);
  const pad = hotkey ? library.pads.find((item) => item.hotkey === hotkey) : null;
  if (pad) {
    const registration = registrationFor(pad);
    if (library.settings.globalHotkeysEnabled && registration?.registered) {
      // The main process owns this key while global hotkeys are enabled.
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
    return;
  }

  if (isFormTarget(event.target) || !hotkey) return;
}

function bindEvents() {
  ui.addPadButton.addEventListener('click', () => openEditor());
  ui.emptyAddButton.addEventListener('click', () => openEditor());
  ui.closeEditorButton.addEventListener('click', closeEditor);
  ui.cancelEditorButton.addEventListener('click', closeEditor);
  ui.mediaFileButton.addEventListener('click', chooseMedia);
  ui.padForm.addEventListener('submit', savePad);
  ui.stopAllButton.addEventListener('click', stopAll);
  ui.footerStopButton.addEventListener('click', stopAll);
  ui.searchInput.addEventListener('input', renderLibrary);
  ui.cancelDeleteButton.addEventListener('click', closeDeleteConfirmation);
  ui.confirmDeleteButton.addEventListener('click', deletePad);

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

  for (const swatch of ui.colorOptions.querySelectorAll('.color-swatch')) {
    swatch.addEventListener('click', () => setEditorColor(swatch.dataset.color));
  }

  ui.volumeInput.addEventListener('input', () => {
    ui.volumeValue.textContent = `${ui.volumeInput.value}%`;
  });

  ui.globalHotkeyToggle.addEventListener('change', async () => {
    ui.globalHotkeyToggle.disabled = true;
    try {
      await api.library.setGlobalHotkeys(ui.globalHotkeyToggle.checked);
      showToast(
        ui.globalHotkeyToggle.checked
          ? 'Hotkey global aktif di latar belakang.'
          : 'Hotkey global dijeda.'
      );
    } catch (error) {
      ui.globalHotkeyToggle.checked = !ui.globalHotkeyToggle.checked;
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
  });

  for (const button of document.querySelectorAll('[data-window-action]')) {
    button.addEventListener('click', () => api.window.action(button.dataset.windowAction));
  }

  document.addEventListener('keydown', handleKeyboard);

  window.addEventListener('dragenter', (event) => {
    event.preventDefault();
    if (!ui.confirmModal.hidden) return;
    dragDepth += 1;
    ui.dropOverlay.classList.add('is-visible');
  });
  window.addEventListener('dragover', (event) => event.preventDefault());
  window.addEventListener('dragleave', (event) => {
    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) ui.dropOverlay.classList.remove('is-visible');
  });
  window.addEventListener('drop', (event) => {
    event.preventDefault();
    dragDepth = 0;
    ui.dropOverlay.classList.remove('is-visible');
    if (!ui.confirmModal.hidden) {
      showToast('Selesaikan konfirmasi yang sedang terbuka terlebih dahulu.', 'error');
      return;
    }
    const file = event.dataTransfer?.files?.[0];
    if (file) inspectDroppedFile(file);
  });
}

function bindIpc() {
  api.library.onState((nextState) => {
    library = nextState;
    renderLibrary();
  });

  api.playback.onStatus((status) => {
    const previous = playback.get(status.id);
    playback.set(status.id, status);
    if (['loading', 'playing', 'paused'].includes(status.state)) {
      currentPlaybackId = status.id;
    }
    if (status.state === 'error') {
      showToast(status.error || 'Media tidak dapat diputar.', 'error');
    }
    if (['ended', 'stopped', 'error'].includes(status.state) && currentPlaybackId === status.id) {
      currentPlaybackId = '';
    }
    if (!previous || previous.state !== status.state) {
      renderLibrary();
    } else {
      updatePlaybackUi(status);
    }
  });

  api.window.onShown(() => {
    if (!ui.editorModal.hidden || !ui.confirmModal.hidden) {
      api.library.setCaptureMode(true);
    }
  });
}

async function start() {
  bindEvents();
  bindIpc();
  try {
    library = await api.library.getState();
    renderLibrary();
  } catch (error) {
    showToast(`AERO DECK gagal memuat koleksi: ${cleanError(error)}`, 'error');
  }
}

start();
