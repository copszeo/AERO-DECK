'use strict';

const api = window.aeroDeck;

const video = document.querySelector('#videoPlayer');
const audioPlaceholder = document.querySelector('#audioPlayer');
const mediaStage = document.querySelector('.player-stage');
const idle = document.querySelector('#playerIdle');
const loading = document.querySelector('#playerLoading');
const errorView = document.querySelector('#playerError');
const errorMessage = document.querySelector('#playerErrorMessage');
const titleOverlay = document.querySelector('#titleOverlay');
const overlayMediaTitle = document.querySelector('#overlayMediaTitle');
const windowMediaTitle = document.querySelector('#windowMediaTitle');
const stageActions = document.querySelector('#stageActions');
const fullscreenButton = document.querySelector('#fullscreenButton');
const pinButton = document.querySelector('#pinButton');

const {
  planPlayback,
  selectAudioSessionsToEvict
} = window.aeroPlaybackPolicy;
const sessions = new Map();

let sessionSequence = 0;
let videoSession = null;
let pinned = true;

// Audio sessions own their element, so overlap playback never has to reuse one.
audioPlaceholder.remove();

function showIdle() {
  idle.hidden = false;
  loading.hidden = true;
  errorView.hidden = true;
  titleOverlay.hidden = true;
  stageActions.hidden = true;
  video.classList.remove('is-visible');
}

function showLoading() {
  idle.hidden = true;
  loading.hidden = false;
  errorView.hidden = true;
  titleOverlay.hidden = true;
}

function showVideo() {
  idle.hidden = true;
  loading.hidden = true;
  errorView.hidden = true;
  video.classList.add('is-visible');
  stageActions.hidden = false;
  titleOverlay.hidden = false;
  titleOverlay.style.animation = 'none';
  titleOverlay.offsetHeight;
  titleOverlay.style.animation = '';
}

function showError(message) {
  idle.hidden = true;
  loading.hidden = true;
  video.classList.remove('is-visible');
  stageActions.hidden = true;
  titleOverlay.hidden = true;
  errorView.hidden = false;
  errorMessage.textContent = message || 'Periksa file atau format media.';
}

function readProgress(session) {
  const currentTime = Number(session.element.currentTime);
  const duration = Number(session.element.duration);
  return {
    currentTime: Number.isFinite(currentTime) ? currentTime : 0,
    duration: Number.isFinite(duration) ? duration : 0
  };
}

function activeCount(padId) {
  let count = 0;
  for (const session of sessions.values()) {
    if (session.pad.id === padId) count += 1;
  }
  return count;
}

function sendStatus(session, state, details = {}, progress = readProgress(session)) {
  api.playback.sendStatus({
    id: session.pad.id,
    state,
    instanceId: session.instanceId,
    activeCount: activeCount(session.pad.id),
    source: session.source,
    currentTime: progress.currentTime,
    duration: progress.duration,
    error: typeof details.error === 'string' ? details.error : ''
  });
}

function isActive(session) {
  return sessions.get(session.instanceId) === session;
}

function detachSession(session) {
  if (!session.handlers) return;
  for (const [eventName, handler] of Object.entries(session.handlers)) {
    session.element.removeEventListener(eventName, handler);
  }
  session.handlers = null;
}

function resetElement(session) {
  session.element.pause();
  session.element.removeAttribute('src');
  session.element.load();

  if (session.pad.type === 'audio') {
    session.element.remove();
  }
}

function disposeSession(session, state, details = {}) {
  if (!isActive(session)) return false;

  const progress = readProgress(session);
  const wasVideoSession = videoSession === session;

  sessions.delete(session.instanceId);
  if (wasVideoSession) videoSession = null;

  detachSession(session);
  resetElement(session);

  if (wasVideoSession) {
    windowMediaTitle.textContent = 'Video player';
    if (state === 'error') {
      showError(details.error);
    } else {
      showIdle();
    }
  }

  sendStatus(session, state, details, progress);
  return true;
}

function attachSession(session) {
  session.handlers = {
    playing: () => {
      if (!isActive(session)) return;
      session.playingReported = true;
      if (session.pad.type === 'video') showVideo();
      sendStatus(session, 'playing');
    },
    timeupdate: () => {
      if (!isActive(session)) return;
      const now = Date.now();
      if (now - session.lastProgressSentAt < 220) return;
      session.lastProgressSentAt = now;
      sendStatus(session, session.element.paused ? 'paused' : 'playing');
    },
    pause: () => {
      if (!isActive(session) || session.element.ended) return;
      sendStatus(session, 'paused');
    },
    ended: () => {
      disposeSession(session, 'ended');
    },
    error: () => {
      const message = 'Media tidak dapat diputar. Periksa file atau codec media.';
      disposeSession(session, 'error', { error: message });
    }
  };

  for (const [eventName, handler] of Object.entries(session.handlers)) {
    session.element.addEventListener(eventName, handler);
  }
}

function stopInstances(instanceIds) {
  for (const instanceId of instanceIds) {
    const session = sessions.get(instanceId);
    if (session) disposeSession(session, 'stopped');
  }
}

function activeSessionDescriptions() {
  return [...sessions.values()].map((session) => ({
    instanceId: session.instanceId,
    padId: session.pad.id,
    mediaType: session.pad.type
  }));
}

function createSession(pad, source) {
  const element = pad.type === 'video'
    ? video
    : document.createElement('audio');
  const instanceId = `media-${Date.now().toString(36)}-${++sessionSequence}`;

  if (pad.type === 'audio') {
    element.hidden = true;
    element.preload = 'auto';
    element.dataset.instanceId = instanceId;
    mediaStage.append(element);
  }

  return {
    instanceId,
    pad,
    source: source === 'hotkey' ? 'hotkey' : 'app',
    element,
    handlers: null,
    lastProgressSentAt: 0,
    playingReported: false
  };
}

async function startSession(pad, source) {
  const session = createSession(pad, source);
  const volume = Number(pad.volume);

  sessions.set(session.instanceId, session);
  if (pad.type === 'video') videoSession = session;
  attachSession(session);

  session.element.volume = Number.isFinite(volume)
    ? Math.min(1, Math.max(0, volume))
    : 1;
  session.element.loop = Boolean(pad.loop);
  session.element.src = pad.mediaUrl;

  if (pad.type === 'video') {
    windowMediaTitle.textContent = pad.title;
    overlayMediaTitle.textContent = pad.title;
    showLoading();
  }
  sendStatus(session, 'loading');

  try {
    await session.element.play();
    if (!isActive(session)) return;

    if (pad.type === 'video') showVideo();
    if (!session.playingReported) {
      session.playingReported = true;
      sendStatus(session, 'playing');
    }
  } catch {
    if (!isActive(session)) return;
    const message = 'Format media tidak didukung atau file tidak dapat dibaca.';
    disposeSession(session, 'error', { error: message });
  }
}

async function playPad(message) {
  const pad = message?.pad;
  if (!pad?.id || !pad.mediaUrl || !['audio', 'video'].includes(pad.type)) return;

  const plan = planPlayback({
    mode: pad.playbackMode,
    mediaType: pad.type,
    padId: pad.id,
    activeSessions: activeSessionDescriptions()
  });

  stopInstances(plan.stopInstanceIds);
  if (plan.shouldStart && pad.type === 'audio') {
    stopInstances(selectAudioSessionsToEvict({
      padId: pad.id,
      activeSessions: activeSessionDescriptions()
    }));
  }
  if (plan.shouldStart) await startSession(pad, message.source);
}

function stopAll() {
  stopInstances([...sessions.keys()]);
  windowMediaTitle.textContent = 'Video player';
  showIdle();
}

function stopPlayback(payload) {
  if (!payload) {
    stopAll();
    return;
  }

  const instanceId = typeof payload === 'object' ? payload.instanceId : '';
  if (instanceId) {
    stopInstances([instanceId]);
    return;
  }

  const padId = typeof payload === 'string'
    ? payload
    : String(payload.id ?? payload.padId ?? '');
  if (!padId) {
    stopAll();
    return;
  }

  const matchingIds = [...sessions.values()]
    .filter((session) => session.pad.id === padId)
    .map((session) => session.instanceId);
  stopInstances(matchingIds);
}

for (const button of document.querySelectorAll('[data-player-action]')) {
  button.addEventListener('click', () => api.window.action(button.dataset.playerAction));
}

pinButton.classList.toggle('is-active', pinned);
pinButton.addEventListener('click', async () => {
  pinned = Boolean(await api.window.action('toggle-always-on-top'));
  pinButton.classList.toggle('is-active', pinned);
});

fullscreenButton.addEventListener('click', () => api.window.action('toggle-fullscreen'));

document.addEventListener('keydown', async (event) => {
  if (event.key === 'Escape') {
    await api.window.action('dismiss-player');
  }
});

api.playback.onPlay(playPad);
api.playback.onStop(stopPlayback);
showIdle();
document.documentElement.dataset.aeroPlayerReady = 'true';
api.playback.ready();
