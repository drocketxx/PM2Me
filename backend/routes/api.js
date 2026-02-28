import express from 'express';
import db from '../db/index.js';
import * as pm2Service from '../services/pm2Service.js';
import * as gitService from '../services/gitService.js';
import * as notificationService from '../services/notificationService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import { exec } from 'child_process';

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

// PM2 Action: start, stop, restart, delete
router.post('/pm2/:action', async (req, res) => {
    const { action } = req.params;
    const { nameOrId } = req.body;
    try {
        await pm2Service.connectPM2();
        let result;
        if (action === 'stop') result = await pm2Service.stopApp(nameOrId);
        else if (action === 'restart') result = await pm2Service.restartApp(nameOrId);
        else if (action === 'delete') result = await pm2Service.deleteApp(nameOrId);
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

// Build and Deploy an App
router.post('/deploy/:appId', async (req, res) => {
    const { appId } = req.params;
    const appConfig = db.data.apps.find(a => a.id === appId);
    if (!appConfig) return res.status(404).json({ error: 'App not found' });

    const targetPath = path.join(workspacesDir, appConfig.name);
    const io = req.io;

    const logFilePath = path.join(workspacesDir, `${appConfig.name}_deploy.log`);

    // Ensure workspaces dir exists before writing
    if (!fs.existsSync(workspacesDir)) {
        fs.mkdirSync(workspacesDir, { recursive: true });
    }

    // Clear previous log file on new deployment
    fs.writeFileSync(logFilePath, `--- Deployment Started at ${new Date().toISOString()} ---\n`);

    const logProcess = (msg) => {
        console.log(`[Deploy ${appConfig.name}]`, msg);
        io.emit(`deploy-log-${appId}`, msg + '\n');
        fs.appendFileSync(logFilePath, msg + '\n');
    };

    try {
        appConfig.status = 'deploying';
        await db.write();
        logProcess('Starting deployment process...');

        // 1 & 2. Synchronize repository (Clone or Fetch+Reset)
        logProcess('Synchronizing repository...');
        const { message: syncMsg, commitHash, commitMessage } = await gitService.syncRepo(appConfig.repoUrl, targetPath, appConfig.branch, appConfig.token);
        appConfig.commitHash = commitHash;
        appConfig.commitMessage = commitMessage;
        logProcess(`Git: ${syncMsg} on branch ${appConfig.branch} (Commit: ${commitMessage})`);

        // 3. Setup environment variables
        logProcess('Setting up environment variables...');
        const envFileData = Object.entries(appConfig.env || {})
            .map(([k, v]) => `${k}=${v}`)
            .join('\n');
        fs.writeFileSync(path.join(targetPath, '.env'), envFileData);

        // 4. Build Script
        if (appConfig.buildScript) {
            logProcess(`Executing build script...`);
            await new Promise((resolve, reject) => {
                const child = exec(appConfig.buildScript, { cwd: targetPath, maxBuffer: 10 * 1024 * 1024 });

                child.stdout.on('data', data => {
                    io.emit(`deploy-log-${appId}`, data);
                    fs.appendFileSync(logFilePath, data);
                });

                child.stderr.on('data', data => {
                    io.emit(`deploy-log-${appId}`, data);
                    fs.appendFileSync(logFilePath, data);
                });

                child.on('close', code => {
                    if (code !== 0) {
                        reject(new Error(`Build script exited with code ${code}`));
                    } else {
                        logProcess('Build script completed successfully.');
                        resolve();
                    }
                });

                child.on('error', err => {
                    reject(err);
                });
            });
        }

        // 5. Start with PM2
        logProcess('Starting application with PM2...');
        await pm2Service.connectPM2();

        // Convert args string to array for PM2, or fallback to ['start']
        let pmArgs = ['start'];
        if (appConfig.pm2Args) {
            // Split by space, e.g. "run dev" -> ["run", "dev"]
            pmArgs = appConfig.pm2Args.split(' ').filter(Boolean);
        }

        let startOptions = {
            name: appConfig.name,
            cwd: targetPath,
            script: appConfig.pm2Script || 'npm',
            args: appConfig.pm2Script === 'npm' ? pmArgs : [],
            env: appConfig.env || {}
        };

        if (appConfig.ecosystemFile) {
            startOptions = path.join(targetPath, appConfig.ecosystemFile);
        }

        logProcess('Stopping and removing any existing process...');
        try {
            await pm2Service.deleteApp(appConfig.name);
        } catch (e) {
            // Ignored, might not exist yet
        }

        await pm2Service.startApp(startOptions);

        appConfig.status = 'running';
        await db.write();
        logProcess('Deployment completed successfully!');
        await notificationService.notifyAll(appConfig.name, 'success');
        res.json({ success: true });

    } catch (err) {
        logProcess(`Deployment failed: ${err.message}`);
        if (err.stack) {
            logProcess(`Details: ${err.stack}`);
        }
        console.error(`[Deploy Error ${appConfig.name}]`, err);
        appConfig.status = 'failed';
        await db.write();
        await notificationService.notifyAll(appConfig.name, 'failed', err.message);
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

            const readTailLines = (filePath, prefix = '', maxLines = 15) => {
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

            const outLogs = readTailLines(outPath, `[out]`, 15);
            const errLogs = readTailLines(errPath, `[err]`, 15);

            if (outLogs || errLogs) {
                logs += '\n\n--- 🔵 PM2 Execution Logs ---\n';
                if (outLogs) logs += outLogs + '\n';
                if (errLogs) logs += errLogs + '\n';
            }
        }
    } catch (err) {
        console.error('Failed to fetch PM2 logs', err);
    }

    res.send(logs);
});

// GitHub Webhook Receiver
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    // express.raw is needed to get raw body if we parse JSON earlier.
    // Actually we already have express.json() in app.js. To do crypto verification,
    // we might need raw body if signatures are strictly enforced. We'll simplify here.
    const payload = req.body;
    const signature = req.headers['x-hub-signature-256'];
    const { webhookSecret } = db.data.settings;

    // Very simplistic check (ideal implementation uses raw-body for strict match)
    if (webhookSecret && signature) {
        const hmac = crypto.createHmac('sha256', webhookSecret);
        const digest = Buffer.from('sha256=' + hmac.update(JSON.stringify(payload)).digest('hex'), 'utf8');
        const checksum = Buffer.from(signature, 'utf8');
        if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
            return res.status(401).send('Signature mismatch');
        }
    }

    // Check if push event
    if (req.headers['x-github-event'] === 'push') {
        const repoUrl = payload.repository?.clone_url;
        const branch = payload.ref?.replace('refs/heads/', '');

        // Find matching apps
        const appsToDeploy = db.data.apps.filter(a =>
            a.repoUrl === repoUrl && a.branch === branch
        );

        res.status(202).send('Accepted');

        // Trigger deployments asynchronously (so GitHub gets fast response)
        for (const app of appsToDeploy) {
            try {
                await notificationService.notifyAll(app.name, 'Push event received, triggering deployment...');
                // We can simulate the deploy logic since we are in router
                fetch(`http://localhost:${process.env.PORT || 3001}/api/deploy/${app.id}`, {
                    method: 'POST',
                    // Usually we'd use local function call, but fetch triggers the same route logic
                    // omitting auth header or adding an internal secret
                }).catch(err => console.error('Webhook deploy trigger failed:', err));
            } catch (e) {
                console.error(e);
            }
        }
    } else {
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

export default router;
