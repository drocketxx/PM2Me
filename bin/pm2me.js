#!/usr/bin/env node
/**
 * pm2me — CLI entry point
 * Usage: 
 *   pm2me                      (Run in foreground)
 *   pm2me service install      (Run in background via PM2 + set boot startup)
 *   pm2me service uninstall    (Remove from PM2 background)
 *   pm2me service start        (Start background service)
 *   pm2me service stop         (Stop background service)
 *   pm2me service restart      (Restart background service)
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
    const SERVICE_NAME = 'pm2me-server';

    if (action === 'install') {
        console.log('[pm2me] Installing background service...');
        try {
            const isWindows = os.platform() === 'win32';
            const appPath = path.join(backendDir, 'app.js');
            const homeDir = path.join(os.homedir(), '.pm2me');
            const dbPath = path.join(homeDir, 'database.json');

            console.log(`[pm2me] Starting via PM2 as '${SERVICE_NAME}'...`);
            execSync(`pm2 start "${appPath}" --name ${SERVICE_NAME} --env PM2ME_DB_PATH="${dbPath}"`, { stdio: 'inherit' });

            console.log(`[pm2me] Saving PM2 process list...`);
            execSync(`pm2 save`, { stdio: 'inherit' });

            if (isWindows) {
                console.log(`\n[pm2me] 💡 Windows Info: '${SERVICE_NAME}' is now running in the background.`);
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
            execSync(`pm2 delete ${SERVICE_NAME}`, { stdio: 'inherit' });
            execSync(`pm2 save`, { stdio: 'inherit' });
            console.log(`[pm2me] Service uninstalled successfully.`);
            process.exit(0);
        } catch (err) {
            console.error(`[pm2me] Failed to uninstall service:`, err.message);
            process.exit(1);
        }
    } else if (action === 'start') {
        console.log(`[pm2me] Starting service '${SERVICE_NAME}'...`);
        try {
            execSync(`pm2 start ${SERVICE_NAME}`, { stdio: 'inherit' });
            process.exit(0);
        } catch (err) {
            console.error(`[pm2me] Failed to start service:`, err.message);
            process.exit(1);
        }
    } else if (action === 'stop') {
        console.log(`[pm2me] Stopping service '${SERVICE_NAME}'...`);
        try {
            execSync(`pm2 stop ${SERVICE_NAME}`, { stdio: 'inherit' });
            process.exit(0);
        } catch (err) {
            console.error(`[pm2me] Failed to stop service:`, err.message);
            process.exit(1);
        }
    } else if (action === 'restart') {
        console.log(`[pm2me] Restarting service '${SERVICE_NAME}'...`);
        try {
            execSync(`pm2 restart ${SERVICE_NAME}`, { stdio: 'inherit' });
            process.exit(0);
        } catch (err) {
            console.error(`[pm2me] Failed to restart service:`, err.message);
            process.exit(1);
        }
    } else {
        console.log(`Usage: pm2me service [install|uninstall|start|stop|restart]`);
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
