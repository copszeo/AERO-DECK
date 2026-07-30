'use strict';

const {
  MULTIMEDIA_VIRTUAL_KEYS,
  createWindowsActionAdapter,
  normalizeAutomationHotkey
} = require('./actions/windows-adapter');

const ACTION_TYPES = Object.freeze([
  'media',
  'open',
  'close',
  'website',
  'hotkey',
  'text',
  'multimedia',
  'switch-deck',
  'delay',
  'sequence',
  'parallel',
  'random',
  'toggle'
]);

const ACTION_TYPE_SET = new Set(ACTION_TYPES);
const PLAYBACK_MODES = new Set(['exclusive', 'restart', 'toggle', 'overlap']);
const BLOCKED_URI_SCHEMES = new Set([
  'about',
  'blob',
  'data',
  'file',
  'filesystem',
  'javascript',
  'vbscript'
]);
const ALLOWED_URI_SCHEMES = new Set([
  'discord',
  'http',
  'https',
  'mailto',
  'obsidian',
  'spotify',
  'steam'
]);

const LIMITS = Object.freeze({
  maxActionDepth: 6,
  maxActionNodes: 128,
  maxChildren: 32,
  maxDelayMs: 60_000,
  maxIdLength: 128,
  maxParallelChildren: 8,
  maxRunTimeoutMs: 300_000,
  maxTargetLength: 4096,
  maxTextLength: 4000,
  maxUrlLength: 2048
});

const DEFAULT_RUN_TIMEOUT_MS = 120_000;

class ActionValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ActionValidationError';
  }
}

function createAbortError(message = 'Aksi dibatalkan.') {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

function createTimeoutError() {
  const error = new Error('Aksi melewati batas waktu.');
  error.name = 'TimeoutError';
  return error;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cleanString(value, label, options = {}) {
  const {
    allowEmpty = false,
    maxLength = LIMITS.maxTargetLength,
    trim = true
  } = options;
  const raw = String(value ?? '');
  const result = trim ? raw.trim() : raw;

  if (!allowEmpty && !result) {
    throw new ActionValidationError(`${label} wajib diisi.`);
  }
  if (result.length > maxLength) {
    throw new ActionValidationError(`${label} terlalu panjang.`);
  }
  if (result.includes('\u0000')) {
    throw new ActionValidationError(`${label} mengandung karakter yang tidak diizinkan.`);
  }
  return result;
}

function cleanIdentifier(value, label, required = true) {
  if (value !== undefined && value !== null && typeof value !== 'string') {
    throw new ActionValidationError(`${label} tidak valid.`);
  }
  if (typeof value === 'string' && value !== value.trim()) {
    throw new ActionValidationError(`${label} tidak valid.`);
  }
  const result = cleanString(value, label, {
    allowEmpty: !required,
    maxLength: LIMITS.maxIdLength
  });
  if (/[\u0000-\u001f\u007f]/.test(result)) {
    throw new ActionValidationError(`${label} mengandung karakter yang tidak diizinkan.`);
  }
  if (
    result
    && (
      !/^[a-z0-9][a-z0-9._:-]*$/i.test(result)
      || ['__proto__', 'constructor', 'prototype'].includes(result.toLowerCase())
    )
  ) {
    throw new ActionValidationError(`${label} tidak valid.`);
  }
  return result;
}

function normalizeWebsiteUrl(value) {
  const raw = cleanString(value, 'URL', { maxLength: LIMITS.maxUrlLength });
  if (/\s/.test(raw) || /^[a-zA-Z]:/.test(raw)) {
    throw new ActionValidationError('URL tidak valid.');
  }

  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]{0,31}):/.exec(raw);
  if (!schemeMatch) {
    throw new ActionValidationError('URL harus menyertakan protokol.');
  }

  const scheme = schemeMatch[1].toLowerCase();
  if (BLOCKED_URI_SCHEMES.has(scheme)) {
    throw new ActionValidationError(`Protokol "${scheme}:" tidak diizinkan.`);
  }
  if (!ALLOWED_URI_SCHEMES.has(scheme)) {
    throw new ActionValidationError(`Protokol "${scheme}:" belum didukung.`);
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new ActionValidationError('URL tidak valid.');
  }

  if ((scheme === 'http' || scheme === 'https') && !parsed.hostname) {
    throw new ActionValidationError('URL web harus memiliki nama host.');
  }
  if (scheme !== 'http' && scheme !== 'https' && raw.length === scheme.length + 1) {
    throw new ActionValidationError('URI kustom harus memiliki tujuan.');
  }

  return parsed.href;
}

function getChildren(action, type) {
  const value = action.actions ?? action.children;
  if (!Array.isArray(value)) {
    throw new ActionValidationError(`Aksi ${type} memerlukan daftar actions.`);
  }
  return value;
}

function normalizeMediaAction(action, base) {
  const padId = cleanIdentifier(action.padId, 'ID pad', false);
  const mediaPath = cleanString(
    action.mediaPath ?? action.path ?? '',
    'Lokasi media',
    {
      allowEmpty: true,
      maxLength: LIMITS.maxTargetLength
    }
  );

  if (!padId && !mediaPath) {
    throw new ActionValidationError('Aksi media memerlukan padId atau mediaPath.');
  }

  const mediaType = String(action.mediaType ?? '').trim().toLowerCase();
  if (mediaType && mediaType !== 'audio' && mediaType !== 'video') {
    throw new ActionValidationError('Jenis media harus audio atau video.');
  }

  const playbackMode = String(action.playbackMode ?? '').trim().toLowerCase();
  if (playbackMode && !PLAYBACK_MODES.has(playbackMode)) {
    throw new ActionValidationError('Mode playback tidak valid.');
  }

  const result = {
    ...base,
    padId,
    mediaPath
  };
  if (mediaType) result.mediaType = mediaType;
  if (playbackMode) result.playbackMode = playbackMode;

  if (action.volume !== undefined) {
    const volume = Number(action.volume);
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) {
      throw new ActionValidationError('Volume media harus berada di antara 0 dan 1.');
    }
    result.volume = volume;
  }

  return result;
}

function validateAction(input) {
  const state = {
    activeObjects: new Set(),
    nodes: 0
  };

  const visit = (action, depth, insideSequence, insideParallel) => {
    if (!isObject(action)) {
      throw new ActionValidationError('Aksi harus berupa objek.');
    }
    if (state.activeObjects.has(action)) {
      throw new ActionValidationError('Aksi tidak boleh memiliki referensi melingkar.');
    }
    if (depth > LIMITS.maxActionDepth) {
      throw new ActionValidationError(
        `Kedalaman aksi melebihi batas ${LIMITS.maxActionDepth}.`
      );
    }

    state.nodes += 1;
    if (state.nodes > LIMITS.maxActionNodes) {
      throw new ActionValidationError(
        `Jumlah aksi melebihi batas ${LIMITS.maxActionNodes}.`
      );
    }

    const type = String(action.type ?? '').trim().toLowerCase();
    if (!ACTION_TYPE_SET.has(type)) {
      throw new ActionValidationError(`Jenis aksi "${type || '-'}" tidak didukung.`);
    }
    if (type === 'sequence' && insideSequence) {
      throw new ActionValidationError('Sequence tidak boleh berada di dalam sequence lain.');
    }
    if (type === 'parallel' && insideParallel) {
      throw new ActionValidationError('Parallel tidak boleh berada di dalam parallel lain.');
    }

    const optionalId = cleanIdentifier(action.id, 'ID aksi', false);
    const base = optionalId ? { type, id: optionalId } : { type };

    if (type === 'media') {
      return normalizeMediaAction(action, base);
    }

    if (type === 'open') {
      const target = cleanString(
        action.target ?? action.path,
        'Target',
        { maxLength: LIMITS.maxTargetLength }
      );
      if (/[\u0000-\u001f\u007f]/.test(target)) {
        throw new ActionValidationError('Target mengandung karakter yang tidak diizinkan.');
      }
      return { ...base, target };
    }

    if (type === 'close') {
      const target = cleanString(
        action.target ?? action.path,
        'Target',
        { maxLength: LIMITS.maxTargetLength }
      );
      if (/[\u0000-\u001f\u007f]/.test(target)) {
        throw new ActionValidationError('Target mengandung karakter yang tidak diizinkan.');
      }
      return {
        ...base,
        force: action.force === true,
        target
      };
    }

    if (type === 'website') {
      return {
        ...base,
        url: normalizeWebsiteUrl(action.url ?? action.target)
      };
    }

    if (type === 'hotkey') {
      const hotkey = normalizeAutomationHotkey(action.hotkey ?? action.keys);
      if (!hotkey) {
        throw new ActionValidationError('Kombinasi hotkey tidak valid.');
      }
      return {
        ...base,
        hotkey: hotkey.value
      };
    }

    if (type === 'text') {
      const text = cleanString(action.text, 'Teks', {
        allowEmpty: true,
        maxLength: LIMITS.maxTextLength,
        trim: false
      });
      return {
        ...base,
        pressEnter: action.pressEnter === true || action.enter === true,
        text
      };
    }

    if (type === 'multimedia') {
      const command = String(action.command ?? action.key ?? '').trim().toLowerCase();
      if (!Object.hasOwn(MULTIMEDIA_VIRTUAL_KEYS, command)) {
        throw new ActionValidationError('Perintah multimedia tidak valid.');
      }
      return { ...base, command };
    }

    if (type === 'switch-deck') {
      return {
        ...base,
        deckId: cleanIdentifier(action.deckId, 'ID deck')
      };
    }

    if (type === 'delay') {
      const milliseconds = Number(action.ms ?? action.durationMs);
      if (
        !Number.isInteger(milliseconds)
        || milliseconds < 0
        || milliseconds > LIMITS.maxDelayMs
      ) {
        throw new ActionValidationError(
          `Delay harus berupa bilangan bulat 0-${LIMITS.maxDelayMs} ms.`
        );
      }
      return { ...base, ms: milliseconds };
    }

    const children = getChildren(action, type);
    const requiredLength = type === 'toggle' ? 2 : null;
    if (requiredLength && children.length !== requiredLength) {
      throw new ActionValidationError('Aksi toggle harus memiliki tepat dua actions.');
    }
    if (!requiredLength && (children.length < 1 || children.length > LIMITS.maxChildren)) {
      throw new ActionValidationError(
        `Aksi ${type} harus memiliki 1-${LIMITS.maxChildren} actions.`
      );
    }
    if (children.length > LIMITS.maxChildren) {
      throw new ActionValidationError(
        `Jumlah child melebihi batas ${LIMITS.maxChildren}.`
      );
    }
    if (type === 'parallel' && children.length > LIMITS.maxParallelChildren) {
      throw new ActionValidationError(
        `Aksi parallel dibatasi ${LIMITS.maxParallelChildren} langkah.`
      );
    }
    if (type === 'toggle' && !base.id) {
      throw new ActionValidationError('Aksi toggle memerlukan ID agar statusnya dapat disimpan.');
    }

    state.activeObjects.add(action);
    try {
      const childInsideSequence = insideSequence || type === 'sequence';
      const childInsideParallel = insideParallel || type === 'parallel';
      return {
        ...base,
        actions: children.map(
          (child) => visit(
            child,
            depth + 1,
            childInsideSequence,
            childInsideParallel
          )
        )
      };
    } finally {
      state.activeObjects.delete(action);
    }
  };

  return visit(input, 1, false, false);
}

function normalizeRunTimeout(value) {
  const timeout = value === undefined ? DEFAULT_RUN_TIMEOUT_MS : Number(value);
  if (
    !Number.isInteger(timeout)
    || timeout < 1
    || timeout > LIMITS.maxRunTimeoutMs
  ) {
    throw new ActionValidationError(
      `Timeout aksi harus 1-${LIMITS.maxRunTimeoutMs} ms.`
    );
  }
  return timeout;
}

function toggleStateKey(id, metadata = {}) {
  const rootPadId = String(metadata.rootPadId ?? '').trim() || 'global';
  return `${rootPadId}\u0000${id}`;
}

function waitForDelay(milliseconds, signal) {
  if (signal.aborted) {
    return Promise.reject(createAbortError());
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', handleAbort);
      resolve();
    }, milliseconds);

    const handleAbort = () => {
      clearTimeout(timer);
      reject(createAbortError());
    };
    signal.addEventListener('abort', handleAbort, { once: true });
  });
}

function wrapExecutionError(type, error) {
  if (error?.name === 'AbortError' || error?.name === 'TimeoutError') {
    return error;
  }
  const detail = error instanceof Error ? error.message : String(error);
  return new Error(`Aksi ${type} gagal: ${detail}`, { cause: error });
}

class ActionRunner {
  constructor(options = {}) {
    const platform = options.platform ?? process.platform;
    this.adapter = options.adapter
      ?? (platform === 'win32'
        ? createWindowsActionAdapter(options.windowsAdapter)
        : Object.freeze({}));
    this.playMedia = options.playMedia;
    this.switchDeck = options.switchDeck;
    this.random = options.random ?? Math.random;
    this.runTimeoutMs = normalizeRunTimeout(options.timeoutMs);
    this.activeRuns = new Set();
    this.toggleState = new Map();
    this.nextRunId = 1;

    if (!isObject(this.adapter)) {
      throw new TypeError('Adapter aksi harus berupa objek.');
    }
    if (typeof this.random !== 'function') {
      throw new TypeError('Sumber random harus berupa fungsi.');
    }
  }

  async run(action, options = {}) {
    const normalizedAction = validateAction(action);
    const timeoutMs = normalizeRunTimeout(options.timeoutMs ?? this.runTimeoutMs);
    const controller = new AbortController();
    const externalSignal = options.signal;
    const metadata = isObject(options.metadata) ? options.metadata : {};
    const run = {
      controller,
      id: this.nextRunId,
      rootPadId: String(metadata.rootPadId ?? '')
    };
    this.nextRunId += 1;

    if (externalSignal?.aborted) {
      throw createAbortError();
    }

    const handleExternalAbort = () => {
      controller.abort(createAbortError());
    };
    externalSignal?.addEventListener('abort', handleExternalAbort, { once: true });

    const timeout = setTimeout(() => {
      controller.abort(createTimeoutError());
    }, timeoutMs);

    const aborted = new Promise((resolve, reject) => {
      controller.signal.addEventListener('abort', () => {
        const reason = controller.signal.reason;
        reject(reason instanceof Error ? reason : createAbortError());
      }, { once: true });
    });

    const context = {
      abort: (reason) => {
        if (!controller.signal.aborted) {
          controller.abort(reason instanceof Error ? reason : createAbortError());
        }
      },
      metadata,
      runId: run.id,
      signal: controller.signal
    };
    const cleanup = () => {
      clearTimeout(timeout);
      externalSignal?.removeEventListener('abort', handleExternalAbort);
      this.activeRuns.delete(run);
    };

    this.activeRuns.add(run);
    const execution = this.execute(normalizedAction, context);
    execution.then(cleanup, cleanup);
    return await Promise.race([execution, aborted]);
  }

  cancelAll() {
    const runs = [...this.activeRuns];
    for (const run of runs) {
      run.controller.abort(createAbortError('Semua aksi dibatalkan.'));
    }
    return runs.length;
  }

  cancelRootPad(rootPadId) {
    const normalizedId = String(rootPadId ?? '');
    let canceled = 0;
    for (const run of this.activeRuns) {
      if (run.rootPadId !== normalizedId) continue;
      run.controller.abort(createAbortError('Aksi pad dibatalkan.'));
      canceled += 1;
    }
    return canceled;
  }

  resetToggleState(id, rootPadId = '') {
    if (id === undefined) {
      const size = this.toggleState.size;
      this.toggleState.clear();
      return size;
    }
    return this.toggleState.delete(toggleStateKey(id, { rootPadId }));
  }

  resetToggleStateForRoot(rootPadId) {
    const prefix = `${String(rootPadId ?? '').trim() || 'global'}\u0000`;
    let removed = 0;
    for (const key of this.toggleState.keys()) {
      if (!key.startsWith(prefix)) continue;
      this.toggleState.delete(key);
      removed += 1;
    }
    return removed;
  }

  get activeRunCount() {
    return this.activeRuns.size;
  }

  async execute(action, context) {
    const meta = {
      action,
      metadata: context.metadata,
      runId: context.runId,
      signal: context.signal
    };

    try {
      if (action.type === 'delay') {
        await waitForDelay(action.ms, context.signal);
        return action.ms;
      }

      if (action.type === 'sequence') {
        const results = [];
        for (const child of action.actions) {
          if (context.signal.aborted) throw createAbortError();
          results.push(await this.execute(child, context));
        }
        return results;
      }

      if (action.type === 'parallel') {
        const tasks = action.actions.map(async (child) => {
          try {
            return await this.execute(child, context);
          } catch (error) {
            context.abort(error);
            throw error;
          }
        });
        const settled = await Promise.allSettled(tasks);
        const failure = settled.find((result) => result.status === 'rejected');
        if (failure) throw failure.reason;
        return settled.map((result) => result.value);
      }

      if (action.type === 'random') {
        const randomValue = Number(this.random());
        if (!Number.isFinite(randomValue)) {
          throw new Error('Sumber random menghasilkan nilai yang tidak valid.');
        }
        const bounded = Math.min(Math.max(randomValue, 0), 1 - Number.EPSILON);
        const index = Math.floor(bounded * action.actions.length);
        return {
          index,
          value: await this.execute(action.actions[index], context)
        };
      }

      if (action.type === 'toggle') {
        const stateKey = toggleStateKey(action.id, context.metadata);
        const index = this.toggleState.get(stateKey) ?? 0;
        const value = await this.execute(action.actions[index], context);
        this.toggleState.set(stateKey, index === 0 ? 1 : 0);
        return {
          index,
          value
        };
      }

      if (action.type === 'media') {
        return await this.callHandler(
          this.playMedia,
          'media',
          [action, meta]
        );
      }

      if (action.type === 'switch-deck') {
        return await this.callHandler(
          this.switchDeck,
          'switch-deck',
          [action.deckId, meta]
        );
      }

      if (action.type === 'open') {
        return await this.callAdapter('open', action.target, meta);
      }
      if (action.type === 'close') {
        return await this.callAdapter('close', action.target, {
          ...meta,
          force: action.force
        });
      }
      if (action.type === 'website') {
        return await this.callAdapter('website', action.url, meta);
      }
      if (action.type === 'hotkey') {
        return await this.callAdapter('hotkey', action.hotkey, meta);
      }
      if (action.type === 'text') {
        return await this.callAdapter('text', action.text, {
          ...meta,
          pressEnter: action.pressEnter
        });
      }
      if (action.type === 'multimedia') {
        return await this.callAdapter('multimedia', action.command, meta);
      }

      throw new Error('Jenis aksi tidak dikenali.');
    } catch (error) {
      throw wrapExecutionError(action.type, error);
    }
  }

  callAdapter(method, value, context) {
    return this.callHandler(this.adapter[method], method, [value, context], this.adapter);
  }

  callHandler(handler, label, args, receiver = undefined) {
    if (typeof handler !== 'function') {
      throw new Error(`Handler untuk aksi "${label}" belum tersedia.`);
    }
    return handler.apply(receiver, args);
  }
}

function createActionRunner(options) {
  return new ActionRunner(options);
}

module.exports = {
  ACTION_TYPES,
  ActionRunner,
  ActionValidationError,
  DEFAULT_RUN_TIMEOUT_MS,
  LIMITS,
  createActionRunner,
  normalizeWebsiteUrl,
  validateAction
};
