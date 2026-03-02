#!/usr/bin/env node
/**
 * pm2me — CLI entry point
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgDir = path.resolve(__dirname, '..');  // root of the package
const backendDir = path.join(pkgDir, 'backend');

const args = process.argv.slice(2);
const SERVICE_NAME = 'pm2me-server';

/**
 * Check if a PM2 process exists by name
 */
function processExists(name) {
    try {
        const output = execSync(`pm2 jlist`, { windowsHide: true }).toString();
        const list = JSON.parse(output);
        return list.some(p => p.name === name);
    } catch (e) {
        return false;
    }
}

// ── Service Commands ──────────────────────────────────────────────────────────
if (args[0] === 'service') {
    const action = args[1];

    if (action === 'install') {
        console.log('[pm2me] Installing background service...');
        try {
            const isWindows = os.platform() === 'win32';
            const appPath = path.join(backendDir, 'app.js');
            const homeDir = path.join(os.homedir(), '.pm2me');
            const dbPath = path.join(homeDir, 'database.json');

            // Clean up existing service if it exists (allows updates)
            if (processExists(SERVICE_NAME)) {
                console.log(`[pm2me] Existing service found. Removing for clean update...`);
                execSync(`pm2 delete ${SERVICE_NAME}`, { stdio: 'inherit', windowsHide: true });
            }

            console.log(`[pm2me] Starting via PM2 as '${SERVICE_NAME}'...`);
            execSync(`pm2 start "${appPath}" --name ${SERVICE_NAME} --env PM2ME_DB_PATH="${dbPath}"`, { stdio: 'inherit', windowsHide: true });

            console.log(`[pm2me] Saving PM2 process list...`);
            execSync(`pm2 save`, { stdio: 'inherit', windowsHide: true });

            if (isWindows) {
                console.log(`\n[pm2me] 💡 Windows Info: Service is now running silently.`);
                console.log(`[pm2me] To make it start automatically on Windows restart:`);
                console.log(`        1. npm install -g pm2-windows-startup`);
                console.log(`        2. pm2-startup install`);
            } else {
                console.log(`[pm2me] Setting up boot startup...`);
                try {
                    execSync(`pm2 startup`, { stdio: 'inherit', windowsHide: true });
                } catch (e) { }
            }
            console.log(`\n[pm2me] Service installed successfully. http://localhost:12345`);
            process.exit(0);
        } catch (err) {
            console.error(`[pm2me] Failed to install service:`, err.message);
            process.exit(1);
        }
    } else if (['start', 'stop', 'restart', 'uninstall'].includes(action)) {
        if (!processExists(SERVICE_NAME)) {
            console.error(`[pm2me] Error: Service '${SERVICE_NAME}' is not installed.`);
            console.log(`[pm2me] Please run 'pm2me service install' first.`);
            process.exit(1);
        }

        console.log(`[pm2me] ${action.charAt(0).toUpperCase() + action.slice(1)}ing service '${SERVICE_NAME}'...`);
        try {
            const cmd = action === 'uninstall' ? 'delete' : action;
            execSync(`pm2 ${cmd} ${SERVICE_NAME}`, { stdio: 'inherit', windowsHide: true });
            if (action === 'uninstall') execSync(`pm2 save`, { stdio: 'inherit', windowsHide: true });
            process.exit(0);
        } catch (err) {
            console.error(`[pm2me] Failed to ${action} service:`, err.message);
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

const homeDir = path.join(os.homedir(), '.pm2me');
const defaultAppsDir = path.join(homeDir, 'apps');
const dbPath = path.join(homeDir, 'database.json');

fs.mkdirSync(defaultAppsDir, { recursive: true });

if (!fs.existsSync(dbPath)) {
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
}

console.log(`[pm2me] Starting server on http://localhost:${PORT}`);
const server = spawn('node', ['app.js'], {
    cwd: backendDir,
    stdio: 'inherit',
    windowsHide: true,
    env: {
        ...process.env,
        PORT: String(PORT),
        PM2ME_DB_PATH: dbPath
    },
});

server.on('close', (code) => {
    process.exit(code ?? 0);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => server.kill(sig));
}
