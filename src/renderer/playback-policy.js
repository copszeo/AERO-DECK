(function exposePlaybackPolicy(root, factory) {
  const policy = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = policy;
    return;
  }
  root.aeroPlaybackPolicy = policy;
}(typeof globalThis === 'object' ? globalThis : this, () => {
  'use strict';

  const DEFAULT_PLAYBACK_MODE = 'exclusive';
  const MAX_AUDIO_SESSIONS = 24;
  const MAX_AUDIO_SESSIONS_PER_PAD = 6;
  const PLAYBACK_MODES = Object.freeze([
    DEFAULT_PLAYBACK_MODE,
    'restart',
    'toggle',
    'overlap'
  ]);
  const PLAYBACK_MODE_SET = new Set(PLAYBACK_MODES);

  function normalizePlaybackMode(value) {
    const mode = String(value ?? '').trim().toLowerCase();
    return PLAYBACK_MODE_SET.has(mode) ? mode : DEFAULT_PLAYBACK_MODE;
  }

  function validSessions(value) {
    return Array.isArray(value) ? value : [];
  }

  function planPlayback(input = {}) {
    const mode = normalizePlaybackMode(input.mode);
    const mediaType = String(input.mediaType ?? '').trim().toLowerCase();
    const padId = String(input.padId ?? '');
    const activeSessions = validSessions(input.activeSessions);

    const allInstanceIds = activeSessions
      .map((session) => String(session?.instanceId ?? ''))
      .filter(Boolean);
    const matchingInstanceIds = activeSessions
      .filter((session) => String(session?.padId ?? '') === padId)
      .map((session) => String(session?.instanceId ?? ''))
      .filter(Boolean);

    if (mediaType === 'video') {
      const togglingOff = mode === 'toggle' && matchingInstanceIds.length > 0;
      return {
        mode,
        shouldStart: !togglingOff,
        stopInstanceIds: togglingOff ? matchingInstanceIds : allInstanceIds
      };
    }

    if (mode === 'restart') {
      return {
        mode,
        shouldStart: true,
        stopInstanceIds: matchingInstanceIds
      };
    }

    if (mode === 'toggle') {
      return {
        mode,
        shouldStart: matchingInstanceIds.length === 0,
        stopInstanceIds: matchingInstanceIds
      };
    }

    if (mode === 'overlap') {
      return {
        mode,
        shouldStart: true,
        stopInstanceIds: []
      };
    }

    return {
      mode,
      shouldStart: true,
      stopInstanceIds: allInstanceIds
    };
  }

  function selectAudioSessionsToEvict(input = {}) {
    const padId = String(input.padId ?? '');
    const activeAudio = validSessions(input.activeSessions)
      .filter((session) => session?.mediaType === 'audio' && session.instanceId);
    const selected = new Set();

    const samePad = activeAudio.filter(
      (session) => String(session.padId ?? '') === padId
    );
    const perPadOverflow = Math.max(
      0,
      samePad.length - MAX_AUDIO_SESSIONS_PER_PAD + 1
    );
    for (const session of samePad.slice(0, perPadOverflow)) {
      selected.add(String(session.instanceId));
    }

    const remaining = activeAudio.filter(
      (session) => !selected.has(String(session.instanceId))
    );
    const totalOverflow = Math.max(
      0,
      remaining.length - MAX_AUDIO_SESSIONS + 1
    );
    for (const session of remaining.slice(0, totalOverflow)) {
      selected.add(String(session.instanceId));
    }

    return [...selected];
  }

  return Object.freeze({
    DEFAULT_PLAYBACK_MODE,
    MAX_AUDIO_SESSIONS,
    MAX_AUDIO_SESSIONS_PER_PAD,
    PLAYBACK_MODES,
    normalizePlaybackMode,
    planPlayback,
    selectAudioSessionsToEvict
  });
}));
