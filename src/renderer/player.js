'use strict';

const api = window.aeroDeck;

const audio = document.querySelector('#audioPlayer');
const video = document.querySelector('#videoPlayer');
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

let currentSession = null;
let sessionSequence = 0;
let pinned = true;

function sendStatus(session, state, details = {}) {
  if (!session) return;
  api.playback.sendStatus({
    id: session.pad.id,
    state,
    currentTime: Number(session.element.currentTime) || 0,
    duration: Number(session.element.duration) || 0,
    ...details
  });
}

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

function resetElement(element) {
  if (!element) return;
  element.pause();
  element.removeAttribute('src');
  element.load();
}

function isCurrent(session) {
  return currentSession === session && session.token === sessionSequence;
}

function detachSession(session) {
  if (!session?.handlers) return;
  for (const [eventName, handler] of Object.entries(session.handlers)) {
    session.element.removeEventListener(eventName, handler);
  }
  session.handlers = null;
}

function attachSession(session) {
  session.handlers = {
    playing: () => {
      if (!isCurrent(session)) return;
      if (session.pad.type === 'video') {
        showVideo();
      } else {
        showIdle();
      }
      sendStatus(session, 'playing');
    },
    timeupdate: () => {
      if (!isCurrent(session)) return;
      const now = Date.now();
      if (now - session.lastProgressSentAt < 220) return;
      session.lastProgressSentAt = now;
      sendStatus(session, session.element.paused ? 'paused' : 'playing');
    },
    pause: () => {
      if (!isCurrent(session) || session.element.ended) return;
      sendStatus(session, 'paused');
    },
    ended: () => {
      if (!isCurrent(session) || session.element.loop) return;
      sendStatus(session, 'ended');
    },
    error: () => {
      if (!isCurrent(session)) return;
      const message = 'Media tidak dapat diputar. Periksa file atau codec video.';
      showError(message);
      sendStatus(session, 'error', { error: message });
    }
  };

  for (const [eventName, handler] of Object.entries(session.handlers)) {
    session.element.addEventListener(eventName, handler);
  }
}

function stopCurrent(notify = true) {
  const session = currentSession;
  currentSession = null;
  sessionSequence += 1;
  if (session && notify) sendStatus(session, 'stopped');
  detachSession(session);
  resetElement(audio);
  resetElement(video);
  windowMediaTitle.textContent = 'Video player';
  showIdle();
}

async function playPad(message) {
  const pad = message?.pad;
  if (!pad?.id || !pad.mediaUrl) return;

  stopCurrent(true);
  const element = pad.type === 'video' ? video : audio;
  const session = {
    token: ++sessionSequence,
    pad,
    element,
    handlers: null,
    lastProgressSentAt: 0
  };
  currentSession = session;
  attachSession(session);

  windowMediaTitle.textContent = pad.title;
  overlayMediaTitle.textContent = pad.title;
  const volume = Number(pad.volume);
  element.volume = Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 1;
  element.loop = Boolean(pad.loop);
  element.src = pad.mediaUrl;
  showLoading();
  sendStatus(session, 'loading');

  try {
    await element.play();
    if (!isCurrent(session)) return;
    if (pad.type === 'video') {
      showVideo();
    } else {
      showIdle();
    }
    sendStatus(session, 'playing');
  } catch {
    if (!isCurrent(session)) return;
    const messageText = 'Format media tidak didukung atau file tidak dapat dibaca.';
    showError(messageText);
    sendStatus(session, 'error', { error: messageText });
  }
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
api.playback.onStop(() => stopCurrent(true));
showIdle();
api.playback.ready();
