'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_PLAYBACK_MODE,
  MAX_AUDIO_SESSIONS,
  MAX_AUDIO_SESSIONS_PER_PAD,
  PLAYBACK_MODES,
  normalizePlaybackMode,
  planPlayback,
  selectAudioSessionsToEvict
} = require('../src/main/playback-policy');

const activeSessions = [
  { instanceId: 'audio-a-1', padId: 'audio-a', mediaType: 'audio' },
  { instanceId: 'audio-a-2', padId: 'audio-a', mediaType: 'audio' },
  { instanceId: 'audio-b-1', padId: 'audio-b', mediaType: 'audio' },
  { instanceId: 'video-a-1', padId: 'video-a', mediaType: 'video' }
];

test('normalizes supported playback modes and falls back to exclusive', () => {
  assert.deepEqual(PLAYBACK_MODES, ['exclusive', 'restart', 'toggle', 'overlap']);
  assert.equal(normalizePlaybackMode(' Overlap '), 'overlap');
  assert.equal(normalizePlaybackMode('unknown'), DEFAULT_PLAYBACK_MODE);
  assert.equal(normalizePlaybackMode(null), DEFAULT_PLAYBACK_MODE);
});

test('exclusive audio stops every active instance before starting', () => {
  assert.deepEqual(
    planPlayback({
      mode: 'exclusive',
      mediaType: 'audio',
      padId: 'audio-a',
      activeSessions
    }),
    {
      mode: 'exclusive',
      shouldStart: true,
      stopInstanceIds: ['audio-a-1', 'audio-a-2', 'audio-b-1', 'video-a-1']
    }
  );
});

test('restart audio replaces only instances belonging to the same pad', () => {
  assert.deepEqual(
    planPlayback({
      mode: 'restart',
      mediaType: 'audio',
      padId: 'audio-a',
      activeSessions
    }),
    {
      mode: 'restart',
      shouldStart: true,
      stopInstanceIds: ['audio-a-1', 'audio-a-2']
    }
  );
});

test('toggle audio stops an active pad or starts an inactive pad', () => {
  assert.deepEqual(
    planPlayback({
      mode: 'toggle',
      mediaType: 'audio',
      padId: 'audio-a',
      activeSessions
    }),
    {
      mode: 'toggle',
      shouldStart: false,
      stopInstanceIds: ['audio-a-1', 'audio-a-2']
    }
  );

  assert.deepEqual(
    planPlayback({
      mode: 'toggle',
      mediaType: 'audio',
      padId: 'audio-c',
      activeSessions
    }),
    {
      mode: 'toggle',
      shouldStart: true,
      stopInstanceIds: []
    }
  );
});

test('overlap audio always adds an instance without stopping playback', () => {
  assert.deepEqual(
    planPlayback({
      mode: 'overlap',
      mediaType: 'audio',
      padId: 'audio-a',
      activeSessions
    }),
    {
      mode: 'overlap',
      shouldStart: true,
      stopInstanceIds: []
    }
  );
});

test('video exclusive, restart, and overlap all replace active playback', () => {
  for (const mode of ['exclusive', 'restart', 'overlap']) {
    assert.deepEqual(
      planPlayback({
        mode,
        mediaType: 'video',
        padId: 'video-b',
        activeSessions
      }),
      {
        mode,
        shouldStart: true,
        stopInstanceIds: ['audio-a-1', 'audio-a-2', 'audio-b-1', 'video-a-1']
      }
    );
  }
});

test('toggle video stops the same video or replaces playback for a new video', () => {
  assert.deepEqual(
    planPlayback({
      mode: 'toggle',
      mediaType: 'video',
      padId: 'video-a',
      activeSessions
    }),
    {
      mode: 'toggle',
      shouldStart: false,
      stopInstanceIds: ['video-a-1']
    }
  );

  assert.deepEqual(
    planPlayback({
      mode: 'toggle',
      mediaType: 'video',
      padId: 'video-b',
      activeSessions
    }),
    {
      mode: 'toggle',
      shouldStart: true,
      stopInstanceIds: ['audio-a-1', 'audio-a-2', 'audio-b-1', 'video-a-1']
    }
  );
});

test('planning does not mutate the provided active session list', () => {
  const before = structuredClone(activeSessions);
  planPlayback({
    mode: 'restart',
    mediaType: 'audio',
    padId: 'audio-a',
    activeSessions
  });
  assert.deepEqual(activeSessions, before);
});

test('caps overlap audio per pad by evicting the oldest instance', () => {
  const sessions = Array.from(
    { length: MAX_AUDIO_SESSIONS_PER_PAD },
    (_, index) => ({
      instanceId: `same-${index}`,
      padId: 'same',
      mediaType: 'audio'
    })
  );
  assert.deepEqual(
    selectAudioSessionsToEvict({ padId: 'same', activeSessions: sessions }),
    ['same-0']
  );
});

test('caps total audio without evicting an active video', () => {
  const sessions = [
    { instanceId: 'video', padId: 'video', mediaType: 'video' },
    ...Array.from({ length: MAX_AUDIO_SESSIONS }, (_, index) => ({
      instanceId: `audio-${index}`,
      padId: `pad-${index}`,
      mediaType: 'audio'
    }))
  ];
  assert.deepEqual(
    selectAudioSessionsToEvict({ padId: 'new-pad', activeSessions: sessions }),
    ['audio-0']
  );
});
