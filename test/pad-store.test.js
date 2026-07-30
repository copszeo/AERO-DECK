'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_STOP_ALL_HOTKEY,
  LIBRARY_LIMITS,
  PadStore,
  SCHEMA_VERSION,
  sanitizePad
} = require('../src/main/pad-store');

function temporaryStore(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aero-deck-store-'));
  const filePath = path.join(directory, 'library.json');
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return {
    directory,
    filePath,
    store: new PadStore(filePath)
  };
}

function padInput(overrides = {}) {
  return {
    title: 'Tepuk tangan',
    type: 'audio',
    mediaPath: path.resolve('/tmp/tepuk-tangan.mp3'),
    hotkey: 'a',
    color: '#1fc6a4',
    volume: 0.75,
    loop: false,
    ...overrides
  };
}

function actionPadInput(action, overrides = {}) {
  return {
    title: 'Aksi',
    type: 'action',
    hotkey: '',
    color: '#4c8dff',
    action,
    ...overrides
  };
}

test('creates a schema v3 library with one usable default deck', (t) => {
  const fixture = temporaryStore(t);
  const snapshot = fixture.store.load();

  assert.equal(snapshot.schemaVersion, SCHEMA_VERSION);
  assert.equal(snapshot.decks.length, 1);
  assert.equal(snapshot.decks[0].title, 'Deck utama');
  assert.equal(snapshot.settings.activeDeckId, snapshot.decks[0].id);
  assert.deepEqual(snapshot.settings, {
    globalHotkeysEnabled: true,
    stopAllHotkey: DEFAULT_STOP_ALL_HOTKEY,
    launchAtLogin: false,
    startMinimized: false,
    activeDeckId: snapshot.decks[0].id
  });
  assert.deepEqual(snapshot.pads, []);
  assert.deepEqual(fixture.store.getActiveDeck(), snapshot.decks[0]);
});

test('creates, persists, updates, and deletes a pad in the active deck', (t) => {
  const fixture = temporaryStore(t);
  const initial = fixture.store.load();

  const created = fixture.store.addPad(padInput());
  assert.equal(created.hotkey, 'A');
  assert.equal(created.volume, 0.75);
  assert.equal(created.deckId, initial.settings.activeDeckId);
  assert.equal(created.playbackMode, 'exclusive');

  const reloaded = new PadStore(fixture.filePath);
  const snapshot = reloaded.load();
  assert.equal(snapshot.pads.length, 1);
  assert.equal(snapshot.pads[0].title, 'Tepuk tangan');

  const updated = reloaded.updatePad(created.id, {
    title: 'Sorak penonton',
    hotkey: 'Ctrl+Alt+7',
    volume: 0.4,
    playbackMode: 'toggle'
  });
  assert.equal(updated.title, 'Sorak penonton');
  assert.equal(updated.hotkey, 'Ctrl+Alt+7');
  assert.equal(updated.mediaPath, created.mediaPath);
  assert.equal(updated.playbackMode, 'toggle');

  const removed = reloaded.deletePad(created.id);
  assert.equal(removed.id, created.id);
  assert.equal(reloaded.snapshot().pads.length, 0);
});

test('migrates schema v1 without losing pad data or the existing setting', (t) => {
  const fixture = temporaryStore(t);
  const oldPad = sanitizePad(padInput({
    title: 'Pad versi lama',
    hotkey: 'Shift+5',
    loop: true
  }));
  delete oldPad.deckId;
  delete oldPad.playbackMode;

  fs.writeFileSync(fixture.filePath, JSON.stringify({
    schemaVersion: 1,
    settings: { globalHotkeysEnabled: false },
    pads: [oldPad]
  }), 'utf8');

  const snapshot = fixture.store.load();
  assert.equal(snapshot.schemaVersion, SCHEMA_VERSION);
  assert.equal(snapshot.settings.globalHotkeysEnabled, false);
  assert.equal(snapshot.settings.stopAllHotkey, DEFAULT_STOP_ALL_HOTKEY);
  assert.equal(snapshot.decks[0].title, 'Deck utama');
  assert.equal(snapshot.pads.length, 1);
  assert.equal(snapshot.pads[0].id, oldPad.id);
  assert.equal(snapshot.pads[0].title, oldPad.title);
  assert.equal(snapshot.pads[0].hotkey, oldPad.hotkey);
  assert.equal(snapshot.pads[0].loop, true);
  assert.equal(snapshot.pads[0].deckId, snapshot.decks[0].id);
  assert.equal(snapshot.pads[0].playbackMode, 'exclusive');

  const persisted = JSON.parse(fs.readFileSync(fixture.filePath, 'utf8'));
  assert.equal(persisted.schemaVersion, SCHEMA_VERSION);
  assert.equal(persisted.pads[0].deckId, persisted.decks[0].id);
});

test('migration preserves a pad that used the new default Stop All hotkey', (t) => {
  const fixture = temporaryStore(t);
  const oldPad = sanitizePad(padInput({ hotkey: DEFAULT_STOP_ALL_HOTKEY }));

  fs.writeFileSync(fixture.filePath, JSON.stringify({
    schemaVersion: 1,
    settings: { globalHotkeysEnabled: true },
    pads: [oldPad]
  }), 'utf8');

  const snapshot = fixture.store.load();
  assert.equal(snapshot.pads.length, 1);
  assert.equal(snapshot.pads[0].hotkey, DEFAULT_STOP_ALL_HOTKEY);
  assert.notEqual(snapshot.settings.stopAllHotkey, DEFAULT_STOP_ALL_HOTKEY);
  assert.ok(snapshot.settings.stopAllHotkey);
});

test('hotkeys are unique within a deck but reusable in another deck', (t) => {
  const fixture = temporaryStore(t);
  const snapshot = fixture.store.load();
  fixture.store.addPad(padInput());

  assert.throws(
    () => fixture.store.addPad(padInput({
      title: 'Klakson',
      mediaPath: path.resolve('/tmp/klakson.wav'),
      hotkey: 'A'
    })),
    /sudah digunakan/
  );

  const secondDeck = fixture.store.addDeck('Podcast');
  const secondPad = fixture.store.addPad(padInput({
    title: 'Klakson',
    mediaPath: path.resolve('/tmp/klakson.wav'),
    deckId: secondDeck.id,
    hotkey: 'A'
  }));
  assert.equal(secondPad.hotkey, 'A');
  assert.notEqual(secondPad.deckId, snapshot.settings.activeDeckId);

  assert.throws(
    () => fixture.store.addPad(padInput({
      mediaPath: path.resolve('/tmp/bell.ogg'),
      deckId: secondDeck.id,
      hotkey: 'a'
    })),
    /sudah digunakan/
  );
});

test('supports deck add, rename, activate, and delete with associated pads', (t) => {
  const fixture = temporaryStore(t);
  const initial = fixture.store.load();
  const secondDeck = fixture.store.addDeck('  Streaming   malam  ');
  assert.equal(secondDeck.title, 'Streaming malam');

  const renamed = fixture.store.renameDeck(secondDeck.id, 'Podcast');
  assert.equal(renamed.title, 'Podcast');

  const selected = fixture.store.setActiveDeck(secondDeck.id);
  assert.equal(selected.id, secondDeck.id);
  const pad = fixture.store.addPad(padInput({ hotkey: 'B' }));
  assert.equal(pad.deckId, secondDeck.id);

  const removed = fixture.store.deleteDeck(secondDeck.id);
  const snapshot = fixture.store.snapshot();
  assert.equal(removed.id, secondDeck.id);
  assert.equal(snapshot.decks.length, 1);
  assert.equal(snapshot.settings.activeDeckId, initial.decks[0].id);
  assert.equal(snapshot.pads.some((item) => item.id === pad.id), false);

  assert.throws(() => fixture.store.deleteDeck(initial.decks[0].id), /terakhir/);
  assert.throws(() => fixture.store.addDeck('  '), /tidak boleh kosong/);
  assert.throws(() => fixture.store.renameDeck('missing', 'Baru'), /tidak ditemukan/);
  assert.throws(() => fixture.store.setActiveDeck('missing'), /tidak ditemukan/);
});

test('moves pads between decks while enforcing the target deck hotkeys', (t) => {
  const fixture = temporaryStore(t);
  fixture.store.load();
  const first = fixture.store.addPad(padInput({ hotkey: 'A' }));
  const secondDeck = fixture.store.addDeck('Deck kedua');
  const second = fixture.store.addPad(padInput({
    mediaPath: path.resolve('/tmp/second.wav'),
    deckId: secondDeck.id,
    hotkey: 'A'
  }));

  assert.throws(
    () => fixture.store.updatePad(first.id, { deckId: secondDeck.id }),
    /sudah digunakan/
  );

  const moved = fixture.store.updatePad(first.id, {
    deckId: secondDeck.id,
    hotkey: 'B'
  });
  assert.equal(moved.deckId, secondDeck.id);
  assert.equal(moved.hotkey, 'B');
  assert.equal(fixture.store.getPad(second.id).hotkey, 'A');
});

test('reorders every pad in one deck without disturbing another deck', (t) => {
  const fixture = temporaryStore(t);
  const initial = fixture.store.load();
  const first = fixture.store.addPad(padInput({ hotkey: 'A' }));
  const otherDeck = fixture.store.addDeck('Lain');
  const other = fixture.store.addPad(padInput({
    mediaPath: path.resolve('/tmp/other.wav'),
    deckId: otherDeck.id,
    hotkey: 'A'
  }));
  const second = fixture.store.addPad(padInput({
    mediaPath: path.resolve('/tmp/second.ogg'),
    deckId: initial.settings.activeDeckId,
    hotkey: 'B'
  }));
  const third = fixture.store.addPad(padInput({
    mediaPath: path.resolve('/tmp/third.m4a'),
    deckId: initial.settings.activeDeckId,
    hotkey: 'C'
  }));

  const reordered = fixture.store.reorderPads(
    initial.settings.activeDeckId,
    [third.id, first.id, second.id]
  );
  assert.deepEqual(reordered.map((pad) => pad.id), [third.id, first.id, second.id]);
  assert.equal(fixture.store.getPad(other.id).deckId, otherDeck.id);

  assert.throws(
    () => fixture.store.reorderPads(initial.settings.activeDeckId, [first.id]),
    /semua pad/
  );
  assert.throws(
    () => fixture.store.reorderPads(initial.settings.activeDeckId, [
      first.id,
      first.id,
      second.id
    ]),
    /semua pad/
  );
});

test('updates and persists all settings with a normalized Stop All hotkey', (t) => {
  const fixture = temporaryStore(t);
  fixture.store.load();
  const otherDeck = fixture.store.addDeck('Deck kerja');
  const updated = fixture.store.updateSettings({
    globalHotkeysEnabled: false,
    stopAllHotkey: 'alt+control+f11',
    launchAtLogin: true,
    startMinimized: true,
    activeDeckId: otherDeck.id
  });

  assert.deepEqual(updated.settings, {
    globalHotkeysEnabled: false,
    stopAllHotkey: 'Ctrl+Alt+F11',
    launchAtLogin: true,
    startMinimized: true,
    activeDeckId: otherDeck.id
  });

  const reloaded = new PadStore(fixture.filePath);
  assert.deepEqual(reloaded.load().settings, updated.settings);
  assert.equal(
    reloaded.updateSettings({ stopAllHotkey: '' }).settings.stopAllHotkey,
    ''
  );
  assert.throws(
    () => reloaded.updateSettings({ stopAllHotkey: 'Escape' }),
    /tidak didukung/
  );
  assert.throws(
    () => reloaded.updateSettings({ unknownSetting: true }),
    /tidak dikenal/
  );
});

test('prevents Stop All conflicts only on the active deck', (t) => {
  const fixture = temporaryStore(t);
  const initial = fixture.store.load();

  assert.throws(
    () => fixture.store.addPad(padInput({ hotkey: DEFAULT_STOP_ALL_HOTKEY })),
    /Stop All/
  );

  const otherDeck = fixture.store.addDeck('Deck lain');
  const pad = fixture.store.addPad(padInput({
    deckId: otherDeck.id,
    hotkey: DEFAULT_STOP_ALL_HOTKEY
  }));
  assert.equal(pad.deckId, otherDeck.id);
  assert.throws(() => fixture.store.setActiveDeck(otherDeck.id), /Stop All/);
  assert.equal(fixture.store.snapshot().settings.activeDeckId, initial.settings.activeDeckId);

  fixture.store.addPad(padInput({ hotkey: 'Ctrl+Alt+F11' }));
  assert.throws(
    () => fixture.store.updateSettings({ stopAllHotkey: 'alt+ctrl+f11' }),
    /sudah digunakan/
  );
});

test('validates media and playback mode while preserving partial updates', (t) => {
  const fixture = temporaryStore(t);
  fixture.store.load();
  const created = fixture.store.addPad(padInput({
    title: 'Judul khusus',
    loop: true,
    playbackMode: 'restart'
  }));
  const updated = fixture.store.updatePad(created.id, { volume: 0.5 });

  assert.equal(updated.title, 'Judul khusus');
  assert.equal(updated.type, created.type);
  assert.equal(updated.mediaPath, created.mediaPath);
  assert.equal(updated.hotkey, created.hotkey);
  assert.equal(updated.color, created.color);
  assert.equal(updated.loop, true);
  assert.equal(updated.playbackMode, 'restart');

  assert.equal(sanitizePad(padInput({ volume: 3 })).volume, 1);
  assert.equal(sanitizePad(padInput({ hotkey: '', volume: -1 })).volume, 0);
  assert.throws(
    () => sanitizePad(padInput({ mediaPath: 'relative/file.mp3' })),
    /Lokasi file/
  );
  assert.throws(
    () => sanitizePad(padInput({ mediaPath: '\\\\server\\share\\sound.mp3' })),
    /jaringan atau device path/
  );
  assert.throws(
    () => sanitizePad(padInput({ mediaPath: '\\\\?\\C:\\sound.mp3' })),
    /jaringan atau device path/
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
  assert.throws(
    () => sanitizePad(padInput({ playbackMode: 'shuffle' })),
    /Mode playback/
  );
});

test('migrates a schema v2 library to v3 without changing media pads', (t) => {
  const fixture = temporaryStore(t);
  fixture.store.load();
  const media = fixture.store.addPad(padInput({
    title: 'Media v2',
    playbackMode: 'overlap',
    loop: true,
    volume: 0.35
  }));
  const legacy = fixture.store.snapshot();
  legacy.schemaVersion = 2;
  fs.writeFileSync(fixture.filePath, JSON.stringify(legacy), 'utf8');

  const migrated = new PadStore(fixture.filePath).load();
  const migratedMedia = migrated.pads[0];
  assert.equal(migrated.schemaVersion, SCHEMA_VERSION);
  assert.deepEqual(migratedMedia, media);
  assert.equal(migratedMedia.type, 'audio');
  assert.equal(migratedMedia.playbackMode, 'overlap');
  assert.equal(migratedMedia.loop, true);
  assert.equal(migratedMedia.volume, 0.35);
});

test('creates and normalizes every supported action-pad root type', (t) => {
  const fixture = temporaryStore(t);
  const initial = fixture.store.load();
  const media = fixture.store.addPad(padInput({ hotkey: '' }));
  const targetDeck = fixture.store.addDeck('Deck tujuan');
  const actions = [
    { type: 'open', target: 'C:\\Tools\\AERO DECK' },
    { type: 'close', target: 'C:\\Tools\\AERO DECK\\AERO DECK.exe', force: true },
    { type: 'website', url: 'https://example.com/live' },
    { type: 'hotkey', hotkey: 'shift+control+f5' },
    { type: 'text', text: 'Halo streamer!', pressEnter: true },
    { type: 'multimedia', command: 'volume-up' },
    { type: 'switch-deck', deckId: targetDeck.id },
    {
      type: 'sequence',
      actions: [
        { type: 'delay', ms: 25 },
        { type: 'media', padId: media.id, playbackMode: 'restart' }
      ]
    },
    {
      type: 'parallel',
      actions: [
        { type: 'media', padId: media.id },
        { type: 'text', text: 'Jalan bersama' }
      ]
    },
    {
      type: 'random',
      actions: [
        { type: 'media', padId: media.id },
        { type: 'text', text: 'Pilihan lain' }
      ]
    },
    {
      type: 'toggle',
      id: 'scene-toggle',
      actions: [
        { type: 'media', padId: media.id },
        { type: 'multimedia', command: 'mute' }
      ]
    }
  ];

  const created = actions.map((action, index) => fixture.store.addPad(
    actionPadInput(action, {
      title: `Aksi ${index + 1}`,
      deckId: initial.settings.activeDeckId
    })
  ));

  assert.deepEqual(
    created.map((pad) => pad.action.type),
    ['open', 'close', 'website', 'hotkey', 'text', 'multimedia', 'switch-deck', 'sequence', 'parallel', 'random', 'toggle']
  );
  assert.equal(created[1].action.force, true);
  assert.equal(created[2].action.url, 'https://example.com/live');
  assert.equal(created[3].action.hotkey, 'Ctrl+Shift+F5');
  assert.equal(created[7].action.actions[1].mediaPath, '');
  assert.equal(created[8].action.actions[0].mediaPath, '');
  for (const pad of created) {
    assert.equal(pad.type, 'action');
    assert.equal(Object.hasOwn(pad, 'mediaPath'), false);
    assert.equal(Object.hasOwn(pad, 'volume'), false);
    assert.equal(Object.hasOwn(pad, 'loop'), false);
    assert.equal(Object.hasOwn(pad, 'playbackMode'), false);
  }

  const partial = fixture.store.updatePad(created[10].id, {
    title: 'Toggle diperbarui',
    hotkey: 'Ctrl+9'
  });
  assert.equal(partial.title, 'Toggle diperbarui');
  assert.equal(partial.hotkey, 'Ctrl+9');
  assert.deepEqual(partial.action, created[10].action);

  const reloaded = new PadStore(fixture.filePath).load();
  assert.deepEqual(reloaded.pads.find((pad) => pad.id === partial.id).action, partial.action);
});

test('validates nested action references across the complete library', (t) => {
  const fixture = temporaryStore(t);
  const initial = fixture.store.load();
  const media = fixture.store.addPad(padInput({ hotkey: '' }));
  const nested = fixture.store.addPad(actionPadInput({
    type: 'sequence',
    actions: [
      { type: 'delay', ms: 10 },
      {
        type: 'random',
        actions: [
          { type: 'media', padId: media.id },
          {
            type: 'toggle',
            id: 'nested-toggle',
            actions: [
              { type: 'media', padId: media.id },
              { type: 'text', text: 'Selesai' }
            ]
          }
        ]
      }
    ]
  }, {
    title: 'Referensi bertingkat',
    deckId: initial.settings.activeDeckId
  }));

  assert.equal(nested.action.actions[1].actions[0].padId, media.id);

  const otherDeck = fixture.store.addDeck('Deck lain');
  assert.throws(
    () => fixture.store.updatePad(media.id, {
      deckId: otherDeck.id
    }),
    /deck yang sama/
  );
  assert.equal(fixture.store.getPad(media.id).deckId, initial.settings.activeDeckId);
});

test('rejects unsafe, dangling, wrong-type, and cross-deck action references', (t) => {
  const fixture = temporaryStore(t);
  const initial = fixture.store.load();
  const media = fixture.store.addPad(padInput({ hotkey: '' }));
  const otherDeck = fixture.store.addDeck('Deck lain');
  const otherMedia = fixture.store.addPad(padInput({
    deckId: otherDeck.id,
    hotkey: '',
    mediaPath: path.resolve('/tmp/other-reference.wav')
  }));
  const existingAction = fixture.store.addPad(actionPadInput(
    { type: 'text', text: 'Bukan media' },
    { deckId: initial.settings.activeDeckId }
  ));

  assert.throws(
    () => fixture.store.addPad(actionPadInput({
      type: 'media',
      padId: media.id
    })),
    /aksi utama/
  );
  assert.throws(
    () => fixture.store.addPad(actionPadInput({
      type: 'delay',
      ms: 10
    })),
    /aksi utama/
  );
  assert.throws(
    () => fixture.store.addPad(actionPadInput({
      type: 'sequence',
      actions: [{
        type: 'media',
        mediaPath: path.resolve('/tmp/direct.mp3'),
        mediaType: 'audio'
      }]
    })),
    /mediaPath langsung/
  );
  assert.throws(
    () => fixture.store.addPad(actionPadInput({
      type: 'open',
      target: '\\\\server\\share\\alat.exe'
    })),
    /jaringan atau device path/
  );
  assert.throws(
    () => fixture.store.addPad(actionPadInput({
      type: 'close',
      target: 'alat.exe'
    })),
    /path absolut/
  );
  assert.throws(
    () => fixture.store.addPad(actionPadInput({
      type: 'random',
      actions: [{ type: 'media', padId: 'pad-tidak-ada' }]
    })),
    /tidak ditemukan/
  );
  assert.throws(
    () => fixture.store.addPad(actionPadInput({
      type: 'sequence',
      actions: [{ type: 'media', padId: existingAction.id }]
    })),
    /audio atau video/
  );
  assert.throws(
    () => fixture.store.addPad(actionPadInput({
      type: 'toggle',
      id: 'cross-deck',
      actions: [
        { type: 'media', padId: otherMedia.id },
        { type: 'media', padId: media.id }
      ]
    })),
    /deck yang sama/
  );
  assert.throws(
    () => fixture.store.addPad(actionPadInput({
      type: 'switch-deck',
      deckId: 'deck-tidak-ada'
    })),
    /deck yang tidak ditemukan/
  );
});

test('guards referenced media and decks while allowing self-contained deck deletion', (t) => {
  const fixture = temporaryStore(t);
  const initial = fixture.store.load();
  const media = fixture.store.addPad(padInput({ hotkey: '' }));
  const action = fixture.store.addPad(actionPadInput({
    type: 'sequence',
    actions: [{ type: 'media', padId: media.id }]
  }, { title: 'Pemakai media' }));

  assert.throws(
    () => fixture.store.deletePad(media.id),
    /masih digunakan.*Pemakai media/
  );
  fixture.store.deletePad(action.id);
  assert.equal(fixture.store.deletePad(media.id).id, media.id);

  const targetDeck = fixture.store.addDeck('Deck target');
  const switcher = fixture.store.addPad(actionPadInput({
    type: 'switch-deck',
    deckId: targetDeck.id
  }, {
    title: 'Pindah target',
    deckId: initial.settings.activeDeckId
  }));
  assert.throws(
    () => fixture.store.deleteDeck(targetDeck.id),
    /masih digunakan.*Pindah target/
  );
  fixture.store.deletePad(switcher.id);

  const containedMedia = fixture.store.addPad(padInput({
    deckId: targetDeck.id,
    hotkey: '',
    mediaPath: path.resolve('/tmp/contained.wav')
  }));
  fixture.store.addPad(actionPadInput({
    type: 'sequence',
    actions: [
      { type: 'media', padId: containedMedia.id },
      { type: 'switch-deck', deckId: targetDeck.id }
    ]
  }, {
    deckId: targetDeck.id,
    title: 'Aksi internal'
  }));
  assert.equal(fixture.store.deleteDeck(targetDeck.id).id, targetDeck.id);
  assert.equal(
    fixture.store.snapshot().pads.some((pad) => pad.deckId === targetDeck.id),
    false
  );
});

test('imports action pads strictly and keeps state atomic on invalid references', (t) => {
  const source = temporaryStore(t);
  const sourceSnapshot = source.store.load();
  const media = source.store.addPad(padInput({ hotkey: '' }));
  const action = source.store.addPad(actionPadInput({
    type: 'random',
    actions: [
      { type: 'media', padId: media.id },
      { type: 'website', url: 'https://example.com' }
    ]
  }, {
    title: 'Aksi backup',
    deckId: sourceSnapshot.settings.activeDeckId
  }));
  const backup = source.store.exportBackup();

  const destination = temporaryStore(t);
  destination.store.load();
  const imported = destination.store.importBackup(backup);
  assert.deepEqual(
    imported.pads.find((pad) => pad.id === action.id).action,
    action.action
  );

  const before = destination.store.snapshot();
  const invalid = structuredClone(backup);
  const invalidAction = invalid.pads.find((pad) => pad.id === action.id);
  invalidAction.action.actions[0].padId = 'missing-on-import';
  assert.throws(
    () => destination.store.importBackup(invalid),
    /tidak ditemukan/
  );
  assert.deepEqual(destination.store.snapshot(), before);

  const rawPath = structuredClone(backup);
  rawPath.pads.find((pad) => pad.id === action.id).action.actions[0] = {
    type: 'media',
    mediaPath: path.resolve('/tmp/raw.mp3'),
    mediaType: 'audio'
  };
  assert.throws(
    () => destination.store.importBackup(rawPath),
    /mediaPath langsung/
  );
  assert.deepEqual(destination.store.snapshot(), before);
});

test('rejects non-canonical pad identifiers during strict import', (t) => {
  const source = temporaryStore(t);
  source.store.load();
  source.store.addPad(padInput({ hotkey: '' }));
  const backup = source.store.exportBackup();

  const destination = temporaryStore(t);
  destination.store.load();
  const before = destination.store.snapshot();

  for (const invalidId of [
    { crafted: true },
    ['crafted'],
    ' padded-id ',
    'line\nbreak',
    '__proto__'
  ]) {
    const invalid = structuredClone(backup);
    invalid.pads[0].id = invalidId;
    assert.throws(
      () => destination.store.importBackup(invalid),
      /ID pad tidak valid/
    );
    assert.deepEqual(destination.store.snapshot(), before);
  }
});

test('exports an isolated clone and imports a valid replacement with a backup', (t) => {
  const fixture = temporaryStore(t);
  fixture.store.load();
  fixture.store.addPad(padInput());
  const exported = fixture.store.exportBackup();
  exported.decks[0].title = 'Mutasi dari luar';
  assert.equal(fixture.store.getActiveDeck().title, 'Deck utama');

  const replacementFixture = temporaryStore(t);
  replacementFixture.store.load();
  const replacementPad = replacementFixture.store.addPad(padInput({
    title: 'Isi backup',
    hotkey: 'B'
  }));
  const backup = replacementFixture.store.exportBackup();

  const imported = fixture.store.importBackup(backup);
  assert.equal(imported.pads.length, 1);
  assert.equal(imported.pads[0].id, replacementPad.id);
  assert.equal(imported.pads[0].title, 'Isi backup');
  assert.ok(
    fs.readdirSync(fixture.directory).some((name) => name.startsWith('library.json.pre-import-'))
  );

  backup.pads[0].title = 'Diubah setelah import';
  assert.equal(fixture.store.getPad(replacementPad.id).title, 'Isi backup');
});

test('imports a JSON string and rejects invalid backups atomically', (t) => {
  const fixture = temporaryStore(t);
  fixture.store.load();
  const original = fixture.store.addPad(padInput());
  const before = fixture.store.snapshot();

  assert.throws(() => fixture.store.importBackup('{not json'), /bukan JSON/);
  assert.throws(
    () => fixture.store.importBackup({
      ...before,
      schemaVersion: 99
    }),
    /tidak didukung/
  );
  assert.throws(
    () => fixture.store.importBackup({
      ...before,
      settings: {
        ...before.settings,
        activeDeckId: 'missing'
      }
    }),
    /Deck aktif/
  );
  assert.throws(
    () => fixture.store.importBackup({
      ...before,
      pads: [
        before.pads[0],
        {
          ...before.pads[0],
          id: 'different-id',
          mediaPath: path.resolve('/tmp/duplicate.wav')
        }
      ]
    }),
    /Hotkey pad duplikat/
  );
  assert.throws(
    () => fixture.store.importBackup({
      ...before,
      pads: [{ ...before.pads[0], deckId: '' }]
    }),
    /Deck pad/
  );
  assert.throws(
    () => fixture.store.importBackup({
      ...before,
      pads: [{ ...before.pads[0], id: '' }]
    }),
    /ID pad/
  );
  assert.deepEqual(fixture.store.snapshot(), before);

  const imported = fixture.store.importBackup(JSON.stringify(before));
  assert.equal(imported.pads[0].id, original.id);
});

test('rejects oversized backup libraries before processing their records', (t) => {
  const fixture = temporaryStore(t);
  const before = fixture.store.load();
  const tooManyDecks = Array.from(
    { length: LIBRARY_LIMITS.maxDecks + 1 },
    (_, index) => ({ id: `deck-${index}`, title: `Deck ${index}` })
  );

  assert.throws(
    () => fixture.store.importBackup({
      ...before,
      decks: tooManyDecks,
      pads: [],
      settings: {
        ...before.settings,
        activeDeckId: tooManyDecks[0].id
      }
    }),
    /dibatasi 100 deck/
  );
  assert.throws(
    () => fixture.store.importBackup({
      ...before,
      pads: Array(LIBRARY_LIMITS.maxPads + 1).fill(null)
    }),
    /dibatasi 1000 pad/
  );
  assert.deepEqual(fixture.store.snapshot(), before);
});

test('imports a schema v1 backup that used the default Stop All hotkey', (t) => {
  const fixture = temporaryStore(t);
  fixture.store.load();
  const oldPad = sanitizePad(padInput({ hotkey: DEFAULT_STOP_ALL_HOTKEY }));
  delete oldPad.deckId;
  delete oldPad.playbackMode;

  const imported = fixture.store.importBackup({
    schemaVersion: 1,
    settings: { globalHotkeysEnabled: true },
    pads: [oldPad]
  });

  assert.equal(imported.pads.length, 1);
  assert.equal(imported.pads[0].hotkey, DEFAULT_STOP_ALL_HOTKEY);
  assert.notEqual(imported.settings.stopAllHotkey, DEFAULT_STOP_ALL_HOTKEY);
});

test('requires the pre-import backup to succeed before replacing data', (t) => {
  const fixture = temporaryStore(t);
  fixture.store.load();
  fixture.store.addPad(padInput());
  const before = fixture.store.snapshot();
  const originalCopy = fs.copyFileSync;

  fs.copyFileSync = () => {
    throw new Error('simulated backup failure');
  };
  try {
    assert.throws(
      () => fixture.store.importBackup(before),
      /cadangan sebelum import/
    );
  } finally {
    fs.copyFileSync = originalCopy;
  }

  assert.deepEqual(fixture.store.snapshot(), before);
});

test('recovers from corrupt JSON and preserves a backup', (t) => {
  const fixture = temporaryStore(t);
  fs.writeFileSync(fixture.filePath, '{invalid json', 'utf8');

  const snapshot = fixture.store.load();
  assert.deepEqual(snapshot.pads, []);
  assert.equal(snapshot.schemaVersion, SCHEMA_VERSION);
  assert.equal(snapshot.decks.length, 1);
  assert.equal(snapshot.settings.globalHotkeysEnabled, true);

  const files = fs.readdirSync(fixture.directory);
  assert.ok(files.some((name) => name.startsWith('library.json.corrupt-')));
  assert.doesNotThrow(() => JSON.parse(fs.readFileSync(fixture.filePath, 'utf8')));
});

test('salvages valid stored records and preserves the damaged source', (t) => {
  const fixture = temporaryStore(t);
  const validPad = sanitizePad(padInput());
  delete validPad.deckId;
  delete validPad.playbackMode;
  fs.writeFileSync(fixture.filePath, JSON.stringify({
    schemaVersion: 1,
    settings: { globalHotkeysEnabled: true },
    pads: [
      validPad,
      { ...validPad, mediaPath: 'not-an-absolute-path', hotkey: 'B' },
      {
        ...validPad,
        mediaPath: path.resolve('/tmp/duplicate.wav'),
        hotkey: 'C'
      }
    ]
  }), 'utf8');

  const snapshot = fixture.store.load();
  assert.equal(snapshot.pads.length, 1);
  assert.equal(snapshot.pads[0].id, validPad.id);
  assert.ok(fs.readdirSync(fixture.directory).some((name) => name.includes('.recovered-')));
});

test('persists the backwards-compatible global hotkey setter', (t) => {
  const fixture = temporaryStore(t);
  fixture.store.load();
  fixture.store.setGlobalHotkeysEnabled(false);

  const reloaded = new PadStore(fixture.filePath);
  assert.equal(reloaded.load().settings.globalHotkeysEnabled, false);
});

test('keeps in-memory state unchanged when an atomic save fails', (t) => {
  const fixture = temporaryStore(t);
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
});
