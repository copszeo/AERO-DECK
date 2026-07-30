'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { PassThrough } = require('node:stream');
const {
  ACTION_TYPES,
  ActionValidationError,
  LIMITS,
  createActionRunner,
  normalizeWebsiteUrl,
  validateAction
} = require('../src/main/action-runner');
const {
  PAYLOAD_ENV_KEY,
  POWERSHELL_ENCODED_COMMAND,
  createWindowsActionAdapter,
  escapeSendKeysText,
  normalizeAutomationHotkey
} = require('../src/main/actions/windows-adapter');

function createFakeChild(onKill = () => {}) {
  const child = new EventEmitter();
  child.stderr = new PassThrough();
  child.kill = () => {
    onKill();
    return true;
  };
  return child;
}

function createSuccessfulSpawn(calls) {
  return (executable, args, options) => {
    const child = createFakeChild();
    calls.push({ args, executable, options });
    queueMicrotask(() => child.emit('close', 0));
    return child;
  };
}

function decodeWindowsPayload(call) {
  return JSON.parse(
    Buffer.from(call.options.env[PAYLOAD_ENV_KEY], 'base64').toString('utf8')
  );
}

test('mengekspor semua jenis aksi yang didukung', () => {
  assert.deepEqual(ACTION_TYPES, [
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
});

test('menolak identifier aksi non-string atau tidak kanonis', () => {
  assert.throws(
    () => validateAction({ type: 'switch-deck', deckId: { crafted: true } }),
    /ID deck tidak valid/
  );
  assert.throws(
    () => validateAction({ type: 'toggle', id: ' toggle ', actions: [
      { type: 'delay', ms: 0 },
      { type: 'delay', ms: 0 }
    ] }),
    /ID aksi tidak valid/
  );
});

test('sequence menjalankan child satu per satu dan meneruskan hasil', async () => {
  const events = [];
  const adapter = {
    async open(target) {
      events.push(`mulai:${target}`);
      await new Promise((resolve) => setImmediate(resolve));
      events.push(`selesai:${target}`);
      return `dibuka:${target}`;
    },
    close(target, context) {
      events.push(`close:${target}:${context.force}`);
      return 'close-ok';
    },
    website(url) {
      events.push(`website:${url}`);
      return 'web-ok';
    },
    hotkey(value) {
      events.push(`hotkey:${value}`);
      return 'hotkey-ok';
    },
    text(value, context) {
      events.push(`text:${value}:${context.pressEnter}`);
      return 'text-ok';
    },
    multimedia(command) {
      events.push(`media-key:${command}`);
      return 'media-key-ok';
    }
  };
  const runner = createActionRunner({ adapter });

  const result = await runner.run({
    type: 'sequence',
    actions: [
      { type: 'open', target: 'C:\\AERO DECK' },
      { type: 'close', target: 'C:\\AERO DECK\\AERO DECK.exe', force: true },
      { type: 'website', url: 'https://example.com' },
      { type: 'hotkey', hotkey: 'control + shift + k' },
      { type: 'text', text: 'Halo!', pressEnter: true },
      { type: 'multimedia', command: 'play-pause' },
      { type: 'delay', ms: 0 }
    ]
  });

  assert.deepEqual(events, [
    'mulai:C:\\AERO DECK',
    'selesai:C:\\AERO DECK',
    'close:C:\\AERO DECK\\AERO DECK.exe:true',
    'website:https://example.com/',
    'hotkey:Ctrl+Shift+K',
    'text:Halo!:true',
    'media-key:play-pause'
  ]);
  assert.deepEqual(result, [
    'dibuka:C:\\AERO DECK',
    'close-ok',
    'web-ok',
    'hotkey-ok',
    'text-ok',
    'media-key-ok',
    0
  ]);
});

test('parallel menjalankan seluruh child tanpa menunggu child sebelumnya', async () => {
  const releases = [];
  const started = [];
  const runner = createActionRunner({
    adapter: {
      open(target) {
        started.push(target);
        return new Promise((resolve) => releases.push(() => resolve(target)));
      }
    }
  });

  const running = runner.run({
    type: 'parallel',
    actions: [
      { type: 'open', target: 'satu.exe' },
      { type: 'open', target: 'dua.exe' }
    ]
  });

  await Promise.resolve();
  assert.deepEqual(started, ['satu.exe', 'dua.exe']);
  releases.forEach((release) => release());
  assert.deepEqual(await running, ['satu.exe', 'dua.exe']);
});

test('parallel membatalkan sibling ketika salah satu child gagal', async () => {
  const opened = [];
  const runner = createActionRunner({
    adapter: {
      open(target) {
        if (target === 'gagal.exe') {
          throw new Error('simulasi gagal');
        }
        opened.push(target);
        return target;
      }
    }
  });

  await assert.rejects(
    runner.run({
      type: 'parallel',
      actions: [
        { type: 'open', target: 'gagal.exe' },
        {
          type: 'sequence',
          actions: [
            { type: 'delay', ms: 25 },
            { type: 'open', target: 'terlambat.exe' }
          ]
        }
      ]
    }),
    /simulasi gagal/
  );
  await new Promise((resolve) => setTimeout(resolve, 35));
  assert.deepEqual(opened, []);
  assert.equal(runner.activeRunCount, 0);
});

test('media dan switch-deck didelegasikan ke callback', async () => {
  const calls = [];
  const runner = createActionRunner({
    adapter: {},
    playMedia(action, context) {
      calls.push([
        'media',
        action.padId,
        action.playbackMode,
        context.runId,
        context.metadata.source
      ]);
      return 'playing';
    },
    switchDeck(deckId, context) {
      calls.push(['deck', deckId, context.runId]);
      return 'switched';
    }
  });

  assert.equal(await runner.run(
    {
      type: 'media',
      padId: 'pad-1',
      playbackMode: 'restart'
    },
    { metadata: { source: 'hotkey' } }
  ), 'playing');
  assert.equal(await runner.run({
    type: 'switch-deck',
    deckId: 'deck-live'
  }), 'switched');

  assert.deepEqual(calls.map((call) => call.slice(0, 3)), [
    ['media', 'pad-1', 'restart'],
    ['deck', 'deck-live', 2]
  ]);
  assert.equal(calls[0][4], 'hotkey');
});

test('random hanya menjalankan satu child dengan sumber random terinjeksi', async () => {
  const opened = [];
  const runner = createActionRunner({
    adapter: {
      open(target) {
        opened.push(target);
        return target;
      }
    },
    random: () => 0.72
  });

  const result = await runner.run({
    type: 'random',
    actions: [
      { type: 'open', target: 'satu.exe' },
      { type: 'open', target: 'dua.exe' },
      { type: 'open', target: 'tiga.exe' }
    ]
  });

  assert.deepEqual(result, { index: 2, value: 'tiga.exe' });
  assert.deepEqual(opened, ['tiga.exe']);
});

test('random menjepit angka di luar rentang tanpa memilih child yang tidak ada', async () => {
  const runnerLow = createActionRunner({
    adapter: { open: (target) => target },
    random: () => -99
  });
  const runnerHigh = createActionRunner({
    adapter: { open: (target) => target },
    random: () => 99
  });
  const action = {
    type: 'random',
    actions: [
      { type: 'open', target: 'awal' },
      { type: 'open', target: 'akhir' }
    ]
  };

  assert.deepEqual(await runnerLow.run(action), { index: 0, value: 'awal' });
  assert.deepEqual(await runnerHigh.run(action), { index: 1, value: 'akhir' });
});

test('toggle bergantian antar-dua aksi dan statusnya dapat direset', async () => {
  const runner = createActionRunner({
    adapter: { open: (target) => target }
  });
  const action = {
    type: 'toggle',
    id: 'mic-scene',
    actions: [
      { type: 'open', target: 'on' },
      { type: 'open', target: 'off' }
    ]
  };

  assert.deepEqual(await runner.run(action), { index: 0, value: 'on' });
  assert.deepEqual(await runner.run(action), { index: 1, value: 'off' });
  assert.deepEqual(await runner.run(action), { index: 0, value: 'on' });
  assert.equal(runner.resetToggleState('mic-scene'), true);
  assert.deepEqual(await runner.run(action), { index: 0, value: 'on' });
  assert.equal(runner.resetToggleState(), 1);
});

test('toggle dengan ID sama tetap terpisah untuk setiap root pad', async () => {
  const values = [];
  const runner = createActionRunner({
    adapter: {
      open(target) {
        values.push(target);
        return target;
      }
    }
  });
  const action = {
    type: 'toggle',
    id: 'mode',
    actions: [
      { type: 'open', target: 'on' },
      { type: 'open', target: 'off' }
    ]
  };

  await runner.run(action, { metadata: { rootPadId: 'pad-a' } });
  await runner.run(action, { metadata: { rootPadId: 'pad-b' } });
  await runner.run(action, { metadata: { rootPadId: 'pad-a' } });

  assert.deepEqual(values, ['on', 'on', 'off']);
  assert.equal(runner.resetToggleStateForRoot('pad-a'), 1);
  await runner.run(action, { metadata: { rootPadId: 'pad-a' } });
  assert.deepEqual(values, ['on', 'on', 'off', 'on']);
  assert.equal(runner.resetToggleState('mode', 'pad-b'), true);
});

test('toggle tidak berpindah state ketika child gagal', async () => {
  let attempts = 0;
  const runner = createActionRunner({
    adapter: {
      open(target) {
        attempts += 1;
        if (attempts === 1) throw new Error('belum siap');
        return target;
      }
    }
  });
  const action = {
    type: 'toggle',
    id: 'retry-toggle',
    actions: [
      { type: 'open', target: 'on' },
      { type: 'open', target: 'off' }
    ]
  };

  await assert.rejects(runner.run(action), /belum siap/);
  assert.deepEqual(await runner.run(action), { index: 0, value: 'on' });
});

test('sequence bersarang ditolak, termasuk yang disembunyikan di random', () => {
  assert.throws(() => validateAction({
    type: 'sequence',
    actions: [
      {
        type: 'random',
        actions: [
          {
            type: 'sequence',
            actions: [{ type: 'delay', ms: 1 }]
          }
        ]
      }
    ]
  }), (error) => {
    assert.equal(error.name, 'ActionValidationError');
    assert.match(error.message, /tidak boleh berada di dalam sequence/i);
    return true;
  });
});

test('referensi melingkar dan kedalaman berlebih ditolak', () => {
  const circular = { type: 'random', actions: [] };
  circular.actions.push(circular);
  assert.throws(() => validateAction(circular), /referensi melingkar/i);

  let tooDeep = { type: 'delay', ms: 1 };
  for (let index = 0; index < LIMITS.maxActionDepth; index += 1) {
    tooDeep = { type: 'random', actions: [tooDeep] };
  }
  assert.throws(() => validateAction(tooDeep), /kedalaman aksi/i);
});

test('jumlah child, total node, delay, dan teks memiliki batas', () => {
  assert.throws(() => validateAction({
    type: 'random',
    actions: Array.from(
      { length: LIMITS.maxChildren + 1 },
      () => ({ type: 'delay', ms: 0 })
    )
  }), /1-32 actions/i);

  assert.throws(() => validateAction({
    type: 'parallel',
    actions: Array.from(
      { length: LIMITS.maxParallelChildren + 1 },
      () => ({ type: 'delay', ms: 0 })
    )
  }), /parallel dibatasi 8 langkah/i);

  assert.throws(() => validateAction({
    type: 'parallel',
    actions: [{
      type: 'sequence',
      actions: [{
        type: 'parallel',
        actions: [{ type: 'delay', ms: 0 }]
      }]
    }]
  }), /parallel tidak boleh berada di dalam parallel/i);

  assert.throws(() => validateAction({
    type: 'delay',
    ms: LIMITS.maxDelayMs + 1
  }), /delay harus/i);

  assert.throws(() => validateAction({
    type: 'text',
    text: 'x'.repeat(LIMITS.maxTextLength + 1)
  }), /teks terlalu panjang/i);

  const wideTree = {
    type: 'random',
    actions: Array.from({ length: 5 }, () => ({
      type: 'random',
      actions: Array.from(
        { length: LIMITS.maxChildren },
        () => ({ type: 'delay', ms: 0 })
      )
    }))
  };
  assert.throws(() => validateAction(wideTree), /jumlah aksi/i);
});

test('toggle wajib memiliki ID dan tepat dua child', () => {
  assert.throws(() => validateAction({
    type: 'toggle',
    actions: [
      { type: 'delay', ms: 0 },
      { type: 'delay', ms: 0 }
    ]
  }), /memerlukan ID/i);

  assert.throws(() => validateAction({
    type: 'toggle',
    id: 'toggle-1',
    actions: [{ type: 'delay', ms: 0 }]
  }), /tepat dua/i);
});

test('validasi URL menerima web dan URI kustom yang aman', () => {
  assert.equal(normalizeWebsiteUrl('https://example.com/a?q=1'), 'https://example.com/a?q=1');
  assert.equal(
    normalizeWebsiteUrl('obsidian://open?vault=Catatan'),
    'obsidian://open?vault=Catatan'
  );
  assert.equal(normalizeWebsiteUrl('spotify:track:abc'), 'spotify:track:abc');
});

test('validasi URL menolak skema aktif, path lokal, whitespace, dan URL terlalu panjang', () => {
  for (const url of [
    'javascript:alert(1)',
    'data:text/html,test',
    'file:///C:/rahasia.txt',
    'C:\\Windows\\System32\\calc.exe',
    'C:Windows\\System32\\calc.exe',
    'https://exa mple.com',
    'steam:',
    'ms-settings:privacy',
    'custom-handler:run'
  ]) {
    assert.throws(
      () => normalizeWebsiteUrl(url),
      ActionValidationError,
      `seharusnya menolak ${url}`
    );
  }

  assert.throws(
    () => normalizeWebsiteUrl(`https://example.com/${'a'.repeat(LIMITS.maxUrlLength)}`),
    /URL terlalu panjang/i
  );
});

test('hotkey dinormalisasi ketat dan multimedia hanya menerima daftar aman', () => {
  assert.deepEqual(normalizeAutomationHotkey('shift+ctrl+win+F24'), {
    value: 'Ctrl+Shift+Win+F24',
    virtualKeys: [0x11, 0x10, 0x5b, 0x87]
  });
  assert.deepEqual(normalizeAutomationHotkey(['Alt', 'ArrowLeft']), {
    value: 'Alt+Left',
    virtualKeys: [0x12, 0x25]
  });
  assert.equal(normalizeAutomationHotkey('Ctrl+A+B'), null);

  for (const command of [
    'previous',
    'play-pause',
    'next',
    'stop',
    'mute',
    'volume-up',
    'volume-down'
  ]) {
    assert.equal(validateAction({ type: 'multimedia', command }).command, command);
  }
  assert.throws(
    () => validateAction({ type: 'multimedia', command: 'launch-calculator' }),
    /multimedia tidak valid/i
  );
});

test('cancelAll menghentikan delay yang sedang berjalan', async () => {
  const runner = createActionRunner({ adapter: {} });
  const pending = runner.run({ type: 'delay', ms: 5000 });
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(runner.activeRunCount, 1);
  assert.equal(runner.cancelAll(), 1);
  await assert.rejects(pending, (error) => {
    assert.equal(error.name, 'AbortError');
    assert.match(error.message, /dibatalkan/i);
    return true;
  });
  assert.equal(runner.activeRunCount, 0);
  assert.equal(runner.cancelAll(), 0);
});

test('cancelRootPad hanya menghentikan run milik pad yang dipilih', async () => {
  const runner = createActionRunner({ adapter: {} });
  const first = runner.run(
    { type: 'delay', ms: 5000 },
    { metadata: { rootPadId: 'pad-a' } }
  );
  const second = runner.run(
    { type: 'delay', ms: 5 },
    { metadata: { rootPadId: 'pad-b' } }
  );

  assert.equal(runner.cancelRootPad('pad-a'), 1);
  assert.equal(runner.cancelRootPad('pad-tidak-ada'), 0);
  await assert.rejects(first, { name: 'AbortError' });
  assert.equal(await second, 5);
});

test('AbortSignal eksternal menghentikan sequence', async () => {
  const controller = new AbortController();
  const runner = createActionRunner({ adapter: {} });
  const pending = runner.run({
    type: 'sequence',
    actions: [
      { type: 'delay', ms: 5000 },
      { type: 'delay', ms: 1 }
    ]
  }, { signal: controller.signal });
  controller.abort();

  await assert.rejects(pending, { name: 'AbortError' });
});

test('timeout run membatalkan aksi yang terlalu lama', async () => {
  const runner = createActionRunner({
    adapter: {},
    timeoutMs: 15
  });
  await assert.rejects(
    runner.run({ type: 'delay', ms: 5000 }),
    (error) => {
      assert.equal(error.name, 'TimeoutError');
      assert.match(error.message, /batas waktu/i);
      return true;
    }
  );
});

test('handler yang belum tersedia menghasilkan error Bahasa Indonesia', async () => {
  const runner = createActionRunner({ adapter: {} });
  await assert.rejects(
    runner.run({ type: 'open', target: 'notepad.exe' }),
    /handler untuk aksi "open" belum tersedia/i
  );
  await assert.rejects(
    runner.run({ type: 'media', padId: 'pad-1' }),
    /handler untuk aksi "media" belum tersedia/i
  );
});

test('adapter Windows tidak menaruh input open di command line', async () => {
  const calls = [];
  const adapter = createWindowsActionAdapter({
    spawn: createSuccessfulSpawn(calls)
  });
  const injection = 'C:\\Audio\\demo"; Start-Process calc.exe; #.mp3';

  await adapter.open(injection);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].executable, 'powershell.exe');
  assert.equal(calls[0].options.shell, false);
  assert.equal(calls[0].options.windowsHide, true);
  assert.equal(calls[0].args.includes(injection), false);
  assert.equal(calls[0].args.join(' ').includes('Start-Process calc.exe'), false);
  assert.deepEqual(decodeWindowsPayload(calls[0]), {
    operation: 'open',
    target: injection
  });
});

test('adapter Windows menutup hanya path aplikasi yang dipilih', async () => {
  const calls = [];
  const adapter = createWindowsActionAdapter({
    spawn: createSuccessfulSpawn(calls)
  });
  const target = 'C:\\Program Files\\Contoh\\contoh.exe';

  await adapter.close(target, { force: true });

  assert.equal(calls[0].args.includes(target), false);
  assert.deepEqual(decodeWindowsPayload(calls[0]), {
    operation: 'close',
    force: true,
    target
  });
});

test('adapter Windows mengenkode teks berbahaya sebagai data, bukan perintah', async () => {
  const calls = [];
  const adapter = createWindowsActionAdapter({
    spawn: createSuccessfulSpawn(calls)
  });
  const injection = "halo'); Start-Process calc.exe; # {ENTER} + ^ %";

  await adapter.text(injection, { pressEnter: true });

  assert.equal(calls[0].args.join(' ').includes(injection), false);
  assert.deepEqual(decodeWindowsPayload(calls[0]), {
    operation: 'text',
    pressEnter: true,
    sendKeys: escapeSendKeysText(injection)
  });
  assert.match(decodeWindowsPayload(calls[0]).sendKeys, /\{\{\}ENTER\{\}\}/);
});

test('adapter Windows hanya mengirim virtual key hasil whitelist', async () => {
  const calls = [];
  const adapter = createWindowsActionAdapter({
    spawn: createSuccessfulSpawn(calls)
  });

  await adapter.hotkey('Ctrl+Alt+K');
  await adapter.multimedia('volume-up');

  assert.deepEqual(decodeWindowsPayload(calls[0]), {
    operation: 'hotkey',
    virtualKeys: [0x11, 0x12, 0x4b]
  });
  assert.deepEqual(decodeWindowsPayload(calls[1]), {
    operation: 'multimedia',
    virtualKey: 0xaf
  });
  assert.throws(
    () => adapter.hotkey('Ctrl+K; Start-Process calc'),
    /hotkey tidak valid/i
  );

  const script = Buffer
    .from(POWERSHELL_ENCODED_COMMAND, 'base64')
    .toString('utf16le');
  assert.match(script, /SendInput/);
  assert.match(script, /ExtendedKey/);
  assert.doesNotMatch(script, /keybd_event/);
});

test('AbortSignal menghentikan proses PowerShell adapter', async () => {
  let killed = false;
  const adapter = createWindowsActionAdapter({
    spawn() {
      const child = createFakeChild(() => {
        killed = true;
        queueMicrotask(() => child.emit('close', null));
      });
      return child;
    }
  });
  const controller = new AbortController();
  const pending = adapter.open('notepad.exe', { signal: controller.signal });
  controller.abort();

  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(killed, true);
});
