'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const electronPath = require('electron');
const projectRoot = path.resolve(__dirname, '..');
const temporaryData = fs.mkdtempSync(path.join(os.tmpdir(), 'aero-deck-smoke-'));
const marker = 'AERO_DECK_SMOKE_READY';
const output = [];

const child = spawn(
  electronPath,
  [projectRoot, `--user-data-dir=${temporaryData}`, '--hidden'],
  {
    cwd: projectRoot,
    env: {
      ...process.env,
      AERO_DECK_SMOKE_TEST: '1',
      ELECTRON_ENABLE_LOGGING: '1'
    },
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe']
  }
);

function collect(chunk) {
  const text = String(chunk);
  output.push(text);
  process.stdout.write(text);
}

child.stdout.on('data', collect);
child.stderr.on('data', collect);

const timeout = setTimeout(() => {
  child.kill();
}, 25_000);

child.on('error', (error) => {
  clearTimeout(timeout);
  fs.rmSync(temporaryData, { recursive: true, force: true });
  console.error(`Electron tidak dapat dijalankan: ${error.message}`);
  process.exitCode = 1;
});

child.on('exit', (code, signal) => {
  clearTimeout(timeout);
  fs.rmSync(temporaryData, { recursive: true, force: true });
  const combined = output.join('');
  if (code === 0 && combined.includes(marker)) {
    console.log('Smoke test Electron lulus.');
    return;
  }
  console.error(`Smoke test Electron gagal (code=${code}, signal=${signal || 'none'}).`);
  process.exitCode = 1;
});
