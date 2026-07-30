'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { normalizeHotkey } = require('./hotkey');
const { classifyMedia } = require('./media');
const { validateAction } = require('./action-runner');

const SCHEMA_VERSION = 3;
const LIBRARY_LIMITS = Object.freeze({
  maxDecks: 100,
  maxPads: 1000
});
const DEFAULT_STOP_ALL_HOTKEY = 'Ctrl+Alt+F12';
const DEFAULT_COLORS = ['#7c5cff', '#1fc6a4', '#ff6b8a', '#ffad42', '#4c8dff', '#b861e8'];
const PLAYBACK_MODES = new Set(['exclusive', 'restart', 'toggle', 'overlap']);
const MEDIA_TYPES = new Set(['audio', 'video']);
const SUPPORTED_TYPES = new Set([...MEDIA_TYPES, 'action']);
const STORED_ACTION_ROOT_TYPES = new Set([
  'open',
  'close',
  'website',
  'hotkey',
  'text',
  'multimedia',
  'switch-deck',
  'sequence',
  'parallel',
  'random',
  'toggle'
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function cleanTitle(value, fallback = 'Media tanpa nama') {
  const title = String(value ?? '').trim().replace(/\s+/g, ' ');
  return (title || fallback).slice(0, 64);
}

function cleanDeckTitle(value, fallback = '') {
  return cleanTitle(value, fallback);
}

function cleanColor(value) {
  const color = String(value ?? '').trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : DEFAULT_COLORS[0];
}

function cleanEntityId(value, label) {
  if (typeof value !== 'string') {
    throw new Error(`${label} tidak valid.`);
  }
  const id = value.trim();
  if (
    !id
    || id !== value
    || id.length > 128
    || !/^[a-z0-9][a-z0-9._:-]*$/i.test(id)
    || ['__proto__', 'constructor', 'prototype'].includes(id.toLowerCase())
  ) {
    throw new Error(`${label} tidak valid.`);
  }
  return id;
}

function cleanVolume(value) {
  const volume = Number(value);
  if (!Number.isFinite(volume)) {
    return 1;
  }
  return Math.min(1, Math.max(0, volume));
}

function createDeck(title = 'Deck utama') {
  return {
    id: randomUUID(),
    title: cleanDeckTitle(title, 'Deck utama')
  };
}

function createDefaultData() {
  const deck = createDeck();
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: {
      globalHotkeysEnabled: true,
      stopAllHotkey: DEFAULT_STOP_ALL_HOTKEY,
      launchAtLogin: false,
      startMinimized: false,
      activeDeckId: deck.id
    },
    decks: [deck],
    pads: []
  };
}

function walkAction(action, visit) {
  visit(action);
  if (!Array.isArray(action.actions)) {
    return;
  }
  for (const child of action.actions) {
    walkAction(child, visit);
  }
}

function sanitizeStoredAction(input) {
  const action = validateAction(input);
  if (!STORED_ACTION_ROOT_TYPES.has(action.type)) {
    throw new Error(
      `Jenis aksi "${action.type}" tidak dapat digunakan sebagai aksi utama pad.`
    );
  }

  walkAction(action, (child) => {
    if (child.type === 'open' || child.type === 'close') {
      if (/^(?:\\\\|\/\/)/.test(child.target)) {
        throw new Error('Target jaringan atau device path tidak didukung.');
      }
      if (
        !path.isAbsolute(child.target)
        && !/^[a-z]:[\\/]/i.test(child.target)
      ) {
        throw new Error('Target aplikasi, file, atau folder harus berupa path absolut.');
      }
    }
    if (child.type !== 'media') {
      return;
    }
    if (child.mediaPath) {
      throw new Error(
        'Aksi media pada pad action harus merujuk padId; mediaPath langsung tidak diizinkan.'
      );
    }
    if (!child.padId) {
      throw new Error('Aksi media pada pad action wajib merujuk padId.');
    }
  });

  return action;
}

function sanitizePad(input, existing = {}, options = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Data pad tidak valid.');
  }

  const type = String(input.type ?? existing.type ?? '').toLowerCase();
  const hotkeyInput = input.hotkey ?? existing.hotkey ?? '';
  const hotkey = hotkeyInput ? normalizeHotkey(hotkeyInput) : '';
  const deckId = cleanEntityId(
    input.deckId ?? existing.deckId ?? options.defaultDeckId ?? randomUUID(),
    'Deck pad'
  );
  if (!SUPPORTED_TYPES.has(type)) {
    throw new Error('Jenis media harus audio atau video, atau gunakan jenis action.');
  }
  if (hotkeyInput && !hotkey) {
    throw new Error('Hotkey tidak didukung. Gunakan huruf, angka, F1–F12, atau kombinasinya.');
  }
  if (!deckId) {
    throw new Error('Deck pad tidak valid.');
  }

  const now = new Date().toISOString();
  const createdAt = existing.createdAt || now;
  const common = {
    id: existing.id ? cleanEntityId(existing.id, 'ID pad') : randomUUID(),
    title: '',
    type,
    hotkey,
    color: cleanColor(input.color ?? existing.color),
    deckId,
    createdAt,
    updatedAt: options.preserveTimestamps ? (existing.updatedAt || createdAt) : now
  };

  if (type === 'action') {
    const actionInput = Object.hasOwn(input, 'action') ? input.action : existing.action;
    return {
      ...common,
      title: cleanTitle(input.title ?? existing.title, 'Aksi tanpa nama'),
      action: sanitizeStoredAction(actionInput)
    };
  }

  const mediaPath = String(input.mediaPath ?? existing.mediaPath ?? '').trim();
  const detectedType = classifyMedia(mediaPath);
  const playbackMode = String(
    input.playbackMode ?? existing.playbackMode ?? 'exclusive'
  ).toLowerCase();

  if (/^(?:\\\\|\/\/)/.test(mediaPath)) {
    throw new Error('Lokasi media jaringan atau device path tidak didukung.');
  }
  if (!path.isAbsolute(mediaPath)) {
    throw new Error('Lokasi file media tidak valid.');
  }
  if (!detectedType || detectedType !== type) {
    throw new Error('Jenis media tidak sesuai dengan format file.');
  }
  if (!PLAYBACK_MODES.has(playbackMode)) {
    throw new Error('Mode playback tidak didukung.');
  }

  return {
    ...common,
    title: cleanTitle(input.title ?? existing.title, path.parse(mediaPath).name),
    mediaPath,
    volume: cleanVolume(input.volume ?? existing.volume),
    loop: Boolean(input.loop ?? existing.loop ?? false),
    playbackMode
  };
}

function sanitizeStoredDeck(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Data deck tidak valid.');
  }
  const id = cleanEntityId(input.id, 'ID deck');
  const title = cleanDeckTitle(input.title);
  if (!id) {
    throw new Error('ID deck tidak valid.');
  }
  if (!title) {
    throw new Error('Judul deck tidak boleh kosong.');
  }
  return { id, title };
}

function normalizeStopAllHotkey(value) {
  if (String(value ?? '').trim() === '') {
    return '';
  }
  const normalized = normalizeHotkey(value);
  if (!normalized) {
    throw new Error('Hotkey Stop All tidak didukung.');
  }
  return normalized;
}

function hasStopAllConflict(data) {
  return data.pads.some(
    (pad) => pad.deckId === data.settings.activeDeckId &&
      pad.hotkey &&
      pad.hotkey === data.settings.stopAllHotkey
  );
}

function findAvailableStopAllHotkey(data) {
  const primaryKeys = [
    ...Array.from({ length: 12 }, (_, index) => `F${12 - index}`),
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    ...'0123456789'
  ];
  const prefixes = [
    'Ctrl+Alt',
    'Ctrl+Shift',
    'Alt+Shift',
    'Ctrl+Alt+Shift',
    'Ctrl+Alt+Shift+Win'
  ];
  const used = new Set(
    data.pads
      .filter((pad) => pad.deckId === data.settings.activeDeckId && pad.hotkey)
      .map((pad) => pad.hotkey)
  );

  for (const prefix of prefixes) {
    for (const key of primaryKeys) {
      const candidate = normalizeHotkey(`${prefix}+${key}`);
      if (candidate && !used.has(candidate)) {
        return candidate;
      }
    }
  }
  return '';
}

function collectActionReferences(pad) {
  if (pad.type !== 'action') {
    return [];
  }

  const references = [];
  walkAction(pad.action, (action) => {
    if (action.type === 'media') {
      references.push({
        kind: 'media',
        padId: action.padId
      });
    } else if (action.type === 'switch-deck') {
      references.push({
        kind: 'deck',
        deckId: action.deckId
      });
    }
  });
  return references;
}

function createLibraryReferenceIndex(data) {
  return {
    deckIds: new Set(data.decks.map((deck) => deck.id)),
    padsById: new Map(data.pads.map((pad) => [pad.id, pad]))
  };
}

function validatePadActionReferences(
  pad,
  data,
  index = createLibraryReferenceIndex(data)
) {
  if (pad.type !== 'action') {
    return;
  }

  for (const reference of collectActionReferences(pad)) {
    if (reference.kind === 'deck') {
      if (!index.deckIds.has(reference.deckId)) {
        throw new Error(
          `Aksi “${pad.title}” merujuk deck yang tidak ditemukan: ${reference.deckId}.`
        );
      }
      continue;
    }

    const mediaPad = index.padsById.get(reference.padId);
    if (!mediaPad) {
      throw new Error(
        `Aksi “${pad.title}” merujuk pad media yang tidak ditemukan: ${reference.padId}.`
      );
    }
    if (!MEDIA_TYPES.has(mediaPad.type)) {
      throw new Error(
        `Aksi “${pad.title}” harus merujuk pad audio atau video: ${reference.padId}.`
      );
    }
    if (mediaPad.deckId !== pad.deckId) {
      throw new Error(
        `Aksi “${pad.title}” hanya dapat merujuk pad media pada deck yang sama.`
      );
    }
  }
}

function validateLibraryReferences(data) {
  const index = createLibraryReferenceIndex(data);
  for (const pad of data.pads) {
    validatePadActionReferences(pad, data, index);
  }
}

function normalizeLibrary(payload, options = {}) {
  const strict = options.strict === true;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Format library tidak valid.');
  }

  const sourceVersion = Number(payload.schemaVersion ?? 1);
  if (![1, 2, SCHEMA_VERSION].includes(sourceVersion)) {
    throw new Error(`Schema library versi ${payload.schemaVersion} tidak didukung.`);
  }

  let recovered = false;
  const decks = [];
  const deckIds = new Set();

  if (sourceVersion === 1) {
    decks.push(createDeck());
    deckIds.add(decks[0].id);
  } else {
    if (!Array.isArray(payload.decks)) {
      if (strict) throw new Error('Daftar deck tidak valid.');
      recovered = true;
    } else {
      if (strict && payload.decks.length > LIBRARY_LIMITS.maxDecks) {
        throw new Error(`Library dibatasi ${LIBRARY_LIMITS.maxDecks} deck.`);
      }
      const storedDecks = payload.decks.slice(0, LIBRARY_LIMITS.maxDecks);
      if (storedDecks.length !== payload.decks.length) recovered = true;
      for (const storedDeck of storedDecks) {
        try {
          const deck = sanitizeStoredDeck(storedDeck);
          if (deckIds.has(deck.id)) {
            throw new Error(`ID deck duplikat: ${deck.id}`);
          }
          deckIds.add(deck.id);
          decks.push(deck);
        } catch (error) {
          if (strict) throw error;
          recovered = true;
        }
      }
    }

    if (decks.length === 0) {
      if (strict) throw new Error('Library harus memiliki setidaknya satu deck.');
      const deck = createDeck();
      decks.push(deck);
      deckIds.add(deck.id);
      recovered = true;
    }
  }

  const parsedSettings = payload.settings && typeof payload.settings === 'object'
    ? payload.settings
    : {};
  if (strict && (!payload.settings || typeof payload.settings !== 'object' || Array.isArray(payload.settings))) {
    throw new Error('Pengaturan library tidak valid.');
  }

  if (strict) {
    for (const key of ['globalHotkeysEnabled', 'launchAtLogin', 'startMinimized']) {
      if (parsedSettings[key] !== undefined && typeof parsedSettings[key] !== 'boolean') {
        throw new Error(`Pengaturan ${key} harus berupa boolean.`);
      }
    }
  }

  let stopAllHotkey;
  try {
    stopAllHotkey = normalizeStopAllHotkey(
      parsedSettings.stopAllHotkey ?? DEFAULT_STOP_ALL_HOTKEY
    );
  } catch (error) {
    if (strict) throw error;
    stopAllHotkey = DEFAULT_STOP_ALL_HOTKEY;
    recovered = true;
  }

  let activeDeckId;
  try {
    activeDeckId = sourceVersion === 1
      ? decks[0].id
      : cleanEntityId(parsedSettings.activeDeckId, 'ID deck aktif');
  } catch (error) {
    if (strict) throw error;
    activeDeckId = decks[0].id;
    recovered = true;
  }
  if (!deckIds.has(activeDeckId)) {
    if (strict) {
      throw new Error('Deck aktif tidak ditemukan.');
    }
    activeDeckId = decks[0].id;
    recovered = true;
  }

  const data = {
    schemaVersion: SCHEMA_VERSION,
    settings: {
      globalHotkeysEnabled: parsedSettings.globalHotkeysEnabled !== false,
      stopAllHotkey,
      launchAtLogin: parsedSettings.launchAtLogin === true,
      startMinimized: parsedSettings.startMinimized === true,
      activeDeckId
    },
    decks,
    pads: []
  };

  if (!Array.isArray(payload.pads)) {
    if (strict) throw new Error('Daftar pad tidak valid.');
    recovered = true;
  } else {
    if (strict && payload.pads.length > LIBRARY_LIMITS.maxPads) {
      throw new Error(`Library dibatasi ${LIBRARY_LIMITS.maxPads} pad.`);
    }
    const padIds = new Set();
    const hotkeysByDeck = new Map();
    const storedPads = payload.pads.slice(0, LIBRARY_LIMITS.maxPads);
    if (storedPads.length !== payload.pads.length) recovered = true;

    for (const storedPad of storedPads) {
      try {
        if (!storedPad || typeof storedPad !== 'object' || Array.isArray(storedPad)) {
          throw new Error('Data pad tidak valid.');
        }
        if (strict) {
          cleanEntityId(storedPad.id, 'ID pad');
          if (sourceVersion >= 2) {
            cleanEntityId(storedPad.deckId, 'Deck pad');
          }
        }
        const source = sourceVersion === 1
          ? { ...storedPad, deckId: decks[0].id, playbackMode: storedPad.playbackMode ?? 'exclusive' }
          : storedPad;
        const pad = sanitizePad(source, source, {
          defaultDeckId: decks[0].id,
          preserveTimestamps: true
        });

        if (!pad.id || padIds.has(pad.id)) {
          throw new Error(`ID pad duplikat: ${pad.id}`);
        }
        if (!deckIds.has(pad.deckId)) {
          throw new Error(`Deck pad tidak ditemukan: ${pad.deckId}`);
        }

        const usedHotkeys = hotkeysByDeck.get(pad.deckId) || new Set();
        if (pad.hotkey && usedHotkeys.has(pad.hotkey)) {
          throw new Error(`Hotkey pad duplikat di deck: ${pad.hotkey}`);
        }
        padIds.add(pad.id);
        if (pad.hotkey) usedHotkeys.add(pad.hotkey);
        hotkeysByDeck.set(pad.deckId, usedHotkeys);
        data.pads.push(pad);
      } catch (error) {
        if (strict) throw error;
        recovered = true;
      }
    }
  }

  if (strict) {
    validateLibraryReferences(data);
  } else {
    const validPads = [];
    const index = createLibraryReferenceIndex(data);
    for (const pad of data.pads) {
      try {
        validatePadActionReferences(pad, data, index);
        validPads.push(pad);
      } catch {
        recovered = true;
      }
    }
    data.pads = validPads;
  }

  if (hasStopAllConflict(data)) {
    if (strict && sourceVersion === SCHEMA_VERSION) {
      throw new Error(`Hotkey Stop All ${data.settings.stopAllHotkey} sudah digunakan pada deck aktif.`);
    }
    const replacement = findAvailableStopAllHotkey(data);
    if (!replacement) {
      throw new Error('Tidak ada hotkey yang tersedia untuk Stop All.');
    }
    data.settings.stopAllHotkey = replacement;
    recovered = true;
  }

  return {
    data,
    migrated: sourceVersion !== SCHEMA_VERSION,
    recovered
  };
}

class PadStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = createDefaultData();
  }

  load() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    if (!fs.existsSync(this.filePath)) {
      this.save();
      return this.snapshot();
    }

    try {
      const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      const result = normalizeLibrary(parsed);
      this.data = result.data;
      this.assertUniquePads();

      if (result.recovered) {
        this.backupCurrentFile('recovered');
      }
      if (result.migrated || result.recovered) {
        this.save();
      }
    } catch {
      this.backupCurrentFile('corrupt');
      this.data = createDefaultData();
      this.save();
    }

    return this.snapshot();
  }

  snapshot() {
    return clone(this.data);
  }

  getActiveDeck() {
    const deck = this.data.decks.find(
      (item) => item.id === this.data.settings.activeDeckId
    );
    return deck ? clone(deck) : null;
  }

  getPad(id) {
    const pad = this.data.pads.find((item) => item.id === id);
    return pad ? clone(pad) : null;
  }

  addDeck(title) {
    const clean = cleanDeckTitle(title);
    if (!clean) {
      throw new Error('Judul deck tidak boleh kosong.');
    }
    const deck = createDeck(clean);
    const next = clone(this.data);
    next.decks.push(deck);
    this.commit(next);
    return clone(deck);
  }

  renameDeck(id, title) {
    const index = this.data.decks.findIndex((deck) => deck.id === id);
    if (index === -1) {
      throw new Error('Deck tidak ditemukan.');
    }
    const clean = cleanDeckTitle(title);
    if (!clean) {
      throw new Error('Judul deck tidak boleh kosong.');
    }
    const next = clone(this.data);
    next.decks[index].title = clean;
    this.commit(next);
    return clone(next.decks[index]);
  }

  deleteDeck(id) {
    const index = this.data.decks.findIndex((deck) => deck.id === id);
    if (index === -1) {
      throw new Error('Deck tidak ditemukan.');
    }
    if (this.data.decks.length === 1) {
      throw new Error('Deck terakhir tidak dapat dihapus.');
    }

    for (const pad of this.data.pads) {
      if (pad.deckId === id || pad.type !== 'action') {
        continue;
      }
      for (const reference of collectActionReferences(pad)) {
        if (reference.kind === 'deck' && reference.deckId === id) {
          throw new Error(
            `Deck masih digunakan oleh aksi “${pad.title}” pada deck lain.`
          );
        }
        if (reference.kind === 'media') {
          const target = this.data.pads.find((item) => item.id === reference.padId);
          if (target?.deckId === id) {
            throw new Error(
              `Media dalam deck masih digunakan oleh aksi “${pad.title}” pada deck lain.`
            );
          }
        }
      }
    }

    const next = clone(this.data);
    const [removed] = next.decks.splice(index, 1);
    next.pads = next.pads.filter((pad) => pad.deckId !== id);
    if (next.settings.activeDeckId === id) {
      next.settings.activeDeckId = next.decks[0].id;
      if (hasStopAllConflict(next)) {
        throw new Error('Deck pengganti memiliki hotkey yang konflik dengan Stop All.');
      }
    }
    this.commit(next);
    return clone(removed);
  }

  setActiveDeck(id) {
    if (!this.data.decks.some((deck) => deck.id === id)) {
      throw new Error('Deck tidak ditemukan.');
    }
    const next = clone(this.data);
    next.settings.activeDeckId = id;
    if (hasStopAllConflict(next)) {
      throw new Error(`Hotkey Stop All ${next.settings.stopAllHotkey} sudah digunakan pada deck tersebut.`);
    }
    this.commit(next);
    return this.getActiveDeck();
  }

  addPad(input) {
    const deckId = String(input.deckId ?? this.data.settings.activeDeckId).trim();
    this.ensureDeckExists(deckId);
    const pad = sanitizePad({ ...input, deckId }, {}, { defaultDeckId: deckId });
    this.ensureHotkeyAvailable(pad.hotkey, '', deckId);
    this.ensureStopAllAvailable(pad.hotkey, deckId);
    const next = clone(this.data);
    next.pads.push(pad);
    this.commit(next);
    return clone(pad);
  }

  updatePad(id, input) {
    const index = this.data.pads.findIndex((pad) => pad.id === id);
    if (index === -1) {
      throw new Error('Pad tidak ditemukan.');
    }

    const pad = sanitizePad(input, this.data.pads[index]);
    this.ensureDeckExists(pad.deckId);
    this.ensureHotkeyAvailable(pad.hotkey, id, pad.deckId);
    this.ensureStopAllAvailable(pad.hotkey, pad.deckId);
    const next = clone(this.data);
    next.pads[index] = pad;
    this.commit(next);
    return clone(pad);
  }

  deletePad(id) {
    const index = this.data.pads.findIndex((pad) => pad.id === id);
    if (index === -1) {
      throw new Error('Pad tidak ditemukan.');
    }

    const target = this.data.pads[index];
    if (MEDIA_TYPES.has(target.type)) {
      const referencingPad = this.data.pads.find(
        (pad) => pad.type === 'action' &&
          collectActionReferences(pad).some(
            (reference) => reference.kind === 'media' && reference.padId === id
          )
      );
      if (referencingPad) {
        throw new Error(
          `Pad media masih digunakan oleh aksi “${referencingPad.title}” dan tidak dapat dihapus.`
        );
      }
    }

    const next = clone(this.data);
    const [removed] = next.pads.splice(index, 1);
    this.commit(next);
    return clone(removed);
  }

  reorderPads(deckId, orderedIds) {
    this.ensureDeckExists(deckId);
    if (!Array.isArray(orderedIds)) {
      throw new Error('Urutan pad tidak valid.');
    }

    const current = this.data.pads.filter((pad) => pad.deckId === deckId);
    const currentIds = new Set(current.map((pad) => pad.id));
    const requestedIds = new Set(orderedIds);
    if (
      orderedIds.length !== current.length ||
      requestedIds.size !== orderedIds.length ||
      orderedIds.some((id) => !currentIds.has(id))
    ) {
      throw new Error('Urutan harus memuat semua pad pada deck tepat satu kali.');
    }

    const byId = new Map(current.map((pad) => [pad.id, pad]));
    const ordered = orderedIds.map((id) => byId.get(id));
    let position = 0;
    const next = clone(this.data);
    next.pads = this.data.pads.map((pad) => (
      pad.deckId === deckId ? clone(ordered[position++]) : clone(pad)
    ));
    this.commit(next);
    return next.pads.filter((pad) => pad.deckId === deckId).map(clone);
  }

  setGlobalHotkeysEnabled(enabled) {
    return this.updateSettings({ globalHotkeysEnabled: Boolean(enabled) });
  }

  updateSettings(patch) {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
      throw new Error('Pengaturan tidak valid.');
    }

    const allowed = new Set([
      'globalHotkeysEnabled',
      'stopAllHotkey',
      'launchAtLogin',
      'startMinimized',
      'activeDeckId'
    ]);
    for (const key of Object.keys(patch)) {
      if (!allowed.has(key)) {
        throw new Error(`Pengaturan tidak dikenal: ${key}`);
      }
    }

    const next = clone(this.data);
    for (const key of ['globalHotkeysEnabled', 'launchAtLogin', 'startMinimized']) {
      if (Object.hasOwn(patch, key)) {
        next.settings[key] = Boolean(patch[key]);
      }
    }
    if (Object.hasOwn(patch, 'stopAllHotkey')) {
      next.settings.stopAllHotkey = normalizeStopAllHotkey(patch.stopAllHotkey);
    }
    if (Object.hasOwn(patch, 'activeDeckId')) {
      const activeDeckId = String(patch.activeDeckId ?? '').trim();
      this.ensureDeckExists(activeDeckId);
      next.settings.activeDeckId = activeDeckId;
    }
    if (hasStopAllConflict(next)) {
      throw new Error(`Hotkey Stop All ${next.settings.stopAllHotkey} sudah digunakan pada deck aktif.`);
    }

    this.commit(next);
    return this.snapshot();
  }

  exportBackup() {
    return this.snapshot();
  }

  importBackup(payload) {
    let parsed = payload;
    if (typeof payload === 'string') {
      try {
        parsed = JSON.parse(payload);
      } catch {
        throw new Error('File backup bukan JSON yang valid.');
      }
    }

    const { data } = normalizeLibrary(parsed, { strict: true });
    if (!fs.existsSync(this.filePath)) {
      this.save();
    }
    this.backupCurrentFile('pre-import', true);
    this.commit(data);
    return this.snapshot();
  }

  ensureDeckExists(deckId) {
    if (!this.data.decks.some((deck) => deck.id === deckId)) {
      throw new Error('Deck tidak ditemukan.');
    }
  }

  ensureHotkeyAvailable(hotkey, ignoredId = '', deckId = this.data.settings.activeDeckId) {
    if (!hotkey) {
      return;
    }
    const conflict = this.data.pads.find(
      (pad) => pad.id !== ignoredId && pad.deckId === deckId && pad.hotkey === hotkey
    );
    if (conflict) {
      throw new Error(`Hotkey ${hotkey} sudah digunakan oleh “${conflict.title}” pada deck ini.`);
    }
  }

  ensureStopAllAvailable(hotkey, deckId) {
    if (
      hotkey &&
      deckId === this.data.settings.activeDeckId &&
      hotkey === this.data.settings.stopAllHotkey
    ) {
      throw new Error(`Hotkey ${hotkey} sudah digunakan untuk Stop All.`);
    }
  }

  assertUniquePads(data = this.data) {
    const usedIds = new Set();
    const usedHotkeysByDeck = new Map();
    const deckIds = new Set(
      data.decks.map((deck) => cleanEntityId(deck.id, 'ID deck'))
    );

    if (data.decks.length > LIBRARY_LIMITS.maxDecks) {
      throw new Error(`Library dibatasi ${LIBRARY_LIMITS.maxDecks} deck.`);
    }
    if (data.pads.length > LIBRARY_LIMITS.maxPads) {
      throw new Error(`Library dibatasi ${LIBRARY_LIMITS.maxPads} pad.`);
    }
    if (deckIds.size !== data.decks.length) {
      throw new Error('ID deck duplikat ditemukan.');
    }
    if (!deckIds.has(data.settings.activeDeckId)) {
      throw new Error('Deck aktif tidak ditemukan.');
    }

    for (const pad of data.pads) {
      const padId = cleanEntityId(pad.id, 'ID pad');
      cleanEntityId(pad.deckId, 'Deck pad');
      if (usedIds.has(padId)) {
        throw new Error(`ID pad duplikat ditemukan: ${pad.id}`);
      }
      if (!SUPPORTED_TYPES.has(pad.type)) {
        throw new Error(`Jenis pad tidak didukung: ${pad.type}`);
      }
      if (!deckIds.has(pad.deckId)) {
        throw new Error(`Deck pad tidak ditemukan: ${pad.deckId}`);
      }

      const usedHotkeys = usedHotkeysByDeck.get(pad.deckId) || new Set();
      if (pad.hotkey && usedHotkeys.has(pad.hotkey)) {
        throw new Error(`Hotkey duplikat ditemukan pada deck ${pad.deckId}: ${pad.hotkey}`);
      }
      usedIds.add(padId);
      if (pad.hotkey) usedHotkeys.add(pad.hotkey);
      usedHotkeysByDeck.set(pad.deckId, usedHotkeys);
    }

    if (hasStopAllConflict(data)) {
      throw new Error(`Hotkey Stop All ${data.settings.stopAllHotkey} konflik dengan pad aktif.`);
    }

    validateLibraryReferences(data);
  }

  backupCurrentFile(reason, required = false) {
    const backupPath = `${this.filePath}.${reason}-${Date.now()}`;
    try {
      fs.copyFileSync(this.filePath, backupPath);
      return backupPath;
    } catch (error) {
      if (required) {
        throw new Error('Salinan cadangan sebelum import tidak dapat dibuat.', {
          cause: error
        });
      }
      // Recovery continues even when the filesystem cannot create a backup.
      return '';
    }
  }

  commit(next) {
    this.assertUniquePads(next);
    this.save(next);
    this.data = next;
  }

  save(data = this.data) {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.${process.pid}.tmp`;
    try {
      fs.writeFileSync(tempPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
      fs.renameSync(tempPath, this.filePath);
    } finally {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }
}

module.exports = {
  DEFAULT_COLORS,
  DEFAULT_STOP_ALL_HOTKEY,
  LIBRARY_LIMITS,
  PLAYBACK_MODES,
  SCHEMA_VERSION,
  PadStore,
  sanitizePad
};
