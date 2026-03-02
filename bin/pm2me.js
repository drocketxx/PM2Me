#!/usr/bin/env node
/**
 * pm2me — CLI entry point
 * Usage: pm2me [--port 12345]
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgDir = path.resolve(__dirname, '..');  // root of the package
const backendDir = path.join(pkgDir, 'backend');

// ── Parse CLI args ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const portArg = args.indexOf('--port');
const PORT = portArg !== -1 ? args[portArg + 1] : (process.env.PORT || 12345);

// ── Ensure .pm2me home directory exists ───────────────────────────────────────
const homeDir = path.join(os.homedir(), '.pm2me');
const defaultAppsDir = path.join(homeDir, 'apps');
const dbPath = path.join(homeDir, 'database.json');

fs.mkdirSync(defaultAppsDir, { recursive: true });

// ── Ensure database.json exists (first run bootstrap) ────────────────────────
if (!fs.existsSync(dbPath)) {
    // Write empty DB — backend will handle setup wizard redirect
    fs.writeFileSync(dbPath, JSON.stringify({
        apps: [],
        settings: {
            webhookSecret: '',
            discordWebhook: '',
            telegramBotToken: '',
            telegramChatId: '',
            appsPath: defaultAppsDir,
        },
        githubAccounts: [],
        webhookLogs: [],
        admin: { passwordHash: '' },
        setupComplete: false,
    }, null, 2));
    console.log('[pm2me] First run — database initialized at', dbPath);
    console.log('[pm2me] Apps directory:', defaultAppsDir);
}

// ── Launch backend server ─────────────────────────────────────────────────────
console.log(`[pm2me] Starting server on http://localhost:${PORT}`);
console.log(`[pm2me] Using database: ${dbPath}`);

const server = spawn('node', ['app.js'], {
    cwd: backendDir,
    stdio: 'inherit',
    env: {
        ...process.env,
        PORT: String(PORT),
        PM2ME_DB_PATH: dbPath
    },
});

server.on('error', (err) => {
    console.error('[pm2me] Failed to start server:', err.message);
    process.exit(1);
});

server.on('close', (code) => {
    process.exit(code ?? 0);
});

// Forward signals
for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => server.kill(sig));
}
