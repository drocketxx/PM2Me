import express from 'express';
import db from '../db/index.js';
import * as pm2Service from '../services/pm2Service.js';
import * as gitService from '../services/gitService.js';
import * as notificationService from '../services/notificationService.js';
import * as systemService from '../services/systemService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import { exec } from 'child_process';
import util from 'util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspacesDir = path.resolve(__dirname, '../../apps');

const router = express.Router();

// GET all PM2 apps
router.get('/pm2/list', async (req, res) => {
    try {
        await pm2Service.connectPM2();
        const list = await pm2Service.listApps();
        res.json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET system stats
router.get('/system/stats', async (req, res) => {
    try {
        const stats = await systemService.getSystemStats();
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET PM2 version and update check
const execAsync = util.promisify(exec);
router.get('/pm2/version-check', async (req, res) => {
    try {
        // Check globally installed PM2 version via npm (avoids local node_modules/.bin/pm2)
        let installedVersion = null;
        try {
            const { stdout } = await execAsync('npm list -g pm2 --depth=0 --json');
            const parsed = JSON.parse(stdout);
            installedVersion = parsed?.dependencies?.pm2?.version || null;
        } catch {
            // not installed globally
        }

        if (!installedVersion) {
            return res.json({ installed: false });
        }

        // Get latest version from npm registry
        let latestVersion = null;
        try {
            const { stdout } = await execAsync('npm view pm2 version');
            latestVersion = stdout.trim();
        } catch {
            latestVersion = null;
        }

        const hasUpdate = latestVersion && installedVersion !== latestVersion &&
            latestVersion.localeCompare(installedVersion, undefined, { numeric: true, sensitivity: 'base' }) > 0;

        res.json({ installed: true, version: installedVersion, latestVersion, hasUpdate });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST PM2 install or update
router.post('/pm2/install-update', async (req, res) => {
    try {
        res.writeHead(200, { 'Content-Type': 'text/plain', 'Transfer-Encoding': 'chunked' });
        const child = exec('npm install -g pm2@latest');
        child.stdout.on('data', (d) => res.write(d));
        child.stderr.on('data', (d) => res.write(d));
        child.on('close', (code) => {
            res.write(code === 0 ? '\n✅ Done!' : '\n❌ Failed.');
            res.end();
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PM2 Action: start, stop, restart, delete
router.post('/pm2/:action', async (req, res) => {
    const { action } = req.params;
    const { nameOrId } = req.body;
    try {
        await pm2Service.connectPM2();
        let result;
        if (action === 'start') result = await pm2Service.startApp(nameOrId);
        else if (action === 'stop') result = await pm2Service.stopApp(nameOrId);
        else if (action === 'restart') result = await pm2Service.restartApp(nameOrId);
        else if (action === 'reload') result = await pm2Service.reloadApp(nameOrId);
        else if (action === 'delete') result = await pm2Service.deleteApp(nameOrId);

        // Find app by name to emit system log
        const app = db.data.apps.find(a => a.name === nameOrId);
        if (app && req.io) {
            const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);
            req.io.emit(`deploy-log-${app.id}`, `[pm2me] ${actionLabel}`);
        }

        res.json({ success: true, result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// App Config CRUD (LowDB)
router.get('/apps', (req, res) => {
    res.json(db.data.apps);
});

router.post('/apps', async (req, res) => {
    const newApp = { id: Date.now().toString(), ...req.body, status: 'created' };
    db.data.apps.push(newApp);
    await db.write();
    res.json(newApp);
});

router.delete('/apps/:id', async (req, res) => {
    const { id } = req.params;
    db.data.apps = db.data.apps.filter(app => app.id !== id);
    await db.write();
    res.json({ success: true });
});

router.get('/apps/:id/sync-status', async (req, res) => {
    const { id } = req.params;
    const appConfig = db.data.apps.find(a => a.id === id);
    if (!appConfig) return res.status(404).json({ error: 'App not found' });

    const targetPath = path.join(workspacesDir, appConfig.name);
    try {
        const behindCount = await gitService.getBehindCount(appConfig.repoUrl, targetPath, appConfig.branch, appConfig.token);
        res.json({ behindCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/apps/:id', async (req, res) => {
    const { id } = req.params;
    const index = db.data.apps.findIndex(app => app.id === id);
    if (index === -1) return res.status(404).json({ error: 'App not found' });

    // Merge new config, but preserve id and status
    db.data.apps[index] = {
        ...db.data.apps[index],
        ...req.body,
        id: db.data.apps[index].id,
        status: db.data.apps[index].status
    };
    await db.write();
    res.json(db.data.apps[index]);
});

// Get Git branches
router.post('/git/branches', async (req, res) => {
    const { repoUrl, token } = req.body;
    try {
        const branches = await gitService.getBranches(repoUrl, token);
        res.json(branches);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify and Add git token
router.post('/git/accounts', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, error: 'No token provided' });
    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`,
                'User-Agent': 'PM2Me-App'
            }
        });
        if (response.ok) {
            const data = await response.json();
            // Check if already added
            if (!db.data.githubAccounts) db.data.githubAccounts = [];
            const exists = db.data.githubAccounts.find(a => a.username === data.login);
            if (exists) return res.status(400).json({ success: false, error: 'Account already connected' });

            const newAccount = {
                id: data.id.toString(),
                username: data.login,
                avatarUrl: data.avatar_url,
                token: token
            };
            db.data.githubAccounts.push(newAccount);
            await db.write();

            res.json({ success: true, account: newAccount });
        } else {
            res.status(401).json({ success: false, error: 'Invalid token' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove a github account
router.delete('/git/accounts/:id', async (req, res) => {
    const { id } = req.params;
    if (db.data.githubAccounts) {
        db.data.githubAccounts = db.data.githubAccounts.filter(a => a.id !== id);
        await db.write();
    }
    res.json({ success: true });
});

// Get all connected accounts
router.get('/git/accounts', (req, res) => {
    res.json(db.data.githubAccounts || []);
});

// Fetch all repositories from connected accounts
router.get('/git/repositories', async (req, res) => {
    const accounts = db.data.githubAccounts || [];
    const groupedRepos = [];

    try {
        for (const account of accounts) {
            const response = await fetch(`https://api.github.com/user/repos?per_page=100&sort=updated`, {
                headers: {
                    'Authorization': `token ${account.token}`,
                    'User-Agent': 'PM2Me-App'
                }
            });
            if (response.ok) {
                const repos = await response.json();
                const mappedRepos = repos.map(r => ({
                    id: r.id,
                    name: r.name,
                    fullName: r.full_name,
                    cloneUrl: r.clone_url,
                    private: r.private
                }));
                groupedRepos.push({
                    account: account.username,
                    accountId: account.id,
                    token: account.token,
                    avatarUrl: account.avatarUrl,
                    repositories: mappedRepos
                });
            }
        }
        res.json(groupedRepos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const rollback = async (appId, appConfig, io, targetPath, lastStep, logProcess, setPipelineState, logFilePath) => {
    if (!appConfig.lastSuccessfulCommitHash || appConfig.lastSuccessfulCommitHash === appConfig.commitHash) {
        logProcess('No stable version to rollback to or already on last good version.', true);
        return false;
    }

    logProcess(`Initiating Auto-Rollback to last successful commit: ${appConfig.lastSuccessfulCommitHash}`, true);
    try {
        const failedHash = appConfig.commitHash;
        const failedMsg = appConfig.commitMessage;

        // 1. Checkout last good commit
        const restored = await gitService.checkout(targetPath, appConfig.lastSuccessfulCommitHash);

        // 2. Restore successful configuration
        appConfig.pm2Script = appConfig.lastSuccessfulPm2Script;
        appConfig.env = JSON.parse(JSON.stringify(appConfig.lastSuccessfulEnv || {}));

        // 3. Re-setup environment files
        const envFileData = Object.entries(appConfig.env || {})
            .map(([k, v]) => `${k}=${v}`)
            .join('\n');
        fs.writeFileSync(path.join(targetPath, '.env'), envFileData);

        // 4. Re-run Build if necessary
        if (appConfig.buildScript) {
            logProcess('Re-building original working version...', true);
            const normalizedScript = appConfig.buildScript.split('\n')
                .map(s => s.trim())
                .filter(Boolean)
                .join(' && ');
            await new Promise((resolve, reject) => {
                const child = exec(normalizedScript, { cwd: targetPath, maxBuffer: 10 * 1024 * 1024 });
                child.stdout.on('data', data => { io.emit(`deploy-log-${appId}`, data.toString()); fs.appendFileSync(logFilePath, data); });
                child.stderr.on('data', data => { io.emit(`deploy-log-${appId}`, data.toString()); fs.appendFileSync(logFilePath, data); });
                child.on('close', code => code !== 0 ? reject(new Error('Rollback build failed')) : resolve());
            });
        }

        // 5. Restart PM2 with original version
        logProcess('Restarting PM2 with original version...', true);
        await pm2Service.connectPM2();
        const startOpts = {
            name: appConfig.name,
            cwd: targetPath,
            script: appConfig.pm2Script || 'npm',
            updateEnv: true,
            env: appConfig.env || {}
        };

        try {
            await pm2Service.reloadApp(appConfig.name, startOpts);
        } catch (e) {
            try { await pm2Service.deleteApp(appConfig.name); } catch (d) { }
            await pm2Service.startApp(startOpts);
        }

        // 6. Update DB to reflect rollback state
        appConfig.commitHash = restored.hash;
        appConfig.commitMessage = restored.message;
        appConfig.rollbackOccurred = true;
        appConfig.failedCommitHash = failedHash;
        appConfig.failedCommitMessage = failedMsg;
        appConfig.status = 'running';
        await setPipelineState(`failed:${lastStep}`);

        logProcess(`Rollback successful. System is running on commit: ${restored.message}`, true);
        await db.write();
        return true;
    } catch (rollbackErr) {
        const rbErrorMsg = rollbackErr.message || util.inspect(rollbackErr);
        logProcess(`Critical: Rollback failed: ${rbErrorMsg}`, true);
        return false;
    }
};

// Helper to normalize Git repo URLs for comparison
const normalizeRepoUrl = (url) => {
    if (!url) return '';
    return url.replace(/\.git$/, '').replace(/\/$/, '').toLowerCase();
};

export const performDeployment = async (appId, io) => {
    const appConfig = db.data.apps.find(a => a.id === appId);
    if (!appConfig) throw new Error('App not found');

    const targetPath = path.join(workspacesDir, appConfig.name);
    const logFilePath = path.join(workspacesDir, `${appConfig.name}_deploy.log`);
    let lastStep = 'pulling';

    if (!fs.existsSync(workspacesDir)) {
        fs.mkdirSync(workspacesDir, { recursive: true });
    }

    fs.writeFileSync(logFilePath, `--- Deployment Started at ${new Date().toISOString()} ---\n`);

    const logProcess = (msg, isSystem = false) => {
        const formattedMsg = isSystem ? `[pm2me] ${msg}` : msg;
        console.log(`[Deploy ${appConfig.name}]`, formattedMsg);
        io.emit(`deploy-log-${appId}`, formattedMsg + '\n');
        fs.appendFileSync(logFilePath, formattedMsg + '\n');
    };

    const setPipelineState = async (state) => {
        appConfig.pipelineState = state;
        await db.write();
        io.emit(`pipeline-state-${appId}`, state);
        console.log(`[Pipeline ${appConfig.name}]`, state);
    };

    try {
        appConfig.status = 'deploying';
        await db.write();
        logProcess('Sync', true);

        lastStep = 'pulling';
        await setPipelineState('pulling');
        logProcess('Synchronizing Repository', true);
        const { message: syncMsg, commitHash, commitMessage } = await gitService.syncRepo(appConfig.repoUrl, targetPath, appConfig.branch, appConfig.token);
        appConfig.commitHash = commitHash;
        appConfig.commitMessage = commitMessage;
        logProcess(`Git: ${syncMsg} on branch ${appConfig.branch} (Commit: ${commitMessage})`);

        logProcess('Setting up env', true);
        const envFileData = Object.entries(appConfig.env || {})
            .map(([k, v]) => `${k}=${v}`)
            .join('\n');
        fs.writeFileSync(path.join(targetPath, '.env'), envFileData);

        if (appConfig.buildScript) {
            const normalizedScript = appConfig.buildScript.split('\n')
                .map(s => s.trim())
                .filter(Boolean)
                .join(' && ');

            lastStep = 'building';
            await setPipelineState('building');
            logProcess('Executing Build Script', true);
            await new Promise((resolve, reject) => {
                const child = exec(normalizedScript, { cwd: targetPath, maxBuffer: 10 * 1024 * 1024 });
                child.stdout.on('data', data => { io.emit(`deploy-log-${appId}`, data.toString()); fs.appendFileSync(logFilePath, data); });
                child.stderr.on('data', data => { io.emit(`deploy-log-${appId}`, data.toString()); fs.appendFileSync(logFilePath, data); });
                child.on('close', code => {
                    if (code !== 0) reject(new Error(`Build script exited with code ${code}`));
                    else { logProcess('Build Script Completed', true); resolve(); }
                });
                child.on('error', err => { reject(err); });
            });
        }

        lastStep = 'starting';
        await setPipelineState('starting');
        logProcess('Starting PM2', true);
        await pm2Service.connectPM2();

        let pmArgs = ['start'];
        if (appConfig.pm2Args) pmArgs = appConfig.pm2Args.split(' ').filter(Boolean);

        let startOptions = {
            name: appConfig.name,
            cwd: targetPath,
            script: appConfig.pm2Script || 'npm',
            args: appConfig.pm2Script === 'npm' ? pmArgs : [],
            env: appConfig.env || {}
        };

        if (appConfig.ecosystemFile) startOptions = path.join(targetPath, appConfig.ecosystemFile);

        logProcess('Updating Application in PM2', true);
        let exists = null;
        try {
            const list = await pm2Service.listApps();
            exists = list.find(a => a.name === appConfig.name);
            if (exists) {
                const updateOptions = { ...startOptions, updateEnv: true };
                if (appConfig.zeroDowntime !== false) {
                    logProcess('Zero-downtime Reloading with new environment', true);
                    await pm2Service.reloadApp(appConfig.name, updateOptions);
                } else {
                    logProcess('Restarting (Non Zero-downtime) with new environment', true);
                    await pm2Service.restartApp(appConfig.name, updateOptions);
                }
            } else {
                logProcess('Fresh Starting', true);
                await pm2Service.startApp(startOptions);
            }
        } catch (e) {
            const errorMsg = e.message || util.inspect(e);
            logProcess(`Action failed: ${errorMsg}. Falling back to clean start...`, true);
            try { await pm2Service.deleteApp(appConfig.name); } catch (delErr) { }
            await pm2Service.startApp(startOptions);
        }

        appConfig.status = 'running';
        await setPipelineState('online');

        // Stabilization checks
        const stabilizationTime = 10000; // 10 seconds

        // Capture initial restarts AFTER the reload/restart, so we have a clean baseline
        const freshList = await pm2Service.listApps();
        const freshApp = freshList.find(a => a.name === appConfig.name);
        const initialRestarts = freshApp ? (freshApp.pm2_env ? freshApp.pm2_env.restart_time : 0) : 0;

        logProcess(`Stabilization started. Verifying health for ${stabilizationTime / 1000}s...`, true);

        // Finalize success after X seconds
        setTimeout(async () => {
            try {
                // Re-find in case db memory changed or reloaded
                const currentApp = db.data.apps.find(a => a.id === appId);
                if (!currentApp) return;

                await pm2Service.connectPM2();
                const list = await pm2Service.listApps();
                const pmApp = list.find(a => a.name === currentApp.name);

                if (pmApp) {
                    const status = pmApp.pm2_env.status;
                    const restarts = pmApp.pm2_env.restart_time;

                    if (status === 'online' && restarts === initialRestarts) {
                        // Success! Update markers
                        currentApp.lastSuccessfulCommitHash = currentApp.commitHash;
                        currentApp.lastSuccessfulCommitMessage = currentApp.commitMessage;
                        currentApp.lastSuccessfulPm2Script = currentApp.pm2Script;
                        currentApp.lastSuccessfulEnv = JSON.parse(JSON.stringify(currentApp.env || {}));
                        currentApp.rollbackOccurred = false;
                        currentApp.failedCommitHash = null;
                        currentApp.failedCommitMessage = null;
                        await db.write();
                        logProcess('Stabilization complete. Commit marked as successful.', true);
                    } else {
                        logProcess(`App unhealthy after ${stabilizationTime / 1000}s (Status: ${status}, Restarts: ${restarts} vs ${initialRestarts}). Rolling back...`, true);
                        await rollback(appId, currentApp, io, targetPath, 'online', logProcess, setPipelineState, logFilePath);
                    }
                }
            } catch (err) {
                console.error(`Health check failed for ${appConfig.name}:`, err);
            }
        }, stabilizationTime);

        logProcess('Deployment Online (Health period active)', true);
        await db.write();
        await notificationService.notifyAll(appConfig.name, 'success');
    } catch (err) {
        const errorMsg = err.message || util.inspect(err);
        logProcess(`Deployment failed: ${errorMsg}`, true);

        // Auto-Rollback Logic
        if (lastStep === 'building' || lastStep === 'starting') {
            const rolledBack = await rollback(appId, appConfig, io, targetPath, lastStep, logProcess, setPipelineState, logFilePath);
            if (rolledBack) return;
        }

        appConfig.status = 'failed';
        await setPipelineState(`failed:${lastStep}`);
        await db.write();
        await notificationService.notifyAll(appConfig.name, 'failed', errorMsg);
        throw err;
    }
};

// Build and Deploy an App
router.post('/deploy/:appId', async (req, res) => {
    try {
        await performDeployment(req.params.appId, req.io);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Deploy Logs for an App
router.get('/deploy/:appId/logs', async (req, res) => {
    const { appId } = req.params;
    const appConfig = db.data.apps.find(a => a.id === appId);
    if (!appConfig) return res.status(404).json({ error: 'App not found' });

    const logFilePath = path.join(workspacesDir, `${appConfig.name}_deploy.log`);
    let logs = '';

    if (fs.existsSync(logFilePath)) {
        logs += fs.readFileSync(logFilePath, 'utf8');
    }

    try {
        await pm2Service.connectPM2();
        const list = await pm2Service.listApps();
        const pmApp = list.find(app => app.name === appConfig.name);
        if (pmApp && pmApp.pm2_env) {
            const outPath = pmApp.pm2_env.pm_out_log_path;
            const errPath = pmApp.pm2_env.pm_err_log_path;

            const readTailLines = (filePath, prefix = '', maxLines = 100) => {
                if (!filePath || !fs.existsSync(filePath)) return '';
                const stats = fs.statSync(filePath);
                const size = stats.size;
                const maxBytes = 50000;
                const start = Math.max(0, size - maxBytes);
                const buffer = Buffer.alloc(Math.max(0, size - start));
                if (buffer.length === 0) return '';
                const fd = fs.openSync(filePath, 'r');
                fs.readSync(fd, buffer, 0, buffer.length, start);
                fs.closeSync(fd);
                const text = buffer.toString('utf8');
                const lines = text.split('\n').filter(l => l.trim());
                return lines.slice(-maxLines).map(line => `${prefix} | ${line}`).join('\n');
            };

            const outLogs = readTailLines(outPath, `[out]`);
            const errLogs = readTailLines(errPath, `[err]`);

            if (outLogs || errLogs) {
                logs += '\n\n--- 🔵 PM2 Execution Logs ---\n';
                if (errLogs) logs += errLogs + '\n';
                if (outLogs) logs += outLogs + '\n';
            }
        }
    } catch (err) {
        console.error('Failed to fetch PM2 logs', err);
    }

    res.send(logs);
});

// GitHub Webhook Receiver
router.post('/webhook', async (req, res) => {
    const payload = req.body;
    const signature = req.headers['x-hub-signature-256'];
    const deliveryId = req.headers['x-github-delivery'];
    const eventType = req.headers['x-github-event'] || 'unknown';
    const { webhookSecret } = db.data.settings;

    const logEntry = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        timestamp: new Date().toISOString(),
        eventType,
        deliveryId,
        repository: payload.repository?.full_name || 'unknown',
        status: 'pending',
        details: ''
    };

    const addLog = async (entry) => {
        if (!db.data.webhookLogs) db.data.webhookLogs = [];
        db.data.webhookLogs.unshift(entry);
        if (db.data.webhookLogs.length > 50) {
            db.data.webhookLogs = db.data.webhookLogs.slice(0, 50);
        }
        await db.write();
        if (req.io) {
            req.io.emit('webhook-log', entry);
        }
    };

    // Signature verification using captured raw body
    if (webhookSecret && signature && req.rawBody) {
        try {
            const hmac = crypto.createHmac('sha256', webhookSecret);
            const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');
            if (signature !== digest) {
                logEntry.status = 'error';
                logEntry.details = 'Signature mismatch';
                await addLog(logEntry);
                return res.status(401).send('Signature mismatch');
            }
        } catch (e) {
            console.error('Webhook verification error:', e);
            logEntry.status = 'error';
            logEntry.details = `Verification failed: ${e.message}`;
            await addLog(logEntry);
            return res.status(500).send('Internal Error during verification');
        }
    }

    if (eventType === 'push') {
        const repoUrl = normalizeRepoUrl(payload.repository?.clone_url);
        const branch = payload.ref?.replace('refs/heads/', '');

        const appsToDeploy = db.data.apps.filter(a =>
            normalizeRepoUrl(a.repoUrl) === repoUrl &&
            a.branch === branch &&
            a.autoSync === true
        );

        if (appsToDeploy.length === 0) {
            logEntry.status = 'ignored';
            logEntry.details = `No matching apps for repo: ${repoUrl}, branch: ${branch}`;
            await addLog(logEntry);
            return res.status(200).send('No matching apps');
        }

        logEntry.status = 'success';
        logEntry.details = `Triggered deployment for ${appsToDeploy.length} apps: ${appsToDeploy.map(a => a.name).join(', ')}`;
        await addLog(logEntry);

        res.status(202).send('Accepted');

        for (const app of appsToDeploy) {
            try {
                await notificationService.notifyAll(app.name, 'Push event received, triggering auto-sync...');
                // Trigger deployment directly
                performDeployment(app.id, req.io).catch(err => {
                    console.error(`Auto-Sync failed for ${app.name}:`, err);
                });
            } catch (e) {
                console.error(e);
            }
        }
    } else if (eventType === 'ping') {
        logEntry.status = 'success';
        logEntry.details = 'Webhook ping received and verified';
        await addLog(logEntry);
        res.status(200).send('PONG');
    } else {
        logEntry.status = 'ignored';
        logEntry.details = `Event type ${eventType} not processed`;
        await addLog(logEntry);
        res.status(200).send('Event not processed');
    }
});

// Settings endpoints
router.get('/settings', (req, res) => {
    res.json(db.data.settings);
});

router.post('/settings', async (req, res) => {
    db.data.settings = { ...db.data.settings, ...req.body };
    await db.write();
    res.json({ success: true });
});

router.get('/settings/webhook-logs', (req, res) => {
    res.json(db.data.webhookLogs || []);
});

// ─── Nginx Management ────────────────────────────────────────────────────────
import os from 'os';

const isWindows = os.platform() === 'win32';
const NGINX_CONF = isWindows ? 'C:\\nginx\\conf\\nginx.conf' : '/etc/nginx/nginx.conf';
const NGINX_CONF_DIR = isWindows ? 'C:\\nginx\\conf' : '/etc/nginx';
const NGINX_BIN = isWindows ? 'C:\\nginx\\nginx.exe' : 'nginx';

// GET nginx info (os, paths, status)
router.get('/nginx/info', async (req, res) => {
    try {
        const info = {
            os: isWindows ? 'windows' : 'linux',
            confFile: NGINX_CONF,
            confDir: NGINX_CONF_DIR,
            nginxBin: NGINX_BIN,
        };

        // Check if nginx binary exists / is installed
        try {
            const checkCmd = isWindows
                ? `"${NGINX_BIN}" -v`
                : 'nginx -v';
            const { stderr } = await execAsync(checkCmd);
            const match = (stderr || '').match(/nginx\/([\\d.]+)/);
            info.version = match ? match[1] : 'unknown';
            info.installed = true;
        } catch {
            info.installed = false;
        }

        res.json(info);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET nginx status (running or not)
router.get('/nginx/status', async (req, res) => {
    try {
        let running = false;
        try {
            if (isWindows) {
                const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq nginx.exe" /NH');
                running = stdout.toLowerCase().includes('nginx.exe');
            } else {
                const { stdout } = await execAsync('pgrep -x nginx');
                running = stdout.trim().length > 0;
            }
        } catch {
            running = false;
        }
        res.json({ running });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET nginx config file content
router.get('/nginx/config', async (req, res) => {
    try {
        const filePath = req.query.file || NGINX_CONF;
        if (!fs.existsSync(filePath)) {
            return res.json({ content: '', exists: false, path: filePath });
        }
        const content = fs.readFileSync(filePath, 'utf8');
        res.json({ content, exists: true, path: filePath });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST save nginx config file
router.post('/nginx/config', async (req, res) => {
    try {
        const { content, file } = req.body;
        const filePath = file || NGINX_CONF;
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, content, 'utf8');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST nginx action: test | start | reload | stop | quit
router.post('/nginx/action', async (req, res) => {
    const { action } = req.body;
    const validActions = ['test', 'start', 'reload', 'stop', 'quit'];
    if (!validActions.includes(action)) {
        return res.status(400).json({ error: 'Invalid action' });
    }

    try {
        let cmd;
        if (isWindows) {
            const bin = `"${NGINX_BIN}"`;
            const cmdMap = {
                test: `${bin} -t -c "${NGINX_CONF}"`,
                start: `Start-Process -FilePath "${NGINX_BIN}" -WorkingDirectory "C:\\nginx" -WindowStyle Hidden`,
                reload: `${bin} -s reload`,
                stop: `${bin} -s stop`,
                quit: `${bin} -s quit`,
            };
            cmd = action === 'start'
                ? `powershell -Command "${cmdMap.start}"`
                : cmdMap[action];
        } else {
            const cmdMap = {
                test: `sudo nginx -t`,
                start: `sudo nginx`,
                reload: `sudo nginx -s reload`,
                stop: `sudo nginx -s stop`,
                quit: `sudo nginx -s quit`,
            };
            cmd = cmdMap[action];
        }

        const { stdout, stderr } = await execAsync(cmd).catch(err => ({
            stdout: err.stdout || '',
            stderr: err.stderr || err.message,
        }));

        const output = [stdout, stderr].filter(Boolean).join('\n').trim();
        const success = !output.toLowerCase().includes('failed') && !output.toLowerCase().includes('error:');
        res.json({ success, output });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
