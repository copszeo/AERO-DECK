'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { PadStore, sanitizePad } = require('../src/main/pad-store');

function temporaryStore() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aero-deck-store-'));
  return {
    directory,
    filePath: path.join(directory, 'library.json'),
    store: new PadStore(path.join(directory, 'library.json'))
  };
}

function padInput(overrides = {}) {
  return {
    title: 'Tepuk tangan',
    type: 'audio',
    mediaPath: path.resolve('/tmp/tepuk tangan.mp3'),
    hotkey: 'a',
    color: '#1fc6a4',
    volume: 0.75,
    loop: false,
    ...overrides
  };
}

test('creates, persists, updates, and deletes a pad', () => {
  const fixture = temporaryStore();
  fixture.store.load();

  const created = fixture.store.addPad(padInput());
  assert.equal(created.hotkey, 'A');
  assert.equal(created.volume, 0.75);

  const reloaded = new PadStore(fixture.filePath);
  const snapshot = reloaded.load();
  assert.equal(snapshot.pads.length, 1);
  assert.equal(snapshot.pads[0].title, 'Tepuk tangan');

  const updated = reloaded.updatePad(created.id, {
    title: 'Sorak penonton',
    hotkey: 'Ctrl+Alt+7',
    volume: 0.4
  });
  assert.equal(updated.title, 'Sorak penonton');
  assert.equal(updated.hotkey, 'Ctrl+Alt+7');
  assert.equal(updated.mediaPath, created.mediaPath);

  const removed = reloaded.deletePad(created.id);
  assert.equal(removed.id, created.id);
  assert.equal(reloaded.snapshot().pads.length, 0);

  fs.rmSync(fixture.directory, { recursive: true, force: true });
});

test('prevents duplicate hotkeys', () => {
  const fixture = temporaryStore();
  fixture.store.load();
  fixture.store.addPad(padInput());

  assert.throws(
    () => fixture.store.addPad(padInput({
      title: 'Klakson',
      mediaPath: path.resolve('/tmp/klakson.wav'),
      hotkey: 'A'
    })),
    /sudah digunakan/
  );

  fs.rmSync(fixture.directory, { recursive: true, force: true });
});

test('partial updates preserve every omitted field', () => {
  const fixture = temporaryStore();
  fixture.store.load();
  const created = fixture.store.addPad(padInput({
    title: 'Judul khusus',
    loop: true
  }));

  const updated = fixture.store.updatePad(created.id, { volume: 0.5 });
  assert.equal(updated.title, 'Judul khusus');
  assert.equal(updated.type, created.type);
  assert.equal(updated.mediaPath, created.mediaPath);
  assert.equal(updated.hotkey, created.hotkey);
  assert.equal(updated.color, created.color);
  assert.equal(updated.loop, true);

  fs.rmSync(fixture.directory, { recursive: true, force: true });
});

test('validates input and clamps volume', () => {
  const loudPad = sanitizePad(padInput({ volume: 3 }));
  const silentPad = sanitizePad(padInput({ hotkey: '', volume: -1 }));
  assert.equal(loudPad.volume, 1);
  assert.equal(silentPad.volume, 0);
  assert.equal(silentPad.hotkey, '');

  assert.throws(
    () => sanitizePad(padInput({ mediaPath: 'relative/file.mp3' })),
    /Lokasi file/
  );
  assert.throws(
    () => sanitizePad(padInput({ type: 'image' })),
    /Jenis media/
  );
  assert.throws(
    () => sanitizePad(padInput({ type: 'video' })),
    /tidak sesuai/
  );
  assert.throws(
    () => sanitizePad(padInput({ hotkey: 'Escape' })),
    /tidak didukung/
  );
});

test('recovers from corrupt JSON and preserves a backup', () => {
  const fixture = temporaryStore();
  fs.writeFileSync(fixture.filePath, '{invalid json', 'utf8');

  const snapshot = fixture.store.load();
  assert.deepEqual(snapshot.pads, []);
  assert.equal(snapshot.settings.globalHotkeysEnabled, true);

  const files = fs.readdirSync(fixture.directory);
  assert.ok(files.some((name) => name.startsWith('library.json.corrupt-')));
  assert.doesNotThrow(() => JSON.parse(fs.readFileSync(fixture.filePath, 'utf8')));

  fs.rmSync(fixture.directory, { recursive: true, force: true });
});

test('salvages valid pads when a stored record is invalid', () => {
  const fixture = temporaryStore();
  const validPad = sanitizePad(padInput());
  fs.writeFileSync(fixture.filePath, JSON.stringify({
    schemaVersion: 1,
    settings: { globalHotkeysEnabled: true },
    pads: [
      validPad,
      { ...validPad, mediaPath: 'not-an-absolute-path', hotkey: 'B' }
    ]
  }), 'utf8');

  const snapshot = fixture.store.load();
  assert.equal(snapshot.pads.length, 1);
  assert.equal(snapshot.pads[0].id, validPad.id);
  assert.ok(fs.readdirSync(fixture.directory).some((name) => name.includes('.recovered-')));

  fs.rmSync(fixture.directory, { recursive: true, force: true });
});

test('salvages duplicate IDs without discarding the entire library', () => {
  const fixture = temporaryStore();
  const first = sanitizePad(padInput());
  const duplicate = {
    ...sanitizePad(padInput({
      mediaPath: path.resolve('/tmp/second.wav'),
      hotkey: 'B'
    })),
    id: first.id
  };
  fs.writeFileSync(fixture.filePath, JSON.stringify({
    schemaVersion: 1,
    settings: { globalHotkeysEnabled: true },
    pads: [first, duplicate]
  }), 'utf8');

  const snapshot = fixture.store.load();
  assert.equal(snapshot.pads.length, 1);
  assert.equal(snapshot.pads[0].title, first.title);
  fs.rmSync(fixture.directory, { recursive: true, force: true });
});

test('persists the global hotkey setting', () => {
  const fixture = temporaryStore();
  fixture.store.load();
  fixture.store.setGlobalHotkeysEnabled(false);

  const reloaded = new PadStore(fixture.filePath);
  assert.equal(reloaded.load().settings.globalHotkeysEnabled, false);
  fs.rmSync(fixture.directory, { recursive: true, force: true });
});

test('keeps in-memory state unchanged when an atomic save fails', () => {
  const fixture = temporaryStore();
  fixture.store.load();
  const before = fixture.store.snapshot();
  const originalRename = fs.renameSync;

  fs.renameSync = () => {
    throw new Error('simulated disk failure');
  };
  try {
    assert.throws(
      () => fixture.store.addPad(padInput()),
      /simulated disk failure/
    );
  } finally {
    fs.renameSync = originalRename;
  }

  assert.deepEqual(fixture.store.snapshot(), before);
  assert.equal(
    fs.readdirSync(fixture.directory).some((name) => name.endsWith('.tmp')),
    false
  );
  fs.rmSync(fixture.directory, { recursive: true, force: true });
});
