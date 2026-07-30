'use strict';

class PlaybackQueue {
  constructor(onCanceled = () => {}) {
    this.pending = null;
    this.onCanceled = onCanceled;
  }

  enqueue(message) {
    if (!message?.pad?.id) {
      throw new Error('Pesan playback tidak valid.');
    }
    if (this.pending) {
      this.cancel();
    }
    this.pending = message;
  }

  take() {
    const message = this.pending;
    this.pending = null;
    return message;
  }

  cancel(id = '') {
    if (!this.pending || (id && this.pending.pad.id !== id)) {
      return false;
    }
    const message = this.pending;
    this.pending = null;
    this.onCanceled(message);
    return true;
  }

  hasPending() {
    return Boolean(this.pending);
  }
}

module.exports = { PlaybackQueue };
