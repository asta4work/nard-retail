const { existsSync } = require('node:fs');
const { resolve } = require('node:path');

const envFile = resolve(__dirname, '../.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const host = process.env.BACKEND_PROXY_HOST || '127.0.0.1';
const port = process.env.BACKEND_PORT || process.env.PORT || '3000';
const target = `http://${host}:${port}`;

module.exports = {
  '/api': {
    target,
    secure: false,
    changeOrigin: true,
  },
  '/socket.io': {
    target,
    secure: false,
    ws: true,
    changeOrigin: true,
  },
};
