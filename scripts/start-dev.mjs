import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const envFile = join(root, '.env');

if (existsSync(envFile)) process.loadEnvFile(envFile);

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const detached = process.platform !== 'win32';
const processes = [
  spawn(npm, ['run', 'start:backend'], { cwd: root, detached, env: process.env, stdio: 'inherit' }),
  spawn(npm, ['run', 'start:frontend'], { cwd: root, detached, env: process.env, stdio: 'inherit' }),
];

let stopping = false;

function stop(signal = 'SIGTERM') {
  if (stopping) return;
  stopping = true;
  for (const child of processes) {
    if (child.killed || child.pid === undefined || child.exitCode !== null || child.signalCode !== null) continue;
    try {
      if (detached) process.kill(-child.pid, signal);
      else child.kill(signal);
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
  }
}

for (const child of processes) {
  child.on('error', (error) => {
    console.error(error);
    stop();
    process.exitCode = 1;
  });
  child.on('exit', (code, signal) => {
    if (stopping) return;
    stop();
    if (signal) process.kill(process.pid, signal);
    process.exitCode = code ?? 1;
  });
}

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
