'use strict';

const MODIFIER_ORDER = ['Ctrl', 'Alt', 'Shift', 'Win'];
const MODIFIER_ALIASES = new Map([
  ['CTRL', 'Ctrl'],
  ['CONTROL', 'Ctrl'],
  ['ALT', 'Alt'],
  ['OPTION', 'Alt'],
  ['SHIFT', 'Shift'],
  ['WIN', 'Win'],
  ['WINDOWS', 'Win'],
  ['META', 'Win'],
  ['SUPER', 'Win']
]);

const KEY_ALIASES = new Map([
  [' ', 'Space'],
  ['SPACEBAR', 'Space'],
  ['SPACE', 'Space']
]);

function normalizePrimaryKey(value) {
  const original = String(value ?? '');
  if (original === ' ') {
    return 'Space';
  }
  const raw = original.trim();
  if (!raw) {
    return '';
  }

  const upper = raw.toUpperCase();
  if (KEY_ALIASES.has(upper)) {
    return KEY_ALIASES.get(upper);
  }

  if (/^[A-Z0-9]$/.test(upper)) {
    return upper;
  }

  if (/^F([1-9]|1[0-2])$/.test(upper)) {
    return upper;
  }

  return '';
}

function normalizeHotkey(value) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return '';
  }

  const parts = raw
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean);

  const modifiers = new Set();
  let primaryKey = '';

  for (const part of parts) {
    const modifier = MODIFIER_ALIASES.get(part.toUpperCase());
    if (modifier) {
      modifiers.add(modifier);
      continue;
    }

    const normalizedKey = normalizePrimaryKey(part);
    if (!normalizedKey || primaryKey) {
      return '';
    }
    primaryKey = normalizedKey;
  }

  if (!primaryKey) {
    return '';
  }

  return [
    ...MODIFIER_ORDER.filter((modifier) => modifiers.has(modifier)),
    primaryKey
  ].join('+');
}

function toElectronAccelerator(value) {
  const hotkey = normalizeHotkey(value);
  if (!hotkey) {
    return '';
  }

  return hotkey
    .split('+')
    .map((part) => {
      if (part === 'Ctrl') return 'Control';
      if (part === 'Win') return 'Super';
      return part;
    })
    .join('+');
}

function hotkeyFromKeyboardEvent(event) {
  if (!event || event.repeat) {
    return '';
  }

  let rawKey = event.key;
  if (/^Key[A-Z]$/.test(event.code)) rawKey = event.code.slice(3);
  if (/^Digit[0-9]$/.test(event.code)) rawKey = event.code.slice(5);
  if (event.code === 'Space') rawKey = 'Space';
  const primaryKey = normalizePrimaryKey(rawKey);
  if (!primaryKey) {
    return '';
  }

  return [
    event.ctrlKey ? 'Ctrl' : '',
    event.altKey ? 'Alt' : '',
    event.shiftKey ? 'Shift' : '',
    event.metaKey ? 'Win' : '',
    primaryKey
  ].filter(Boolean).join('+');
}

function hasModifier(value) {
  const hotkey = normalizeHotkey(value);
  return hotkey ? hotkey.split('+').length > 1 : false;
}

module.exports = {
  hasModifier,
  hotkeyFromKeyboardEvent,
  normalizeHotkey,
  normalizePrimaryKey,
  toElectronAccelerator
};
