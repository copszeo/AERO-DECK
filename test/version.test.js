'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { isNewerVersion, numericVersion } = require('../src/main/version');

test('normalizes release tags into three numeric components', () => {
  assert.deepEqual(numericVersion('v1.12.3'), [1, 12, 3]);
  assert.deepEqual(numericVersion('2.4'), [2, 4]);
  assert.deepEqual(numericVersion('1.2.0-beta.1'), [1, 2, 0]);
});

test('compares release versions without lexicographic mistakes', () => {
  assert.equal(isNewerVersion('1.10.0', '1.9.9'), true);
  assert.equal(isNewerVersion('2.0.0', '1.99.99'), true);
  assert.equal(isNewerVersion('1.0.1', '1.0.1'), false);
  assert.equal(isNewerVersion('1.0.0', '1.0.1'), false);
});
