#!/usr/bin/env node
/**
 * pm2me — CLI entry point
 * Usage: 
 *   pm2me                      (Run in foreground)
 *   pm2me service install      (Run in background via PM2 + set boot startup)
 *   pm2me service uninstall    (Remove from PM2 background)
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgDir = path.resolve(__dirname, '..');  // root of the package
const backendDir = path.join(pkgDir, 'backend');

// ── Parse CLI args ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

// ── Handle Service Commands ───────────────────────────────────────────────────
if (args[0] === 'service') {
    const action = args[1];
    if (action === 'install') {
        console.log('[pm2me] Installing background service...');
        try {
            const isWindows = os.platform() === 'win32';
            const appPath = path.join(backendDir, 'app.js');
            const homeDir = path.join(os.homedir(), '.pm2me');
            const dbPath = path.join(homeDir, 'database.json');

            console.log(`[pm2me] Starting via PM2 as 'pm2me-server'...`);
            execSync(`pm2 start "${appPath}" --name pm2me-server --env PM2ME_DB_PATH="${dbPath}"`, { stdio: 'inherit' });

            console.log(`[pm2me] Saving PM2 process list...`);
            execSync(`pm2 save`, { stdio: 'inherit' });

            if (isWindows) {
                console.log(`\n[pm2me] 💡 Windows Info: 'pm2me-server' is now running in the background.`);
                console.log(`[pm2me] To make it start automatically on Windows restart, we recommend using 'pm2-windows-startup':`);
                console.log(`        npm install -g pm2-windows-startup`);
                console.log(`        pm2-startup install`);
            } else {
                console.log(`[pm2me] Setting up boot startup...`);
                try {
                    execSync(`pm2 startup`, { stdio: 'inherit' });
                    console.log(`[pm2me] Done! If you see a command above, please copy and run it to finalize startup.`);
                } catch (e) {
                    console.log(`[pm2me] 'pm2 startup' might need manual execution. Check instructions above.`);
                }
            }

            console.log(`\n[pm2me] Service installed successfully. Access your UI at http://localhost:12345`);
            process.exit(0);
        } catch (err) {
            console.error(`[pm2me] Failed to install service:`, err.message);
            process.exit(1);
        }
    } else if (action === 'uninstall') {
        console.log('[pm2me] Uninstalling background service...');
        try {
            execSync(`pm2 delete pm2me-server`, { stdio: 'inherit' });
            execSync(`pm2 save`, { stdio: 'inherit' });
            console.log(`[pm2me] Service uninstalled successfully.`);
            process.exit(0);
        } catch (err) {
            console.error(`[pm2me] Failed to uninstall service:`, err.message);
            process.exit(1);
        }
    } else {
        console.log(`Usage: pm2me service [install|uninstall]`);
        process.exit(1);
    }
}

// ── Standard Foreground Execution ─────────────────────────────────────────────
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
