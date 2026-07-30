'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { normalizeHotkey } = require('./hotkey');
const { classifyMedia } = require('./media');

const SCHEMA_VERSION = 1;
const DEFAULT_COLORS = ['#7c5cff', '#1fc6a4', '#ff6b8a', '#ffad42', '#4c8dff', '#b861e8'];
const SUPPORTED_TYPES = new Set(['audio', 'video']);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function cleanTitle(value, fallback = 'Media tanpa nama') {
  const title = String(value ?? '').trim().replace(/\s+/g, ' ');
  return (title || fallback).slice(0, 64);
}

function cleanColor(value) {
  const color = String(value ?? '').trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : DEFAULT_COLORS[0];
}

function cleanVolume(value) {
  const volume = Number(value);
  if (!Number.isFinite(volume)) {
    return 1;
  }
  return Math.min(1, Math.max(0, volume));
}

function sanitizePad(input, existing = {}, options = {}) {
  const mediaPath = String(input.mediaPath ?? existing.mediaPath ?? '').trim();
  const type = String(input.type ?? existing.type ?? '').toLowerCase();
  const hotkeyInput = input.hotkey ?? existing.hotkey ?? '';
  const hotkey = hotkeyInput ? normalizeHotkey(hotkeyInput) : '';
  const detectedType = classifyMedia(mediaPath);

  if (!path.isAbsolute(mediaPath)) {
    throw new Error('Lokasi file media tidak valid.');
  }
  if (!SUPPORTED_TYPES.has(type)) {
    throw new Error('Jenis media harus audio atau video.');
  }
  if (!detectedType || detectedType !== type) {
    throw new Error('Jenis media tidak sesuai dengan format file.');
  }
  if (hotkeyInput && !hotkey) {
    throw new Error('Hotkey tidak didukung. Gunakan huruf, angka, F1–F12, atau kombinasinya.');
  }

  const now = new Date().toISOString();
  const createdAt = existing.createdAt || now;
  return {
    id: existing.id || randomUUID(),
    title: cleanTitle(input.title ?? existing.title, path.parse(mediaPath).name),
    type,
    mediaPath,
    hotkey,
    color: cleanColor(input.color ?? existing.color),
    volume: cleanVolume(input.volume ?? existing.volume),
    loop: Boolean(input.loop ?? existing.loop ?? false),
    createdAt,
    updatedAt: options.preserveTimestamps ? (existing.updatedAt || createdAt) : now
  };
}

class PadStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = {
      schemaVersion: SCHEMA_VERSION,
      settings: {
        globalHotkeysEnabled: true
      },
      pads: []
    };
  }

  load() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    if (!fs.existsSync(this.filePath)) {
      this.save();
      return this.snapshot();
    }

    try {
      const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      const pads = [];
      const ids = new Set();
      const hotkeys = new Set();
      let rejectedPads = 0;

      for (const storedPad of Array.isArray(parsed.pads) ? parsed.pads : []) {
        try {
          const pad = sanitizePad(storedPad, storedPad, { preserveTimestamps: true });
          if (!pad.id || ids.has(pad.id)) {
            throw new Error('ID pad duplikat.');
          }
          if (pad.hotkey && hotkeys.has(pad.hotkey)) {
            throw new Error('Hotkey pad duplikat.');
          }
          ids.add(pad.id);
          if (pad.hotkey) hotkeys.add(pad.hotkey);
          pads.push(pad);
        } catch {
          rejectedPads += 1;
        }
      }

      this.data = {
        schemaVersion: SCHEMA_VERSION,
        settings: {
          globalHotkeysEnabled: parsed.settings?.globalHotkeysEnabled !== false
        },
        pads
      };
      this.assertUniquePads();

      if (rejectedPads > 0) {
        this.backupCurrentFile('recovered');
        this.save();
      }
    } catch (error) {
      this.backupCurrentFile('corrupt');
      this.data = {
        schemaVersion: SCHEMA_VERSION,
        settings: { globalHotkeysEnabled: true },
        pads: []
      };
      this.save();
    }

    return this.snapshot();
  }

  snapshot() {
    return clone(this.data);
  }

  getPad(id) {
    const pad = this.data.pads.find((item) => item.id === id);
    return pad ? clone(pad) : null;
  }

  addPad(input) {
    const pad = sanitizePad(input);
    this.ensureHotkeyAvailable(pad.hotkey);
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
    this.ensureHotkeyAvailable(pad.hotkey, id);
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
    const next = clone(this.data);
    const [removed] = next.pads.splice(index, 1);
    this.commit(next);
    return clone(removed);
  }

  setGlobalHotkeysEnabled(enabled) {
    const next = clone(this.data);
    next.settings.globalHotkeysEnabled = Boolean(enabled);
    this.commit(next);
    return this.snapshot();
  }

  ensureHotkeyAvailable(hotkey, ignoredId = '') {
    if (!hotkey) {
      return;
    }
    const conflict = this.data.pads.find(
      (pad) => pad.id !== ignoredId && pad.hotkey === hotkey
    );
    if (conflict) {
      throw new Error(`Hotkey ${hotkey} sudah digunakan oleh “${conflict.title}”.`);
    }
  }

  assertUniquePads() {
    const usedHotkeys = new Set();
    const usedIds = new Set();
    for (const pad of this.data.pads) {
      if (!pad.id || usedIds.has(pad.id)) {
        throw new Error(`ID pad duplikat ditemukan: ${pad.id}`);
      }
      if (pad.hotkey && usedHotkeys.has(pad.hotkey)) {
        throw new Error(`Hotkey duplikat ditemukan: ${pad.hotkey}`);
      }
      usedIds.add(pad.id);
      if (pad.hotkey) usedHotkeys.add(pad.hotkey);
    }
  }

  backupCurrentFile(reason) {
    const backupPath = `${this.filePath}.${reason}-${Date.now()}`;
    try {
      fs.copyFileSync(this.filePath, backupPath);
    } catch {
      // Recovery continues even when the filesystem cannot create a backup.
    }
  }

  commit(next) {
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
  PadStore,
  sanitizePad
};
