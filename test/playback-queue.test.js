'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { PlaybackQueue } = require('../src/main/playback-queue');

function playback(id) {
  return {
    pad: { id, type: 'audio' },
    source: 'hotkey'
  };
}

test('returns one queued playback exactly once', () => {
  const queue = new PlaybackQueue();
  const message = playback('pad-a');
  queue.enqueue(message);

  assert.equal(queue.hasPending(), true);
  assert.equal(queue.take(), message);
  assert.equal(queue.take(), null);
  assert.equal(queue.hasPending(), false);
});

test('stop cancels queued playback before the player becomes ready', () => {
  const canceled = [];
  const queue = new PlaybackQueue((message) => canceled.push(message.pad.id));
  queue.enqueue(playback('pad-a'));

  assert.equal(queue.cancel(), true);
  assert.equal(queue.take(), null);
  assert.deepEqual(canceled, ['pad-a']);
});

test('targeted cancel leaves a different pad queued', () => {
  const queue = new PlaybackQueue();
  const message = playback('pad-a');
  queue.enqueue(message);

  assert.equal(queue.cancel('pad-b'), false);
  assert.equal(queue.take(), message);
});

test('a newer trigger replaces and cancels the older queue item', () => {
  const canceled = [];
  const queue = new PlaybackQueue((message) => canceled.push(message.pad.id));
  const next = playback('pad-b');
  queue.enqueue(playback('pad-a'));
  queue.enqueue(next);

  assert.deepEqual(canceled, ['pad-a']);
  assert.equal(queue.take(), next);
});
