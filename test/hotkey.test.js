'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  hasModifier,
  hotkeyFromKeyboardEvent,
  normalizeHotkey,
  toElectronAccelerator
} = require('../src/main/hotkey');

test('normalizes single keys and common modifier aliases', () => {
  assert.equal(normalizeHotkey('a'), 'A');
  assert.equal(normalizeHotkey(' 7 '), '7');
  assert.equal(normalizeHotkey('control + shift + b'), 'Ctrl+Shift+B');
  assert.equal(normalizeHotkey('alt+ctrl+F12'), 'Ctrl+Alt+F12');
  assert.equal(normalizeHotkey('windows + 4'), 'Win+4');
  assert.equal(normalizeHotkey('spacebar'), 'Space');
});

test('rejects unsupported and ambiguous shortcuts', () => {
  assert.equal(normalizeHotkey(''), '');
  assert.equal(normalizeHotkey('Escape'), '');
  assert.equal(normalizeHotkey('Ctrl'), '');
  assert.equal(normalizeHotkey('Ctrl+A+B'), '');
  assert.equal(normalizeHotkey('F13'), '');
});

test('maps canonical hotkeys to Electron accelerators', () => {
  assert.equal(toElectronAccelerator('Ctrl+Alt+7'), 'Control+Alt+7');
  assert.equal(toElectronAccelerator('Win+F2'), 'Super+F2');
  assert.equal(toElectronAccelerator('A'), 'A');
  assert.equal(toElectronAccelerator('Escape'), '');
});

test('builds a hotkey from a keyboard event', () => {
  assert.equal(
    hotkeyFromKeyboardEvent({
      key: 'k',
      ctrlKey: true,
      altKey: true,
      shiftKey: false,
      metaKey: false,
      repeat: false
    }),
    'Ctrl+Alt+K'
  );
  assert.equal(
    hotkeyFromKeyboardEvent({
      key: 'Control',
      ctrlKey: true,
      repeat: false
    }),
    ''
  );
  assert.equal(
    hotkeyFromKeyboardEvent({
      key: '!',
      code: 'Digit1',
      shiftKey: true,
      repeat: false
    }),
    'Shift+1'
  );
  assert.equal(
    hotkeyFromKeyboardEvent({
      key: ' ',
      code: 'Space',
      repeat: false
    }),
    'Space'
  );
  assert.equal(
    hotkeyFromKeyboardEvent({
      key: '1',
      repeat: true
    }),
    ''
  );
});

test('detects shortcuts that contain a modifier', () => {
  assert.equal(hasModifier('A'), false);
  assert.equal(hasModifier('Ctrl+A'), true);
  assert.equal(hasModifier(''), false);
});
