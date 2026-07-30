'use strict';

const { spawn } = require('node:child_process');

const PAYLOAD_ENV_KEY = 'AERO_DECK_ACTION_PAYLOAD_B64';
const DEFAULT_PROCESS_TIMEOUT_MS = 10_000;
const MAX_PROCESS_TIMEOUT_MS = 30_000;

const MODIFIER_KEYS = new Map([
  ['CTRL', { name: 'Ctrl', virtualKey: 0x11 }],
  ['CONTROL', { name: 'Ctrl', virtualKey: 0x11 }],
  ['ALT', { name: 'Alt', virtualKey: 0x12 }],
  ['OPTION', { name: 'Alt', virtualKey: 0x12 }],
  ['SHIFT', { name: 'Shift', virtualKey: 0x10 }],
  ['WIN', { name: 'Win', virtualKey: 0x5b }],
  ['WINDOWS', { name: 'Win', virtualKey: 0x5b }],
  ['META', { name: 'Win', virtualKey: 0x5b }],
  ['SUPER', { name: 'Win', virtualKey: 0x5b }]
]);

const NAMED_KEYS = new Map([
  ['BACKSPACE', { name: 'Backspace', virtualKey: 0x08 }],
  ['TAB', { name: 'Tab', virtualKey: 0x09 }],
  ['ENTER', { name: 'Enter', virtualKey: 0x0d }],
  ['RETURN', { name: 'Enter', virtualKey: 0x0d }],
  ['PAUSE', { name: 'Pause', virtualKey: 0x13 }],
  ['CAPSLOCK', { name: 'CapsLock', virtualKey: 0x14 }],
  ['ESC', { name: 'Escape', virtualKey: 0x1b }],
  ['ESCAPE', { name: 'Escape', virtualKey: 0x1b }],
  ['SPACE', { name: 'Space', virtualKey: 0x20 }],
  ['SPACEBAR', { name: 'Space', virtualKey: 0x20 }],
  ['PAGEUP', { name: 'PageUp', virtualKey: 0x21 }],
  ['PAGEDOWN', { name: 'PageDown', virtualKey: 0x22 }],
  ['END', { name: 'End', virtualKey: 0x23 }],
  ['HOME', { name: 'Home', virtualKey: 0x24 }],
  ['LEFT', { name: 'Left', virtualKey: 0x25 }],
  ['ARROWLEFT', { name: 'Left', virtualKey: 0x25 }],
  ['UP', { name: 'Up', virtualKey: 0x26 }],
  ['ARROWUP', { name: 'Up', virtualKey: 0x26 }],
  ['RIGHT', { name: 'Right', virtualKey: 0x27 }],
  ['ARROWRIGHT', { name: 'Right', virtualKey: 0x27 }],
  ['DOWN', { name: 'Down', virtualKey: 0x28 }],
  ['ARROWDOWN', { name: 'Down', virtualKey: 0x28 }],
  ['INSERT', { name: 'Insert', virtualKey: 0x2d }],
  ['DELETE', { name: 'Delete', virtualKey: 0x2e }]
]);

const MULTIMEDIA_VIRTUAL_KEYS = Object.freeze({
  previous: 0xb1,
  'play-pause': 0xb3,
  next: 0xb0,
  stop: 0xb2,
  mute: 0xad,
  'volume-up': 0xaf,
  'volume-down': 0xae
});

const MODIFIER_ORDER = ['Ctrl', 'Alt', 'Shift', 'Win'];

const POWERSHELL_SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($env:AERO_DECK_ACTION_PAYLOAD_B64)) {
  throw 'Payload aksi tidak tersedia.'
}

$payloadBytes = [Convert]::FromBase64String($env:AERO_DECK_ACTION_PAYLOAD_B64)
$payloadJson = [Text.Encoding]::UTF8.GetString($payloadBytes)
$payload = $payloadJson | ConvertFrom-Json

if ($payload.operation -eq 'open' -or $payload.operation -eq 'website') {
  Start-Process -FilePath ([string]$payload.target) | Out-Null
  exit 0
}

if ($payload.operation -eq 'close') {
  $requestedPath = [IO.Path]::GetFullPath([string]$payload.target)
  $matches = @(Get-Process | Where-Object {
    try {
      $_.Id -ne $PID -and
        $_.Path -and
        ([IO.Path]::GetFullPath([string]$_.Path) -ieq $requestedPath)
    }
    catch {
      $false
    }
  })

  if ($matches.Count -eq 0) {
    throw 'Aplikasi yang dipilih tidak sedang berjalan.'
  }

  if ([bool]$payload.force) {
    foreach ($process in $matches) {
      Stop-Process -Id $process.Id -Force -ErrorAction Stop
    }
    exit 0
  }

  $windowProcesses = @($matches | Where-Object { $_.MainWindowHandle -ne 0 })
  if ($windowProcesses.Count -eq 0) {
    throw 'Aplikasi tidak memiliki jendela yang dapat ditutup. Aktifkan opsi paksa bila diperlukan.'
  }
  $closedCount = 0
  foreach ($process in $windowProcesses) {
    if ($process.CloseMainWindow()) {
      $closedCount += 1
    }
  }
  if ($closedCount -eq 0) {
    throw 'Windows menolak permintaan untuk menutup aplikasi.'
  }
  exit 0
}

if ($payload.operation -eq 'text') {
  Add-Type -AssemblyName System.Windows.Forms
  [System.Windows.Forms.SendKeys]::SendWait([string]$payload.sendKeys)
  if ([bool]$payload.pressEnter) {
    [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
  }
  exit 0
}

Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;

public static class AeroDeckNativeInput
{
    private const uint InputKeyboard = 1;
    private const uint ExtendedKey = 0x0001;
    private const uint KeyUp = 0x0002;

    [StructLayout(LayoutKind.Sequential)]
    private struct Input
    {
        public uint type;
        public InputUnion data;
    }

    [StructLayout(LayoutKind.Explicit)]
    private struct InputUnion
    {
        [FieldOffset(0)]
        public KeyboardInput keyboard;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct KeyboardInput
    {
        public ushort virtualKey;
        public ushort scanCode;
        public uint flags;
        public uint time;
        public UIntPtr extraInfo;
    }

    [DllImport("user32.dll", SetLastError = true)]
    private static extern uint SendInput(
        uint inputCount,
        Input[] inputs,
        int inputSize
    );

    private static Input CreateKey(byte virtualKey, uint flags)
    {
        Input input = new Input();
        input.type = InputKeyboard;
        input.data.keyboard.virtualKey = virtualKey;
        input.data.keyboard.flags = flags;
        return input;
    }

    private static uint KeyFlags(byte virtualKey, bool keyUp)
    {
        bool extended =
            (virtualKey >= 0x21 && virtualKey <= 0x28) ||
            virtualKey == 0x2D ||
            virtualKey == 0x2E ||
            virtualKey == 0x5B ||
            virtualKey == 0x5C ||
            (virtualKey >= 0xAD && virtualKey <= 0xB3);
        return (extended ? ExtendedKey : 0) | (keyUp ? KeyUp : 0);
    }

    public static void SendHotkey(byte[] virtualKeys)
    {
        if (virtualKeys == null || virtualKeys.Length == 0)
        {
            throw new ArgumentException("Hotkey kosong.");
        }

        Input[] inputs = new Input[virtualKeys.Length * 2];
        for (int index = 0; index < virtualKeys.Length; index++)
        {
            inputs[index] = CreateKey(
                virtualKeys[index],
                KeyFlags(virtualKeys[index], false)
            );
            byte releasedKey = virtualKeys[virtualKeys.Length - index - 1];
            inputs[virtualKeys.Length + index] =
                CreateKey(releasedKey, KeyFlags(releasedKey, true));
        }

        uint sent = SendInput(
            (uint)inputs.Length,
            inputs,
            Marshal.SizeOf(typeof(Input))
        );
        if (sent != (uint)inputs.Length)
        {
            int errorCode = Marshal.GetLastWin32Error();
            Input[] releases = new Input[virtualKeys.Length];
            for (int index = 0; index < virtualKeys.Length; index++)
            {
                byte releasedKey = virtualKeys[virtualKeys.Length - index - 1];
                releases[index] =
                    CreateKey(releasedKey, KeyFlags(releasedKey, true));
            }
            SendInput(
                (uint)releases.Length,
                releases,
                Marshal.SizeOf(typeof(Input))
            );
            throw new Win32Exception(errorCode);
        }
    }

    public static void PressKey(byte virtualKey)
    {
        SendHotkey(new byte[] { virtualKey });
    }
}
'@

if ($payload.operation -eq 'hotkey') {
  [AeroDeckNativeInput]::SendHotkey([byte[]]@($payload.virtualKeys))
  exit 0
}

if ($payload.operation -eq 'multimedia') {
  [AeroDeckNativeInput]::PressKey([byte]$payload.virtualKey)
  exit 0
}

throw 'Operasi Windows tidak dikenali.'
`;

const POWERSHELL_ENCODED_COMMAND = Buffer
  .from(POWERSHELL_SCRIPT, 'utf16le')
  .toString('base64');

function createAbortError(message = 'Aksi dibatalkan.') {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

function cleanAdapterArgument(value, label, maxLength = 4096) {
  const result = String(value ?? '').trim();
  if (!result) {
    throw new Error(`${label} wajib diisi.`);
  }
  if (result.length > maxLength) {
    throw new Error(`${label} terlalu panjang.`);
  }
  if (/[\u0000-\u001f\u007f]/.test(result)) {
    throw new Error(`${label} mengandung karakter yang tidak diizinkan.`);
  }
  return result;
}

function normalizePrimaryKey(value) {
  const raw = String(value ?? '').trim().toUpperCase();
  if (!raw) {
    return null;
  }

  if (/^[A-Z0-9]$/.test(raw)) {
    return {
      name: raw,
      virtualKey: raw.charCodeAt(0)
    };
  }

  const functionKey = /^F([1-9]|1[0-9]|2[0-4])$/.exec(raw);
  if (functionKey) {
    const number = Number(functionKey[1]);
    return {
      name: `F${number}`,
      virtualKey: 0x6f + number
    };
  }

  return NAMED_KEYS.get(raw) ?? null;
}

function normalizeAutomationHotkey(value) {
  const parts = Array.isArray(value)
    ? value.map((part) => String(part).trim()).filter(Boolean)
    : String(value ?? '').split('+').map((part) => part.trim()).filter(Boolean);

  if (parts.length === 0 || parts.length > 5) {
    return null;
  }

  const modifiers = new Map();
  let primaryKey = null;

  for (const part of parts) {
    const modifier = MODIFIER_KEYS.get(part.toUpperCase());
    if (modifier) {
      modifiers.set(modifier.name, modifier);
      continue;
    }

    const key = normalizePrimaryKey(part);
    if (!key || primaryKey) {
      return null;
    }
    primaryKey = key;
  }

  if (!primaryKey) {
    return null;
  }

  const orderedModifiers = MODIFIER_ORDER
    .map((name) => modifiers.get(name))
    .filter(Boolean);

  return {
    value: [...orderedModifiers.map((modifier) => modifier.name), primaryKey.name].join('+'),
    virtualKeys: [...orderedModifiers.map((modifier) => modifier.virtualKey), primaryKey.virtualKey]
  };
}

function escapeSendKeysText(value) {
  const text = String(value ?? '').replace(/\r\n?/g, '\n');
  const specialCharacters = new Set(['+', '^', '%', '~', '(', ')', '[', ']']);
  let result = '';

  for (const character of text) {
    if (character === '\n') {
      result += '{ENTER}';
    } else if (character === '\t') {
      result += '{TAB}';
    } else if (character === '\b') {
      result += '{BACKSPACE}';
    } else if (character === '{') {
      result += '{{}';
    } else if (character === '}') {
      result += '{}}';
    } else if (specialCharacters.has(character)) {
      result += `{${character}}`;
    } else {
      result += character;
    }
  }

  return result;
}

function normalizeProcessTimeout(value) {
  if (value === undefined) {
    return DEFAULT_PROCESS_TIMEOUT_MS;
  }

  const timeout = Number(value);
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > MAX_PROCESS_TIMEOUT_MS) {
    throw new Error(`Timeout PowerShell harus 1-${MAX_PROCESS_TIMEOUT_MS} ms.`);
  }
  return timeout;
}

function runPowerShell(payload, options) {
  const {
    executable,
    spawnImpl,
    timeoutMs,
    signal
  } = options;

  if (signal?.aborted) {
    return Promise.reject(createAbortError());
  }

  const encodedPayload = Buffer
    .from(JSON.stringify(payload), 'utf8')
    .toString('base64');
  const args = [
    '-NoLogo',
    '-NoProfile',
    '-NonInteractive',
    '-Sta',
    '-EncodedCommand',
    POWERSHELL_ENCODED_COMMAND
  ];

  return new Promise((resolve, reject) => {
    let settled = false;
    let stderr = '';
    let child;
    let requestedError = null;
    let terminationTimer;
    let timer;

    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(terminationTimer);
      signal?.removeEventListener('abort', handleAbort);
      if (error) reject(error);
      else resolve();
    };

    const requestTermination = (error) => {
      if (settled || requestedError) return;
      requestedError = error;
      try {
        child?.kill();
      } catch {
        // The close/error events below still determine the final result.
      }
      terminationTimer = setTimeout(() => finish(requestedError), 1_000);
      terminationTimer.unref?.();
    };

    const handleAbort = () => requestTermination(createAbortError());

    try {
      child = spawnImpl(executable, args, {
        env: {
          ...process.env,
          [PAYLOAD_ENV_KEY]: encodedPayload
        },
        shell: false,
        stdio: ['ignore', 'ignore', 'pipe'],
        windowsHide: true
      });
    } catch (error) {
      reject(new Error(`Gagal menjalankan PowerShell: ${error.message}`));
      return;
    }

    timer = setTimeout(() => {
      const error = new Error('Aksi Windows melewati batas waktu.');
      error.name = 'TimeoutError';
      requestTermination(error);
    }, timeoutMs);
    timer.unref?.();

    child.stderr?.setEncoding?.('utf8');
    child.stderr?.on?.('data', (chunk) => {
      if (stderr.length < 2048) {
        stderr += String(chunk).slice(0, 2048 - stderr.length);
      }
    });

    child.once('error', (error) => {
      finish(requestedError || new Error(`Gagal menjalankan PowerShell: ${error.message}`));
    });
    child.once('close', (code) => {
      if (requestedError) {
        finish(requestedError);
        return;
      }
      if (code === 0) {
        finish();
        return;
      }
      const detail = stderr.trim();
      finish(new Error(detail
        ? `Aksi Windows gagal: ${detail}`
        : `Aksi Windows gagal dengan kode ${code}.`));
    });

    signal?.addEventListener('abort', handleAbort, { once: true });
  });
}

function createWindowsActionAdapter(options = {}) {
  const spawnImpl = options.spawn ?? spawn;
  if (typeof spawnImpl !== 'function') {
    throw new TypeError('Adapter Windows memerlukan fungsi spawn.');
  }

  const executable = cleanAdapterArgument(
    options.executable ?? 'powershell.exe',
    'Executable PowerShell',
    260
  );
  const timeoutMs = normalizeProcessTimeout(options.timeoutMs);

  const execute = (payload, context = {}) => runPowerShell(payload, {
    executable,
    signal: context.signal,
    spawnImpl,
    timeoutMs
  });

  return Object.freeze({
    open(target, context) {
      return execute({
        operation: 'open',
        target: cleanAdapterArgument(target, 'Target')
      }, context);
    },

    close(target, context = {}) {
      return execute({
        operation: 'close',
        force: context.force === true,
        target: cleanAdapterArgument(target, 'Target')
      }, context);
    },

    website(url, context) {
      return execute({
        operation: 'website',
        target: cleanAdapterArgument(url, 'URL', 2048)
      }, context);
    },

    hotkey(value, context) {
      const hotkey = normalizeAutomationHotkey(value);
      if (!hotkey) {
        throw new Error('Kombinasi hotkey tidak valid.');
      }
      return execute({
        operation: 'hotkey',
        virtualKeys: hotkey.virtualKeys
      }, context);
    },

    text(value, context = {}) {
      const text = String(value ?? '');
      if (text.length > 4000) {
        throw new Error('Teks terlalu panjang.');
      }
      if (text.includes('\u0000')) {
        throw new Error('Teks mengandung karakter yang tidak diizinkan.');
      }
      return execute({
        operation: 'text',
        pressEnter: context.pressEnter === true,
        sendKeys: escapeSendKeysText(text)
      }, context);
    },

    multimedia(command, context) {
      const normalized = String(command ?? '').trim().toLowerCase();
      const virtualKey = MULTIMEDIA_VIRTUAL_KEYS[normalized];
      if (!virtualKey) {
        throw new Error('Perintah multimedia tidak valid.');
      }
      return execute({
        operation: 'multimedia',
        virtualKey
      }, context);
    }
  });
}

module.exports = {
  MULTIMEDIA_VIRTUAL_KEYS,
  PAYLOAD_ENV_KEY,
  POWERSHELL_ENCODED_COMMAND,
  createWindowsActionAdapter,
  escapeSendKeysText,
  normalizeAutomationHotkey
};
