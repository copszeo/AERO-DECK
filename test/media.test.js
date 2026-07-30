'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  classifyMedia,
  inspectMediaFile,
  serializePad
} = require('../src/main/media');

test('classifies supported extensions without case sensitivity', () => {
  assert.equal(classifyMedia('sound.MP3'), 'audio');
  assert.equal(classifyMedia('voice.opus'), 'audio');
  assert.equal(classifyMedia('clip.MP4'), 'video');
  assert.equal(classifyMedia('clip.webm'), 'video');
  assert.equal(classifyMedia('notes.txt'), '');
});

test('inspects media paths with spaces and unicode', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aero-deck-media-'));
  const filePath = path.join(directory, 'suara café #1.WAV');
  fs.writeFileSync(filePath, Buffer.from('fixture'));

  const result = inspectMediaFile(filePath);
  assert.equal(result.path, filePath);
  assert.equal(result.type, 'audio');
  assert.equal(result.name, 'suara café #1');
  assert.equal(result.fileName, 'suara café #1.WAV');

  fs.rmSync(directory, { recursive: true, force: true });
});

test('marks missing files unavailable and encodes existing file URLs', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aero-deck-url-'));
  const filePath = path.join(directory, 'video demo #1.mp4');
  fs.writeFileSync(filePath, Buffer.from('fixture'));

  const pad = { id: 'one', mediaPath: filePath };
  const existing = serializePad(pad);
  assert.equal(existing.exists, true);
  assert.match(existing.mediaUrl, /^file:\/\//);
  assert.match(existing.mediaUrl, /video%20demo%20%231\.mp4$/);

  fs.rmSync(directory, { recursive: true, force: true });
  const missing = serializePad(pad);
  assert.equal(missing.exists, false);
  assert.equal(missing.mediaUrl, '');
});

test('rejects missing and unsupported media', () => {
  assert.throws(() => inspectMediaFile('/definitely/missing/audio.mp3'), /tidak ditemukan/);

  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aero-deck-unsupported-'));
  const filePath = path.join(directory, 'document.txt');
  fs.writeFileSync(filePath, 'not media');
  assert.throws(() => inspectMediaFile(filePath), /belum didukung/);
  fs.rmSync(directory, { recursive: true, force: true });
});
