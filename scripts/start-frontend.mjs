import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const envFile = join(root, '.env');

if (existsSync(envFile)) process.loadEnvFile(envFile);

const host = process.env.FRONTEND_HOST || '0.0.0.0';
const port = Number(process.env.FRONTEND_PORT || 4200);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid FRONTEND_PORT: ${process.env.FRONTEND_PORT}`);
}

const angularCli = join(root, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
const child = spawn(process.execPath, [angularCli, 'serve', '--host', host, '--port', String(port)], {
  cwd: join(root, 'frontend'),
  env: process.env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
